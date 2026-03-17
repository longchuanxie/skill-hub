# SkillHub 后端 - API接口设计

## 1. API接口总览

本文档详细描述SkillHub后端的所有API接口设计，包括认证、用户、Skill、提示词、企业、文件上传和智能体模块。

## 2. 认证模块 `/api/auth`

### 2.1 用户注册
```
POST /api/auth/register
权限: 公开
```

**请求体**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "enterpriseCode": "string?"
}
```

**响应**:
```json
{
  "message": "注册成功",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string",
    "role": "user",
    "enterpriseId": "enterprise_id?"
  }
}
```

**错误响应**:
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | USERNAME_EXISTS | 用户名已存在 |
| 400 | EMAIL_EXISTS | 邮箱已存在 |
| 400 | INVALID_EMAIL | 邮箱格式无效 |
| 400 | WEAK_PASSWORD | 密码强度不足 |

### 2.2 用户登录
```
POST /api/auth/login
权限: 公开
```

**请求体**:
```json
{
  "account": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "expiresIn": 3600,
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string",
    "role": "user",
    "avatar": "url",
    "enterpriseId": "enterprise_id?"
  }
}
```

**错误响应**:
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 401 | INVALID_CREDENTIALS | 用户名或密码错误 |
| 403 | ACCOUNT_LOCKED | 账户已锁定 |
| 403 | ACCOUNT_BANNED | 账户已禁用 |

### 2.3 刷新Token
```
POST /api/auth/refresh
权限: 需要认证
```

**请求头**:
```
Authorization: Bearer refresh_token
```

**响应**:
```json
{
  "token": "new_jwt_token",
  "expiresIn": 3600
}
```

### 2.4 登出
```
POST /api/auth/logout
权限: 需要认证
```

**说明**: 客户端应删除本地存储的token

### 2.5 发送密码重置邮件
```
POST /api/auth/forgot-password
权限: 公开
```

**请求体**:
```json
{
  "email": "string"
}
```

**响应**:
```json
{
  "message": "如果该邮箱存在，已发送密码重置链接"
}
```

**安全说明**: 为防止邮箱枚举攻击，无论邮箱是否存在都返回相同消息

### 2.6 重置密码
```
POST /api/auth/reset-password
权限: 公开
```

**请求体**:
```json
{
  "token": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "message": "密码重置成功",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string"
  }
}
```

### 2.7 验证密码重置Token
```
GET /api/auth/verify-reset-token
权限: 公开
```

**查询参数**: `?token=string`

**响应**:
```json
{
  "valid": true,
  "userId": "user_id"
}
```

### 2.8 发送邮箱验证邮件
```
POST /api/auth/send-verification-email
权限: 需要认证(未验证邮箱的用户)
```

**响应**:
```json
{
  "message": "验证邮件已发送"
}
```

### 2.9 验证邮箱
```
POST /api/auth/verify-email
权限: 公开
```

**请求体**:
```json
{
  "token": "string"
}
```

**响应**:
```json
{
  "message": "邮箱验证成功",
  "user": {
    "id": "user_id",
    "email": "string",
    "emailVerified": true
  }
}
```

### 2.10 检查邮箱验证状态
```
GET /api/auth/email-verification-status
权限: 需要认证
```

**响应**:
```json
{
  "emailVerified": true,
  "email": "user@example.com"
}
```

## 3. 用户模块 `/api/users`

### 3.1 获取当前用户信息
```
GET /api/users/me
权限: 需要认证
```

**响应**:
```json
{
  "id": "user_id",
  "username": "string",
  "email": "string",
  "role": "user",
  "enterpriseId": "enterprise_id?",
  "avatar": "url?",
  "bio": "string?",
  "emailVerified": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLoginAt": "2024-01-15T00:00:00Z"
}
```

### 3.2 更新用户信息
```
PUT /api/users/me
权限: 需要认证
```

**请求体**:
```json
{
  "username": "string?",
  "bio": "string?",
  "avatar": "string?"
}
```

**响应**:
```json
{
  "id": "user_id",
  "username": "string",
  "email": "string",
  "bio": "string?",
  "avatar": "url?"
}
```

### 3.3 获取用户公开资料
```
GET /api/users/:id/profile
权限: 公开
```

**响应**:
```json
{
  "id": "user_id",
  "username": "string",
  "avatar": "url?",
  "bio": "string?",
  "skillsCount": 10,
  "promptsCount": 5,
  "joinedAt": "2024-01-01T00:00:00Z"
}
```

### 3.4 修改密码
```
PUT /api/users/me/password
权限: 需要认证
```

**请求体**:
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**响应**:
```json
{
  "message": "密码修改成功"
}
```

## 4. Skill模块 `/api/skills`

### 4.1 获取Skill列表
```
GET /api/skills
权限: 公开(公开市场) / 需要认证(企业市场)
```

**查询参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `market` | string | "public" | 市场类型: public/enterprise |
| `category` | string | - | 分类筛选 |
| `tags` | string | - | 标签筛选(逗号分隔) |
| `search` | string | - | 搜索关键词 |
| `sort` | string | "createdAt" | 排序字段 |
| `order` | string | "desc" | 排序方向 asc/desc |
| `page` | number | 1 | 页码 |
| `limit` | number | 20 | 每页数量 |

**响应**:
```json
{
  "items": [
    {
      "id": "skill_id",
      "name": "代码审查助手",
      "description": "自动审查代码质量问题",
      "version": "1.2.0",
      "tags": ["code", "review"],
      "category": "development",
      "author": {
        "id": "user_id",
        "username": "developer1",
        "avatar": "url"
      },
      "stats": {
        "downloadCount": 1234,
        "avgRating": 4.5,
        "ratingCount": 89
      },
      "marketType": "public",
      "status": "approved",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### 4.2 获取Skill详情
```
GET /api/skills/:id
权限: 根据资源权限判断
```

**权限检查逻辑**:
```typescript
async function canAccessSkill(skill: Skill, user: User | null): Promise<boolean> {
  // 公开资源
  if (skill.permissions.type === 'public') {
    return true;
  }
  
  // 需要登录
  if (!user) return false;
  
  // 管理员可访问所有
  if (user.role === 'admin') return true;
  
  // 私有资源仅作者可访问
  if (skill.permissions.type === 'private') {
    return skill.author.toString() === user._id.toString();
  }
  
  // 企业资源仅同企业成员可访问
  if (skill.permissions.type === 'enterprise') {
    return user.enterpriseId?.toString() === skill.enterpriseId?.toString();
  }
  
  // 共享资源仅指定用户可访问
  if (skill.permissions.type === 'shared') {
    return skill.permissions.sharedWith?.includes(user._id);
  }
  
  return false;
}
```

### 4.3 创建Skill
```
POST /api/skills
权限: 需要认证 (developer及以上)
```

**请求头**:
```
Content-Type: multipart/form-data
```

**请求体**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | Skill名称 |
| description | string | 是 | Skill描述 |
| version | string | 是 | 版本号 |
| file | File | 是 | Skill文件 |
| category | string | 是 | 分类 |
| tags | string[] | 否 | 标签 |
| marketType | string | 是 | 市场类型 |
| permissions.type | string | 是 | 权限类型 |
| permissions.sharedWith | string[] | 否 | 共享用户列表 |

**权限检查中间件**:
```typescript
const canCreateSkill = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ message: '未登录' });
  }
  
  if (user.status !== 'active') {
    return res.status(403).json({ message: '账户状态异常' });
  }
  
  const allowedRoles = ['admin', 'enterprise_admin', 'developer'];
  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({ message: '无上传权限' });
  }
  
  if (req.body.marketType === 'enterprise' && !user.enterpriseId) {
    return res.status(403).json({ message: '无企业市场上传权限' });
  }
  
  next();
};
```

### 4.4 更新Skill
```
PUT /api/skills/:id
权限: 需要认证 + 资源所有权验证
```

**请求体**:
```json
{
  "name": "string?",
  "description": "string?",
  "tags": ["string"]?,
  "permissions": {
    "type": "public|private|enterprise|shared",
    "sharedWith": ["user_id"]?
  }
}
```

### 4.5 删除Skill
```
DELETE /api/skills/:id
权限: 需要认证 + 资源所有权验证
```

**响应**:
```json
{
  "message": "Skill删除成功"
}
```

### 4.6 下载Skill
```
GET /api/skills/:id/download
权限: 根据资源权限判断
```

**响应**: 返回Skill文件(压缩包)

**响应头**:
```
Content-Disposition: attachment; filename="skill-name-v1.0.0.zip"
Content-Type: application/zip
```

### 4.7 评分Skill
```
POST /api/skills/:id/ratings
权限: 需要认证
```

**请求体**:
```json
{
  "score": 5,
  "comment": "string?"
}
```

**响应**:
```json
{
  "id": "rating_id",
  "score": 5,
  "comment": "string?",
  "user": {
    "id": "user_id",
    "username": "string"
  },
  "createdAt": "2024-01-15T10:00:00Z"
}
```

## 5. 提示词模块 `/api/prompts`

### 5.1 获取提示词列表
```
GET /api/prompts
权限: 公开(公开市场) / 需要认证(企业市场)
```

**查询参数**: 同Skill列表

**响应**: 同Skill列表结构，替换为Prompt字段

### 5.2 获取提示词详情
```
GET /api/prompts/:id
权限: 根据资源权限判断
```

### 5.3 创建提示词
```
POST /api/prompts
权限: 需要认证 (developer及以上) + 安全检测
```

**请求体**:
```json
{
  "name": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"],
  "marketType": "public|enterprise",
  "permissions": {
    "type": "public|private|enterprise|shared",
    "sharedWith": ["user_id"]
  }
}
```

**安全检测**: 见下文安全检测中间件

### 5.4 更新提示词
```
PUT /api/prompts/:id
权限: 需要认证 + 资源所有权验证 + 安全检测
```

### 5.5 删除提示词
```
DELETE /api/prompts/:id
权限: 需要认证 + 资源所有权验证
```

### 5.6 评分提示词
```
POST /api/prompts/:id/ratings
权限: 需要认证
```

### 5.7 安全检测中间件

**安全检测内容**:
```typescript
async function detectSecurityIssues(content: string): Promise<string[]> {
  const issues: string[] = [];
  
  const dangerousPatterns = [
    // 代码执行类
    { pattern: /eval\s*\(/gi, message: '禁止使用eval函数' },
    { pattern: /Function\s*\(/gi, message: '禁止使用Function构造函数' },
    { pattern: /setTimeout\s*\(\s*['"`]/gi, message: '禁止使用setTimeout动态执行代码' },
    { pattern: /setInterval\s*\(\s*['"`]/gi, message: '禁止使用setInterval动态执行代码' },
    { pattern: /new\s+Function\s*\(/gi, message: '禁止使用Function构造函数' },
    
    // 进程/系统操作类
    { pattern: /process\.exit/gi, message: '禁止调用process.exit' },
    { pattern: /process\.binding/gi, message: '禁止使用process.binding' },
    { pattern: /process\.dlopen/gi, message: '禁止使用process.dlopen' },
    { pattern: /exec\s*\(/gi, message: '禁止使用exec函数' },
    { pattern: /execSync/gi, message: '禁止使用execSync' },
    { pattern: /execFile/gi, message: '禁止使用execFile' },
    { pattern: /spawn\s*\(/gi, message: '禁止使用spawn函数' },
    { pattern: /spawnSync/gi, message: '禁止使用spawnSync' },
    { pattern: /fork\s*\(/gi, message: '禁止使用fork函数' },
    
    // 模块导入类
    { pattern: /require\s*\(\s*['"]child_process['"]\s*\)/gi, message: '禁止导入child_process模块' },
    { pattern: /require\s*\(\s*['"]fs['"]\s*\)/gi, message: '禁止导入fs模块' },
    { pattern: /require\s*\(\s*['"]net['"]\s*\)/gi, message: '禁止导入net模块' },
    { pattern: /require\s*\(\s*['"]http['"]\s*\)/gi, message: '禁止导入http模块' },
    { pattern: /require\s*\(\s*['"]https['"]\s*\)/gi, message: '禁止导入https模块' },
    { pattern: /require\s*\(\s*['"]tls['"]\s*\)/gi, message: '禁止导入tls模块' },
    { pattern: /require\s*\(\s*['"]crypto['"]\s*\)/gi, message: '禁止导入crypto模块' },
    
    // 原型链操作类
    { pattern: /__proto__/gi, message: '禁止访问__proto__' },
    { pattern: /prototype\s*\[/gi, message: '禁止动态访问prototype' },
    { pattern: /\[\s*['"]__proto__['"]\s*\]/gi, message: '禁止访问__proto__' },
    
    // 环境变量访问类
    { pattern: /process\.env/gi, message: '禁止访问环境变量' },
    { pattern: /dotenv/gi, message: '禁止使用dotenv访问环境变量' },
    
    // 提示词注入类
    { pattern: /ignore\s+previous\s+instructions/gi, message: '检测到潜在的提示词注入' },
    { pattern: /ignore\s+all\s+previous\s+instructions/gi, message: '检测到潜在的提示词注入' },
    { pattern: /system\s*:\s*/gi, message: '检测到潜在的角色劫持' },
    { pattern: /you\s+are\s+now/gi, message: '检测到潜在的角色扮演' },
    { pattern: /previous\s+system\s+message/gi, message: '检测到提示词覆盖尝试' },
    { pattern: /disregard\s+previous\s+instructions/gi, message: '检测到提示词注入' },
    
    // 命令注入类
    { pattern: /\|\s*sh/gi, message: '检测到管道命令注入' },
    { pattern: /&&\s*\w+/gi, message: '检测到命令链注入' },
    { pattern: /;\s*\w+/gi, message: '检测到命令分隔符注入' },
  ];
  
  for (const { pattern, message } of dangerousPatterns) {
    if (pattern.test(content)) {
      issues.push(message);
    }
  }
  
  return issues;
}
```

## 6. 企业模块 `/api/enterprises`

### 6.1 创建企业
```
POST /api/enterprises
权限: 需要认证 (admin)
```

**请求体**:
```json
{
  "name": "string",
  "domain": "string",
  "description": "string?",
  "settings": {
    "maxMembers": 100,
    "maxStorage": 10737418240,
    "allowedDomains": ["example.com"]
  }
}
```

### 6.2 获取企业信息
```
GET /api/enterprises/:id
权限: 需要认证 (企业成员)
```

**响应**:
```json
{
  "id": "enterprise_id",
  "name": "string",
  "domain": "string",
  "logo": "url?",
  "description": "string?",
  "membersCount": 25,
  "skillsCount": 50,
  "promptsCount": 30,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 6.3 更新企业信息
```
PUT /api/enterprises/:id
权限: 需要认证 (enterprise_admin)
```

### 6.4 添加企业成员
```
POST /api/enterprises/:id/members
权限: 需要认证 (enterprise_admin)
```

**请求体**:
```json
{
  "userId": "user_id",
  "role": "developer|user"
}
```

### 6.5 移除企业成员
```
DELETE /api/enterprises/:id/members/:userId
权限: 需要认证 (enterprise_admin)
```

## 7. 文件上传模块 `/api/upload`

### 7.1 上传文件
```
POST /api/upload
权限: 需要认证 (developer及以上)
```

**请求头**:
```
Content-Type: multipart/form-data
```

**文件限制**:
| 限制项 | 配置 |
|--------|------|
| 最大大小 | 50MB |
| 允许类型 | .js, .ts, .json, .zip, .md |
| 病毒扫描 | 启用 |

**响应**:
```json
{
  "url": "https://storage.example.com/files/xxx",
  "filename": "skill-v1.0.0.zip",
  "size": 1024000,
  "mimeType": "application/zip"
}
```

**安全检测中间件**:
```typescript
const fileSecurityCheck = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ message: '未上传文件' });
  }
  
  const filePath = req.file.path;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const maliciousPatterns = [
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /require\s*\(\s*['"]child_process['"]\s*\)/gi,
    /require\s*\(\s*['"]fs['"]\s*\)/gi,
    /process\.binding/gi,
    /process\.dlopen/gi,
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(content)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: '文件包含潜在恶意代码' });
    }
  }
  
  next();
};
```

## 8. 智能体API模块 `/api/agent`

为外部智能体提供查询和下载平台资源的API，支持企业资源隔离。

### 8.1 认证方式

智能体API使用自定义请求头进行认证：
```
X-Agent-Id: agent_unique_id
X-Agent-Token: agent_access_token
```

### 8.2 获取Agent配置
```
GET /api/agent/config
权限: 需要Agent认证
```

**响应**:
```json
{
  "agentId": "agent_123",
  "name": "企业智能助手",
  "enterpriseId": "ent_456",
  "permissions": {
    "canReadPublic": true,
    "canReadEnterprise": true,
    "canDownload": true,
    "canUpload": false
  },
  "rateLimit": {
    "requestsPerMinute": 60,
    "requestsPerHour": 1000
  }
}
```

### 8.3 获取公开Skill列表
```
GET /api/agent/skills
权限: 需要Agent认证
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认1 |
| limit | number | 每页数量，默认20 |
| search | string | 搜索关键词 |
| tags | string[] | 标签筛选 |

**响应**:
```json
{
  "items": [
    {
      "id": "skill_123",
      "name": "代码审查助手",
      "description": "自动审查代码质量问题",
      "version": "1.2.0",
      "tags": ["code", "review"],
      "author": {
        "id": "user_456",
        "username": "developer1"
      },
      "stats": {
        "downloadCount": 1234,
        "avgRating": 4.5,
        "ratingCount": 89
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20
}
```

### 8.4 获取公开Prompt列表
```
GET /api/agent/prompts
权限: 需要Agent认证
```

**查询参数**: 同Skill列表

### 8.5 获取企业Skill列表
```
GET /api/agent/enterprise/skills
权限: 需要Agent认证 + 企业成员 + canReadEnterprise权限
```

### 8.6 获取企业Prompt列表
```
GET /api/agent/enterprise/prompts
权限: 需要Agent认证 + 企业成员 + canReadEnterprise权限
```

### 8.7 下载Skill
```
GET /api/agent/skills/:id/download
权限: 需要Agent认证 + canDownload权限
```

**权限说明**:
- 公开Skill: 任何Agent可下载
- 企业Skill: 仅同企业Agent可下载

### 8.8 获取Prompt详情
```
GET /api/agent/prompts/:id
权限: 需要Agent认证
```

### 8.9 上传Skill(可选)
```
POST /api/agent/skills
权限: 需要Agent认证 + canUpload权限
```

**请求体**:
```json
{
  "name": "新Skill名称",
  "description": "Skill描述",
  "content": "base64编码的Skill文件内容",
  "tags": ["ai", "assistant"],
  "marketType": "enterprise"
}
```

### 8.10 上传Prompt(可选)
```
POST /api/agent/prompts
权限: 需要Agent认证 + canUpload权限
```

### 8.11 Agent注册
```
POST /api/agent/register
权限: 需要管理员授权码
```

**请求体**:
```json
{
  "name": "智能助手名称",
  "description": "Agent用途描述",
  "enterpriseId": "ent_456",
  "authorizationCode": "admin_provided_code"
}
```

**响应**:
```json
{
  "agentId": "agent_123",
  "agentToken": "sk-agent-xxxxx",
  "name": "智能助手名称",
  "enterpriseId": "ent_456",
  "permissions": {
    "canReadPublic": true,
    "canReadEnterprise": true,
    "canDownload": true,
    "canUpload": false
  }
}
```

### 8.12 刷新Agent Token
```
POST /api/agent/refresh
权限: 需要Agent认证
```

**响应**:
```json
{
  "agentToken": "sk-agent-yyyyy",
  "expiresAt": "2024-02-01T00:00:00Z"
}
```

## 9. API响应格式

### 9.1 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 9.2 分页响应

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 9.3 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

### 9.4 常见错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| UNAUTHORIZED | 401 | 未认证 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
