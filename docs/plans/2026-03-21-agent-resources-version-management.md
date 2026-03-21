# Agent Resources API 版本管理功能完善实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完善 agentResources.ts 接口，实现同名资源自动版本管理、版本记录创建和符合设计规范的响应结构

**Architecture:** 在现有的 Agent API 基础上，添加同名资源检测、版本号自动递增、版本记录创建逻辑，确保与 SkillController 和 PromptController 的实现保持一致

**Tech Stack:** Node.js, Express, TypeScript, MongoDB, Mongoose

---

## 问题分析

### 当前问题

1. **同名资源版本管理缺失**
   - agentResources.ts 没有检查同名资源
   - 每次都创建新记录，导致重复

2. **版本记录创建缺失**
   - 没有创建 SkillVersion / PromptVersion 记录
   - 没有创建 ResourceVersion 统一版本记录

3. **响应结构不符合设计**
   - 缺少 `isNew` 字段
   - 缺少 `previousVersion` 和 `currentVersion` 字段

4. **版本号生成逻辑缺失**
   - 没有自动递增版本号的逻辑

### 设计文档参考

- [skill-name-version-management.md](../design/skill-name-version-management.md)
- [agent-api-upload-design.md](./2026-03-16-agent-api-upload-design.md)

---

## Task 1: 添加版本号生成工具函数

**Files:**
- Create: `backend/src/utils/versionGenerator.ts`

**Step 1: 创建版本号生成工具**

```typescript
import { Types } from 'mongoose';
import { SkillVersion } from '../models/SkillVersion';
import { PromptVersion } from '../models/PromptVersion';

export async function generateNextSkillVersion(skillId: Types.ObjectId): Promise<string> {
  const versions = await SkillVersion.find({ skillId }).sort({ createdAt: -1 });
  
  if (versions.length === 0) {
    return '1.0.0';
  }
  
  const lastVersion = versions[0].version;
  const parts = lastVersion.split('.').map(Number);
  
  parts[2] = (parts[2] || 0) + 1;
  
  if (parts[2] > 99) {
    parts[2] = 0;
    parts[1] = (parts[1] || 0) + 1;
  }
  
  if (parts[1] > 99) {
    parts[1] = 0;
    parts[0] = (parts[0] || 0) + 1;
  }
  
  return parts.join('.');
}

export async function generateNextPromptVersion(promptId: Types.ObjectId): Promise<string> {
  const versions = await PromptVersion.find({ promptId }).sort({ createdAt: -1 });
  
  if (versions.length === 0) {
    return '1.0.0';
  }
  
  const lastVersion = versions[0].version;
  const parts = lastVersion.split('.').map(Number);
  
  parts[2] = (parts[2] || 0) + 1;
  
  if (parts[2] > 99) {
    parts[2] = 0;
    parts[1] = (parts[1] || 0) + 1;
  }
  
  if (parts[1] > 99) {
    parts[1] = 0;
    parts[0] = (parts[0] || 0) + 1;
  }
  
  return parts.join('.');
}
```

**Step 2: 验证工具函数创建成功**

Run: 检查文件是否创建成功
Expected: 文件存在且内容正确

**Step 3: Commit**

```bash
git add backend/src/utils/versionGenerator.ts
git commit -m "feat: add version generator utilities for skills and prompts"
```

---

## Task 2: 修改 POST /api/agent/skills 接口

**Files:**
- Modify: `backend/src/routes/agentResources.ts:56-132`

**Step 1: 添加必要的导入**

在文件顶部添加：

```typescript
import { SkillVersion } from '../models/SkillVersion';
import { ResourceVersion } from '../models/ResourceVersion';
import { generateNextSkillVersion } from '../utils/versionGenerator';
```

**Step 2: 修改 POST /api/agent/skills 路由处理函数**

在创建新技能之前，添加同名技能检查逻辑：

