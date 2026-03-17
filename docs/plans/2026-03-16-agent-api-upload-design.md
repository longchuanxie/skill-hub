# Agent API 资源上传功能扩展设计

## 1. 需求概述

为 `/api/agent/skills` 和 `/api/agent/prompts` 接口添加资源上传功能，支持：

1. **公开市场上传**：非企业用户可以通过API key上传skill和prompt到公共市场
2. **企业资源上传**：企业员工的API key只能上传到所属企业
3. **自动审核机制**：程序自动审核内容，根据审核结果和配置决定是否需要人工审核
4. **企业审核配置**：企业管理员可通过settings页面配置企业资源的审核策略

## 2. 系统架构

### 2.1 数据模型扩展

#### 2.1.1 Enterprise 模型扩展

在 `settings` 中添加资源审核相关配置：

```typescript
interface IEnterprise extends Document {
  // ... 现有字段
  settings: {
    allowPublicShare: boolean;
    requireApproval: boolean;
    auth: {
      passwordLoginEnabled: boolean;
      oauthRequired: boolean;
    };
    // 新增：资源审核配置
    resourceReview: {
      autoApprove: boolean;  // 是否自动审核通过企业资源，默认 false
      enableContentFilter: boolean;  // 是否启用内容过滤，默认 true
    };
  };
}
```

#### 2.1.2 Skill/Prompt 模型

现有模型已包含所需字段：
- `visibility`: 'public' | 'private' | 'enterprise' | 'shared'
- `status`: 'draft' | 'pending' | 'approved' | 'rejected'
- `owner`: 上传者用户ID
- `enterpriseId`: 企业ID（如果是企业资源）

### 2.2 API 接口设计

#### 2.2.1 POST /api/agent/skills

**功能**：通过Agent API上传Skill

**认证**：需要Agent API Key认证

**权限**：
- 检查Agent的canWrite权限
- 企业用户的Agent只能上传到所属企业
- 非企业用户的Agent只能上传到公共市场

**请求参数**：
```typescript
{
  name: string;           // 必填，技能名称
  description: string;    // 必填，技能描述
  category?: string;      // 可选，分类，默认'general'
  tags?: string[];        // 可选，标签数组
  version?: string;       // 可选，版本号，默认'1.0.0'
  file?: File;            // 可选，ZIP文件
}
```

**响应**：
```typescript
{
  message: string;
  skill: Skill;
  visibility: 'enterprise' | 'public';
  status: 'approved' | 'pending';
  autoReviewResult?: {
    passed: boolean;
    reasons: string[];
    severity: 'low' | 'medium' | 'high';
  };
}
```

**状态码**：
- 201: 创建成功
- 400: 请求参数错误
- 403: 权限不足
- 500: 服务器错误

#### 2.2.2 POST /api/agent/prompts

**功能**：通过Agent API上传Prompt

**认证**：需要Agent API Key认证

**权限**：
- 检查Agent的canWrite权限
- 企业用户的Agent只能上传到所属企业
- 非企业用户的Agent只能上传到公共市场

**请求参数**：
```typescript
{
  name: string;           // 必填，提示词名称
  description: string;    // 必填，提示词描述
  content: string;        // 必填，提示词内容
  variables?: Variable[];  // 可选，变量定义
  category?: string;      // 可选，分类，默认'general'
  tags?: string[];        // 可选，标签数组
  version?: string;       // 可选，版本号，默认'1.0.0'
}
```

**响应**：
```typescript
{
  message: string;
  prompt: Prompt;
  visibility: 'enterprise' | 'public';
  status: 'approved' | 'pending';
  autoReviewResult?: {
    passed: boolean;
    reasons: string[];
    severity: 'low' | 'medium' | 'high';
  };
}
```

**状态码**：
- 201: 创建成功
- 400: 请求参数错误
- 403: 权限不足
- 500: 服务器错误

### 2.3 审核流程设计

#### 2.3.1 企业资源上传流程

```
1. 验证Agent的canWrite权限
   ↓
2. 检查Agent是否属于企业
   ↓
3. 设置visibility=enterprise，status=pending
   ↓
4. 执行程序审核（内容安全检查）
   ↓
5. 程序审核通过？
   ├─ 是 → 检查企业配置的resourceReview.autoApprove
   │        ├─ true → status转为approved
   │        └─ false → 保持pending等待人工审核
   └─ 否 → 保持pending
   ↓
6. 返回结果
```

#### 2.3.2 公共市场资源上传流程

```
1. 验证Agent的canWrite权限
   ↓
2. 检查Agent是否属于企业（应该为否）
   ↓
3. 设置visibility=public
   ↓
4. 执行程序审核（内容安全检查）
   ↓
5. 程序审核通过？
   ├─ 是 → status=approved
   └─ 否 → status=pending
   ↓
6. 返回结果
```

### 2.4 程序审核逻辑

#### 2.4.1 审核检查项

**通用检查**：
1. **敏感词过滤**
   - 检查名称、描述、内容中是否包含敏感词
   - 支持中英文敏感词库

2. **长度验证**
   - 名称：1-100字符
   - 描述：1-5000字符（Skill）/ 1-2000字符（Prompt）
   - 内容：1-50000字符（Prompt）

3. **格式验证**
   - 检查必填字段是否完整
   - 检查字段类型是否正确

