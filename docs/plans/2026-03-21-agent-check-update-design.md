# Agent API 资源更新检查功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增 Agent API 接口用于检查 skill 或 prompt 是否有更新

**Architecture:** 在 `agentResources.ts` 中新增 `GET /check-update` 接口，接收 resourceType、name、version 参数，查询是否有同名资源的新版本

**Tech Stack:** Express.js, Mongoose, TypeScript

---

## Task 1: 编写接口设计和测试用例

**Files:**
- Modify: `docs/plans/2026-03-16-agent-api-upload-design.md` - 添加新接口文档
- Modify: `src/__tests__/agentResourcesVersion.test.ts` - 添加检查更新测试

**Step 1: 更新 API 设计文档**

在 `docs/plans/2026-03-16-agent-api-upload-design.md` 中添加：

```markdown
### 3.x GET /api/agent/check-update

**功能**：检查是否有同名资源的新版本

**认证**：需要 Agent API Key 认证

**请求参数**（Query）：
```typescript
{
  resourceType: 'skill' | 'prompt';  // 必填，资源类型
  name: string;                       // 必填，资源名称
  version: string;                    // 必填，当前版本号
}
```

**响应**：
```typescript
// 有更新
{
  hasUpdate: true;
  latestVersion: string;        // 最新版本号
  currentVersion: string;       // 传入的版本号
  updateAvailable: true;
  changelog?: string;           // 更新说明（如果有）
}

// 无更新
{
  hasUpdate: false;
  latestVersion: string;        // 当前最新版本号
  currentVersion: string;       // 传入的版本号
  updateAvailable: false;
}

// 资源不存在
{
  hasUpdate: false;
  updateAvailable: false;
  error: 'RESOURCE_NOT_FOUND';
  message: 'No resource found with the given name';
}
```

**状态码**：
- 200: 成功
- 400: 参数错误（缺少必填参数）
- 403: 权限不足
```

**Step 2: 编写测试用例**

在 `src/__tests__/agentResourcesVersion.test.ts` 中添加：

```typescript
describe('GET /api/agent/check-update', () => {
  let agent: any;
  let skill: any;
  let prompt: any;
  let skillVersion: any;

  beforeEach(async () => {
    // 创建 Agent
    agent = new Agent({
      name: 'Test Agent',
      owner: testUser._id,
      enterpriseId: testEnterprise._id,
      permissions: { canRead: true, canWrite: true, canDelete: true },
    });
    await agent.save();

    // 创建 Skill 和 SkillVersion
    skill = new Skill({
      name: 'Test Skill',
      description: 'Test skill description',
      owner: testUser._id,
      enterpriseId: testEnterprise._id,
      category: 'test',
      visibility: 'enterprise',
      version: '1.0.1',
      status: 'approved',
    });
    await skill.save();

    skillVersion = new SkillVersion({
      skillId: skill._id,
      version: '1.0.1',
      url: 'uploads/test.zip',
      filename: 'test.zip',
      originalName: 'test.zip',
      size: 1000,
      mimetype: 'application/zip',
      updateDescription: 'Bug fixes',
    });
    await skillVersion.save();

    // 创建 Prompt 和 PromptVersion
    prompt = new Prompt({
      name: 'Test Prompt',
      description: 'Test prompt description',
      owner: testUser._id,
      enterpriseId: testEnterprise._id,
      category: 'test',
      visibility: 'enterprise',
      version: '1.0.0',
      status: 'approved',
    });
    await prompt.save();
  });

  it('should return update info when newer version exists', async () => {
    const response = await request(app)
      .get('/api/agent/check-update')
      .query({ resourceType: 'skill', name: 'Test Skill', version: '1.0.0' })
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    expect(response.body.hasUpdate).toBe(true);
    expect(response.body.latestVersion).toBe('1.0.1');
    expect(response.body.currentVersion).toBe('1.0.0');
    expect(response.body.updateAvailable).toBe(true);
  });

  it('should return no update when already on latest version', async () => {
    const response = await request(app)
      .get('/api/agent/check-update')
      .query({ resourceType: 'skill', name: 'Test Skill', version: '1.0.1' })
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    expect(response.body.hasUpdate).toBe(false);
    expect(response.body.updateAvailable).toBe(false);
  });

  it('should check prompt updates', async () => {
    const response = await request(app)
      .get('/api/agent/check-update')
      .query({ resourceType: 'prompt', name: 'Test Prompt', version: '1.0.0' })
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(200);

    expect(response.body.hasUpdate).toBe(false);
  });

  it('should return 400 for missing parameters', async () => {
    const response = await request(app)
      .get('/api/agent/check-update')
      .query({ resourceType: 'skill' })
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(400);

    expect(response.body.error).toBe('MISSING_PARAMETERS');
  });

  it('should return 404 for non-existent resource', async () => {
    const response = await request(app)
      .get('/api/agent/check-update')
      .query({ resourceType: 'skill', name: 'NonExistent', version: '1.0.0' })
      .set('Authorization', `Bearer ${agentToken}`)
      .expect(404);

    expect(response.body.error).toBe('RESOURCE_NOT_FOUND');
  });
});
```