```typescript
router.post('/skills', skillFileUpload, async (req: AgentRequest, res: Response) => {
  try {
    if (!req.agent.permissions.canWrite) {
      res.status(403).json({ error: 'Write permission denied' });
      return;
    }

    const { name, description, category, tags, version, updateDescription } = req.body;
    const isEnterpriseAgent = !!req.agent.enterpriseId;

    // 检查同名技能是否存在
    const existingSkill = await Skill.findOne({
      owner: req.agent.owner,
      name: name,
    });

    if (existingSkill) {
      // 同名技能存在，执行版本更新逻辑
      const previousVersion = existingSkill.version;
      const newVersion = await generateNextSkillVersion(existingSkill._id);

      const hasFile = req.file != null;

      // 如果有文件，创建版本记录
      if (hasFile) {
        if (!req.file!.originalname.endsWith('.zip')) {
          res.status(400).json({
            error: 'INVALID_FILE_TYPE',
            message: 'Only ZIP files are allowed'
          });
          return;
        }

        const fileUrl = `/uploads/${req.file!.filename}`;

        // 创建 SkillVersion 记录
        const skillVersion = new SkillVersion({
          skillId: existingSkill._id,
          version: newVersion,
          url: fileUrl,
          filename: req.file!.filename,
          originalName: req.file!.originalname,
          size: req.file!.size,
          mimetype: req.file!.mimetype,
          updateDescription: updateDescription || `Update to version ${newVersion}`,
        });
        await skillVersion.save();

        // 添加文件到技能
        existingSkill.files.push({
          filename: req.file!.originalname,
          originalName: req.file!.originalname,
          path: fileUrl,
          size: req.file!.size,
          mimetype: req.file!.mimetype,
        });

        // 创建 ResourceVersion 记录
        const resourceVersion = new ResourceVersion({
          resourceId: existingSkill._id,
          resourceType: 'skill',
          version: newVersion,
          versionNumber: parseInt(newVersion.split('.').join('')),
          content: description || existingSkill.description || '',
          files: [{
            filename: req.file!.originalname,
            path: fileUrl,
            size: req.file!.size,
            mimetype: req.file!.mimetype,
          }],
          changelog: updateDescription || `Update to version ${newVersion}`,
          tags: tags || existingSkill.tags || [],
          isActive: true,
          createdBy: req.agent.owner,
        });
        await resourceVersion.save();
      }

      // 更新技能主记录
      existingSkill.version = newVersion;
      if (description) existingSkill.description = description;
      if (category) existingSkill.category = category;
      if (tags && tags.length > 0) existingSkill.tags = tags;
      await existingSkill.save();

      res.status(200).json({
        message: 'Skill version updated successfully',
        skill: existingSkill,
        isNew: false,
        previousVersion,
        currentVersion: newVersion,
      });
      return;
    }

    // 创建新技能的逻辑（保持原有逻辑）
    const skillData: any = {
      name,
      description,
      category: category || 'general',
      tags: tags || [],
      owner: req.agent.owner,
      visibility: isEnterpriseAgent ? 'enterprise' : 'public',
      version: version || '1.0.0',
      files: [],
    };

    if (isEnterpriseAgent) {
      skillData.enterpriseId = req.agent.enterpriseId;
      skillData.status = 'pending';
    }

    const hasFile = req.file != null;

    if (hasFile) {
      if (!req.file!.originalname.endsWith('.zip')) {
        res.status(400).json({
          error: 'INVALID_FILE_TYPE',
          message: 'Only ZIP files are allowed'
        });
        return;
      }

      const fileUrl = `/uploads/${req.file!.filename}`;
      const newVersion = {
        version: version || '1.0.0',
        url: fileUrl,
        createdAt: new Date(),
      };

      skillData.files = [{
        filename: req.file!.originalname,
        originalName: req.file!.originalname,
        path: fileUrl,
        size: req.file!.size,
        mimetype: req.file!.mimetype,
      }];
    }

    const filePath = hasFile ? req.file!.path : undefined;
    const reviewResult = await reviewSkill(skillData, filePath);

    if (isEnterpriseAgent) {
      if (reviewResult.passed) {
        const enterprise = await Enterprise.findById(req.agent.enterpriseId);
        if (enterprise?.settings.resourceReview.autoApprove) {
          skillData.status = 'approved';
        }
      }
    } else {
      skillData.status = reviewResult.passed ? 'approved' : 'pending';
    }

    const skill = new Skill(skillData);
    await skill.save();

    // 创建初始版本记录
    if (hasFile) {
      const skillVersion = new SkillVersion({
        skillId: skill._id,
        version: skill.version,
        url: skillData.files[0].path,
        filename: req.file!.filename,
        originalName: req.file!.originalname,
        size: req.file!.size,
        mimetype: req.file!.mimetype,
        updateDescription: 'Initial version',
      });
      await skillVersion.save();

      const resourceVersion = new ResourceVersion({
        resourceId: skill._id,
        resourceType: 'skill',
        version: skill.version,
        versionNumber: parseInt(skill.version.split('.').join('')),
        content: skill.description || '',
        files: skillData.files,
        changelog: 'Initial version',
        tags: skill.tags || [],
        isActive: true,
        createdBy: req.agent.owner,
      });
      await resourceVersion.save();
    }

    res.status(201).json({
      message: 'Skill created successfully',
      skill,
      isNew: true,
      visibility: skillData.visibility,
      status: skillData.status,
      autoReviewResult: reviewResult,
    });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create skill'
    });
  }
});
```