**Skill特有检查**：
4. **文件验证**
   - 检查ZIP文件结构
   - 检查是否包含skill.json
   - 检查是否包含恶意代码

5. **版本格式验证**
   - 验证版本号格式（如1.0.0）

**Prompt特有检查**：
6. **变量格式验证**
   - 检查变量定义是否合法
   - 检查变量类型是否支持

#### 2.4.2 审核结果

```typescript
interface AutoReviewResult {
  passed: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high';
}
```

**严重程度定义**：
- `low`: 轻微问题，不影响审核通过
- `medium`: 中等问题，可能需要人工审核
- `high`: 严重问题，审核不通过

**审核通过规则**：
- 所有检查项的严重程度都为low或medium
- 没有high级别的检查项失败

## 3. 实现细节

### 3.1 权限验证

```typescript
// 检查Agent权限
if (!req.agent.permissions.canWrite) {
  return res.status(403).json({ error: 'Write permission denied' });
}

// 检查Agent是否属于企业
const isEnterpriseAgent = !!req.agent.enterpriseId;

// 设置visibility
const visibility = isEnterpriseAgent ? 'enterprise' : 'public';

// 设置enterpriseId
const enterpriseId = isEnterpriseAgent ? req.agent.enterpriseId : undefined;
```

### 3.2 程序审核实现

创建 `src/utils/resourceAutoReview.ts`：

```typescript
export interface AutoReviewResult {
  passed: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high';
}

export async function reviewSkill(skillData: any, filePath?: string): Promise<AutoReviewResult> {
  const reasons: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // 1. 敏感词检查
  const sensitiveWords = await checkSensitiveWords(skillData.name, skillData.description);
  if (sensitiveWords.length > 0) {
    reasons.push(`包含敏感词: ${sensitiveWords.join(', ')}`);
    severity = 'high';
  }

  // 2. 长度验证
  if (skillData.name.length < 1 || skillData.name.length > 100) {
    reasons.push('名称长度必须在1-100字符之间');
    severity = Math.max(severity, 'medium');
  }

  if (skillData.description.length < 1 || skillData.description.length > 5000) {
    reasons.push('描述长度必须在1-5000字符之间');
    severity = Math.max(severity, 'medium');
  }

  // 3. 文件验证（如果有文件）
  if (filePath) {
    const fileValidation = await validateSkillFile(filePath);
    if (!fileValidation.valid) {
      reasons.push(...fileValidation.errors);
      severity = Math.max(severity, fileValidation.severity);
    }
  }

  return {
    passed: severity !== 'high',
    reasons,
    severity
  };
}

export async function reviewPrompt(promptData: any): Promise<AutoReviewResult> {
  const reasons: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // 1. 敏感词检查
  const sensitiveWords = await checkSensitiveWords(
    promptData.name,
    promptData.description,
    promptData.content
  );
  if (sensitiveWords.length > 0) {
    reasons.push(`包含敏感词: ${sensitiveWords.join(', ')}`);
    severity = 'high';
  }

  // 2. 长度验证
  if (promptData.name.length < 1 || promptData.name.length > 100) {
    reasons.push('名称长度必须在1-100字符之间');
    severity = Math.max(severity, 'medium');
  }

  if (promptData.description.length < 1 || promptData.description.length > 2000) {
    reasons.push('描述长度必须在1-2000字符之间');
    severity = Math.max(severity, 'medium');
  }

  if (promptData.content.length < 1 || promptData.content.length > 50000) {
    reasons.push('内容长度必须在1-50000字符之间');
    severity = Math.max(severity, 'medium');
  }

  // 3. 变量格式验证
  if (promptData.variables && promptData.variables.length > 0) {
    const variableValidation = validateVariables(promptData.variables);
    if (!variableValidation.valid) {
      reasons.push(...variableValidation.errors);
      severity = Math.max(severity, 'medium');
    }
  }

  return {
    passed: severity !== 'high',
    reasons,
    severity
  };
}
```

### 3.3 状态设置逻辑

```typescript
// 企业资源
if (isEnterpriseAgent) {
  skill.visibility = 'enterprise';
  skill.status = 'pending';
  skill.enterpriseId = req.agent.enterpriseId;

  const reviewResult = await reviewSkill(skillData, filePath);
  
  if (reviewResult.passed) {
    const enterprise = await Enterprise.findById(req.agent.enterpriseId);
    if (enterprise?.settings.resourceReview.autoApprove) {
      skill.status = 'approved';
    }
  }
}

// 公共市场资源
else {
  skill.visibility = 'public';
  
  const reviewResult = await reviewSkill(skillData, filePath);
  skill.status = reviewResult.passed ? 'approved' : 'pending';
}
```

## 4. 测试计划

### 4.1 单元测试

- 测试程序审核逻辑
- 测试权限验证逻辑
- 测试状态设置逻辑

### 4.2 集成测试

- 测试企业用户上传流程
- 测试非企业用户上传流程
- 测试不同审核配置下的行为

### 4.3 API测试

- 测试POST /api/agent/skills接口
- 测试POST /api/agent/prompts接口
- 测试错误场景（权限不足、参数错误等）

## 5. 后续优化

1. **敏感词库管理**：支持动态更新敏感词库
2. **审核规则配置**：支持通过配置文件调整审核规则
3. **审核日志**：记录审核过程和结果，便于追溯
4. **人工审核界面**：为管理员提供人工审核界面
5. **审核统计**：统计审核通过率、常见问题等