**Step 3: 运行测试验证失败**

Run: `npm test -- --testPathPattern=agentResourcesVersion`
Expected: FAIL with "check-update endpoint not implemented"

---

## Task 2: 实现接口逻辑

**Files:**
- Modify: `src/routes/agentResources.ts` - 添加新路由

**Step 1: 添加路由和控制器**

在 `agentResources.ts` 中添加：

```typescript
router.get('/check-update', async (req: AgentRequest, res: Response) => {
  try {
    if (!req.agent.permissions.canRead) {
      res.status(403).json({ error: 'Read permission denied' });
      return;
    }

    const { resourceType, name, version } = req.query;

    if (!resourceType || !name || !version) {
      res.status(400).json({
        error: 'MISSING_PARAMETERS',
        message: 'resourceType, name and version are required'
      });
      return;
    }

    if (resourceType !== 'skill' && resourceType !== 'prompt') {
      res.status(400).json({
        error: 'INVALID_RESOURCE_TYPE',
        message: 'resourceType must be "skill" or "prompt"'
      });
      return;
    }

    const Model = resourceType === 'skill' ? Skill : Prompt;
    const VersionModel = resourceType === 'skill' ? SkillVersion : PromptVersion;

    const filter: any = {
      name: name as string,
    };

    if (req.agent.enterpriseId) {
      filter.enterpriseId = req.agent.enterpriseId;
    } else {
      filter.visibility = 'public';
    }

    const resource = await Model.findOne(filter);

    if (!resource) {
      res.status(404).json({
        error: 'RESOURCE_NOT_FOUND',
        message: `No ${resourceType} found with the given name`
      });
      return;
    }

    const latestVersionDoc = await VersionModel.findOne({ [`${resourceType}Id`]: resource._id })
      .sort({ createdAt: -1 });

    const latestVersion = latestVersionDoc?.version || resource.version;

    const hasUpdate = compareVersions(version as string, latestVersion) > 0;

    res.json({
      hasUpdate,
      latestVersion,
      currentVersion: version,
      updateAvailable: hasUpdate,
      changelog: latestVersionDoc?.updateDescription || null,
    });
  } catch (error) {
    console.error('Check update error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to check for updates'
    });
  }
});

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
}
```

**Step 2: 添加 PromptVersion 模型导入**

确保文件头部导入了 PromptVersion：

```typescript
import { PromptVersion } from '../models/PromptVersion';
```

**Step 3: 运行测试验证**

Run: `npm test -- --testPathPattern=agentResourcesVersion`
Expected: PASS

---

## Task 3: 提交代码

```bash
git add src/routes/agentResources.ts src/__tests__/agentResourcesVersion.test.ts docs/plans/2026-03-16-agent-api-upload-design.md
git commit -m "feat(agent-api): add check-update endpoint for resource version monitoring"
```