**Step 3: 验证修改**

Run: TypeScript 编译检查
Expected: 无编译错误

**Step 4: Commit**

```bash
git add backend/src/routes/agentResources.ts
git commit -m "feat: implement skill version management in agent API"
```

---

## Task 3: 修改 POST /api/agent/prompts 接口

**Files:**
- Modify: `backend/src/routes/agentResources.ts:134-232`

**Step 1: 添加必要的导入**

在文件顶部添加：

```typescript
import { PromptVersion } from '../models/PromptVersion';
import { generateNextPromptVersion } from '../utils/versionGenerator';
```

**Step 2: 修改 POST /api/agent/prompts 路由处理函数**

```typescript
router.post('/prompts', async (req: AgentRequest, res: Response) => {
  try {
    if (!req.agent.permissions.canWrite) {
      res.status(403).json({ error: 'Write permission denied' });
      return;
    }

    const { name, description, content, variables, category, tags, version, updateDescription } = req.body;
    const isEnterpriseAgent = !!req.agent.enterpriseId;

    // 检查同名提示词是否存在
    const existingPrompt = await Prompt.findOne({
      owner: req.agent.owner,
      name: name,
    });

    if (existingPrompt) {
      // 同名提示词存在，执行版本更新逻辑
      const previousVersion = existingPrompt.version;
      const newVersion = await generateNextPromptVersion(existingPrompt._id);

      // 创建 PromptVersion 记录
      const promptVersion = new PromptVersion({
        promptId: existingPrompt._id,
        version: newVersion,
        content: content || existingPrompt.content,
        description: description || existingPrompt.description,
        variables: variables || existingPrompt.variables,
        updateDescription: updateDescription || `Update to version ${newVersion}`,
      });
      await promptVersion.save();

      // 创建 ResourceVersion 记录
      const resourceVersion = new ResourceVersion({
        resourceId: existingPrompt._id,
        resourceType: 'prompt',
        version: newVersion,
        versionNumber: parseInt(newVersion.split('.').join('')),
        content: content || existingPrompt.content,
        files: [],
        changelog: updateDescription || `Update to version ${newVersion}`,
        tags: tags || existingPrompt.tags || [],
        isActive: true,
        createdBy: req.agent.owner,
      });
      await resourceVersion.save();

      // 更新提示词主记录
      existingPrompt.version = newVersion;
      if (content) existingPrompt.content = content;
      if (description) existingPrompt.description = description;
      if (variables) existingPrompt.variables = variables;
      if (category) existingPrompt.category = category;
      if (tags && tags.length > 0) existingPrompt.tags = tags;
      await existingPrompt.save();

      res.status(200).json({
        message: 'Prompt version updated successfully',
        prompt: existingPrompt,
        isNew: false,
        previousVersion,
        currentVersion: newVersion,
      });
      return;
    }

    // 创建新提示词的逻辑（保持原有逻辑）
    const promptData: any = {
      name,
      description,
      content,
      variables: variables || [],
      category: category || 'general',
      tags: tags || [],
      owner: req.agent.owner,
      visibility: isEnterpriseAgent ? 'enterprise' : 'public',
      version: version || '1.0.0',
    };

    if (isEnterpriseAgent) {
      promptData.enterpriseId = req.agent.enterpriseId;
      promptData.status = 'pending';
    }

    const reviewResult = await reviewPrompt(promptData);

    if (isEnterpriseAgent) {
      if (reviewResult.passed) {
        const enterprise = await Enterprise.findById(req.agent.enterpriseId);
        if (enterprise?.settings.resourceReview.autoApprove) {
          promptData.status = 'approved';
        }
      }
    } else {
      promptData.status = reviewResult.passed ? 'approved' : 'pending';
    }

    const prompt = new Prompt(promptData);
    await prompt.save();

    // 创建初始版本记录
    const promptVersion = new PromptVersion({
      promptId: prompt._id,
      version: prompt.version,
      content,
      description,
      variables: variables || [],
      updateDescription: updateDescription || 'Initial version',
    });
    await promptVersion.save();

    const resourceVersion = new ResourceVersion({
      resourceId: prompt._id,
      resourceType: 'prompt',
      version: prompt.version,
      versionNumber: parseInt(prompt.version.split('.').join('')),
      content,
      files: [],
      changelog: updateDescription || 'Initial version',
      tags: tags || [],
      isActive: true,
      createdBy: req.agent.owner,
    });
    await resourceVersion.save();

    res.status(201).json({
      message: 'Prompt created successfully',
      prompt,
      isNew: true,
      visibility: promptData.visibility,
      status: promptData.status,
      autoReviewResult: reviewResult,
    });
  } catch (error) {
    console.error('Create prompt error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create prompt'
    });
  }
});
```

**Step 3: 验证修改**

Run: TypeScript 编译检查
Expected: 无编译错误

**Step 4: Commit**

```bash
git add backend/src/routes/agentResources.ts
git commit -m "feat: implement prompt version management in agent API"
```

---

## Task 4: 更新接口文档

**Files:**
- Modify: `docs/plans/2026-03-16-agent-api-upload-design.md`

**Step 1: 更新响应结构文档**

在文档中更新 POST /api/agent/skills 和 POST /api/agent/prompts 的响应结构说明：

```markdown
**响应**（新建资源）：
```typescript
{
  message: string;
  skill: Skill;
  isNew: true;  // 新增字段
  visibility: 'enterprise' | 'public';
  status: 'approved' | 'pending';
  autoReviewResult?: {
    passed: boolean;
    reasons: string[];
    severity: 'low' | 'medium' | 'high';
  };
}
```

**响应**（同名资源版本更新）：
```typescript
{
  message: string;
  skill: Skill;
  isNew: false;  // 新增字段
  previousVersion: string;  // 新增字段
  currentVersion: string;  // 新增字段
}
```
```

**Step 2: Commit**

```bash
git add docs/plans/2026-03-16-agent-api-upload-design.md
git commit -m "docs: update agent API response structure documentation"
```

---

## Task 5: 编写测试用例

**Files:**
- Create: `backend/src/__tests__/agentResourcesVersion.test.ts`

**Step 1: 创建测试文件**

```typescript
import request from 'supertest';
import app from '../app';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { SkillVersion } from '../models/SkillVersion';
import { PromptVersion } from '../models/PromptVersion';
import { ResourceVersion } from '../models/ResourceVersion';
import { Agent } from '../models/Agent';
import { User } from '../models/User';

describe('Agent Resources Version Management', () => {
  let agentToken: string;
  let userId: string;

  beforeEach(async () => {
    // 创建测试用户和 Agent
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    userId = user._id.toString();

    const agent = await Agent.create({
      name: 'Test Agent',
      owner: userId,
      permissions: {
        canRead: true,
        canWrite: true,
      },
      apiKey: 'test-api-key',
    });

    agentToken = agent.apiKey;
  });

  describe('POST /api/agent/skills', () => {
    it('should create new skill when name is unique', async () => {
      const response = await request(app)
        .post('/api/agent/skills')
        .set('Authorization', `Bearer ${agentToken}`)
        .field('name', 'unique-skill')
        .field('description', 'Test skill')
        .expect(201);

      expect(response.body.isNew).toBe(true);
      expect(response.body.skill.name).toBe('unique-skill');
      expect(response.body.skill.version).toBe('1.0.0');
    });

    it('should create new version when skill name exists', async () => {
      // 创建第一个技能
      await request(app)
        .post('/api/agent/skills')
        .set('Authorization', `Bearer ${agentToken}`)
        .field('name', 'duplicate-skill')
        .field('description', 'First version')
        .expect(201);

      // 创建同名技能（应该创建新版本）
      const response = await request(app)
        .post('/api/agent/skills')
        .set('Authorization', `Bearer ${agentToken}`)
        .field('name', 'duplicate-skill')
        .field('description', 'Second version')
        .expect(200);

      expect(response.body.isNew).toBe(false);
      expect(response.body.previousVersion).toBe('1.0.0');
      expect(response.body.currentVersion).toBe('1.0.1');
    });

    it('should create SkillVersion and ResourceVersion records', async () => {
      const response = await request(app)
        .post('/api/agent/skills')
        .set('Authorization', `Bearer ${agentToken}`)
        .field('name', 'version-test-skill')
        .field('description', 'Test skill')
        .expect(201);

      const skillId = response.body.skill._id;

      const skillVersions = await SkillVersion.find({ skillId });
      expect(skillVersions.length).toBe(1);
      expect(skillVersions[0].version).toBe('1.0.0');

      const resourceVersions = await ResourceVersion.find({ 
        resourceId: skillId,
        resourceType: 'skill'
      });
      expect(resourceVersions.length).toBe(1);
    });
  });

  describe('POST /api/agent/prompts', () => {
    it('should create new prompt when name is unique', async () => {
      const response = await request(app)
        .post('/api/agent/prompts')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          name: 'unique-prompt',
          description: 'Test prompt',
          content: 'This is a test prompt',
          updateDescription: 'Initial version',
        })
        .expect(201);

      expect(response.body.isNew).toBe(true);
      expect(response.body.prompt.name).toBe('unique-prompt');
      expect(response.body.prompt.version).toBe('1.0.0');
    });

    it('should create new version when prompt name exists', async () => {
      // 创建第一个提示词
      await request(app)
        .post('/api/agent/prompts')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          name: 'duplicate-prompt',
          description: 'First version',
          content: 'First content',
          updateDescription: 'Initial version',
        })
        .expect(201);

      // 创建同名提示词（应该创建新版本）
      const response = await request(app)
        .post('/api/agent/prompts')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          name: 'duplicate-prompt',
          description: 'Second version',
          content: 'Second content',
          updateDescription: 'Updated version',
        })
        .expect(200);

      expect(response.body.isNew).toBe(false);
      expect(response.body.previousVersion).toBe('1.0.0');
      expect(response.body.currentVersion).toBe('1.0.1');
    });

    it('should create PromptVersion and ResourceVersion records', async () => {
      const response = await request(app)
        .post('/api/agent/prompts')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          name: 'version-test-prompt',
          description: 'Test prompt',
          content: 'Test content',
          updateDescription: 'Initial version',
        })
        .expect(201);

      const promptId = response.body.prompt._id;

      const promptVersions = await PromptVersion.find({ promptId });
      expect(promptVersions.length).toBe(1);
      expect(promptVersions[0].version).toBe('1.0.0');

      const resourceVersions = await ResourceVersion.find({ 
        resourceId: promptId,
        resourceType: 'prompt'
      });
      expect(resourceVersions.length).toBe(1);
    });
  });
});
```

**Step 2: 运行测试**

Run: `npm test -- agentResourcesVersion.test.ts`
Expected: 所有测试通过

**Step 3: Commit**

```bash
git add backend/src/__tests__/agentResourcesVersion.test.ts
git commit -m "test: add tests for agent resources version management"
```

---

## Task 6: 运行完整测试套件

**Step 1: 运行所有测试**

Run: `npm test`
Expected: 所有测试通过

**Step 2: 运行 TypeScript 编译检查**

Run: `npm run build`
Expected: 编译成功，无错误

**Step 3: 运行 lint 检查**

Run: `npm run lint`
Expected: 无 lint 错误

---

## 验收标准

### 功能验收

- [ ] 同名技能自动创建新版本
- [ ] 同名提示词自动创建新版本
- [ ] 版本号自动递增（1.0.0 → 1.0.1）
- [ ] 创建 SkillVersion 记录
- [ ] 创建 PromptVersion 记录
- [ ] 创建 ResourceVersion 记录
- [ ] 响应包含 isNew 字段
- [ ] 响应包含 previousVersion 和 currentVersion 字段

### 测试验收

- [ ] 所有单元测试通过
- [ ] TypeScript 编译无错误
- [ ] Lint 检查无错误

### 文档验收

- [ ] API 文档已更新
- [ ] 响应结构说明清晰

---

## 执行选项

**Plan complete and saved to `docs/plans/2026-03-21-agent-resources-version-management.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
