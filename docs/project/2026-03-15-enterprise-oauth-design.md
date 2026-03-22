# 企业级 OAuth 配置与登录限制功能设计

## 1. 需求概述

为 SkillHub 添加企业级 OAuth 配置功能，实现：

1. **企业级 OAuth 配置**：每个企业可以独立配置自己的 OAuth 登录服务
2. **登录权限控制**：
   - 仅管理员（admin/enterprise_admin）可通过账密登录
   - 普通用户强制使用企业配置的 OAuth 登录
3. **前端管理界面**：管理员可在设置页面配置企业的 OAuth 服务

## 2. 系统架构

### 2.1 数据模型

#### 2.1.1 Enterprise 模型扩展

在 `settings` 中添加认证相关配置：

```typescript
interface IEnterprise extends Document {
  // ... 现有字段
  name: string;  // 企业名称，应有唯一性约束
  
  settings: {
    allowPublicShare: boolean;
    requireApproval: boolean;
    // 新增：认证相关配置
    auth: {
      passwordLoginEnabled: boolean;      // 是否启用账密登录，默认 true
      oauthRequired: boolean;           // 是否强制 OAuth 登录，默认 false
    };
  };
}
```

#### 2.1.1.1 企业名称防重

```typescript
// Enterprise 模型中添加唯一索引
enterpriseSchema.index({ name: 1 }, { unique: true });

// 创建企业时的防重逻辑
export const createEnterprise = async (req, res) => {
  const { name } = req.body;
  
  // 检查企业名称是否已存在
  const existing = await Enterprise.findOne({ name });
  if (existing) {
    res.status(400).json({
      error: 'ENTERPRISE_NAME_EXISTS',
      message: 'Enterprise name already exists'
    });
    return;
  }
  
  // ... 创建企业逻辑
};
```

#### 2.1.1.2 OAuth 配置防重

企业内的 OAuth 提供商不能重复：

```typescript
// OAuthProvider 模型中添加复合唯一索引
oauthProviderSchema.index(
  { provider: 1, enterpriseId: 1 }, 
  { unique: true }
);

// 创建 OAuth 配置时的防重逻辑
export const createProvider = async (req, res) => {
  const { provider, enterpriseId } = req.body;
  
  // 检查该企业是否已配置此 OAuth 类型
  const existing = await OAuthProvider.findOne({ provider, enterpriseId });
  if (existing) {
    res.status(400).json({
      error: 'OAUTH_PROVIDER_EXISTS',
      message: `OAuth provider '${provider}' is already configured for this enterprise`
    });
    return;
  }
  
  // ... 创建配置逻辑
};
```

#### 2.1.1.3 完整防重处理清单

| 资源 | 唯一性字段 | 索引方式 | 说明 |
|------|-----------|----------|------|
| **User** | email | unique | 已实现：邮箱唯一 |
| **User** | username | unique | 已实现：用户名唯一 |
| **Enterprise** | name | unique | 新增：企业名称唯一 |
| **OAuthProvider** | (provider, enterpriseId) | unique | 新增：企业内 OAuth 不重复 |
| **Agent** | apiKey | unique | 已实现 |
| **CustomPage** | pageKey | unique | 已实现 |
| **CustomPage** | (pageKey, language) | unique | 已实现：多语言支持 |
| **ResourceVersion** | (resourceId, versionNumber) | unique | 已实现 |
| **OAuthSession** | (userId, provider) | unique | 已实现 |
| **Skill** | - | - | 需新增：企业内名称唯一 |
| **Prompt** | - | - | 需新增：企业内名称唯一 |

#### 2.1.1.4 Skill/Prompt 企业内名称防重

```typescript
// Skill 模型中添加企业内名称唯一索引
skillSchema.index(
  { name: 1, enterpriseId: 1 }, 
  { unique: true }
);

// Prompt 模型中添加企业内名称唯一索引
promptSchema.index(
  { name: 1, enterpriseId: 1 }, 
  { unique: true }
);

// 创建时的防重逻辑
export const createSkill = async (req, res) => {
  const { name, enterpriseId } = req.body;
  
  // 检查企业内名称是否已存在
  const existing = await Skill.findOne({ name, enterpriseId });
  if (existing) {
    res.status(400).json({
      error: 'SKILL_NAME_EXISTS',
      message: `Skill '${name}' already exists in this enterprise`
    });
    return;
  }
  
  // ... 创建逻辑
};
```

#### 2.1.2 OAuthProvider 模型（扩展支持自定义）

支持标准 OAuth 提供商和完全自定义 OAuth 服务：

```typescript
interface IOAuthProvider extends Document {
  name: string;           // 显示名称，如 "Google Workspace" 或 "企业SSO"
  provider: string;       // 'google' | 'github' | 'microsoft' | 'slack' | 'custom'
  
  // OAuth 配置
  clientId: string;
  clientSecret: string;
  authorizationURL: string;
  tokenURL: string;
  userInfoURL: string;
  scope: string;
  
  // 回调配置（系统提供路径部分，管理员配置域名）
  callbackPath: string;   // 如 "/api/oauth/callback/custom"
  
  // 自定义用户信息获取配置
  userInfoConfig?: {
    method: 'GET' | 'POST';
    url: string;
    headers?: Record<string, string>;
    body?: string;
    userIdPath: string;
    emailPath?: string;
    namePath?: string;
  };
  
  isEnabled: boolean;
  enterpriseId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2.1.3 用户 OAuth 绑定

```typescript
interface IUserOAuth extends Document {
  userId: Schema.Types.ObjectId;
  provider: string;
  providerUserId: string;
  email: string;
  linkedAt: Date;
}
```

### 2.2 管理员身份体系

#### 2.2.1 现有角色体系

项目已具备完整的企业管理员体系：

| 层级 | 角色 | 说明 | 登录方式权限 |
|------|------|------|-------------|
| 系统级 | `admin` | 系统管理员 | 始终可用账密登录 |
| 企业级 | `enterprise_admin` | 企业管理员 | 始终可用账密登录 |
| 企业级 | `developer` | 开发者 | 受企业设置限制 |
| 企业级 | `user` | 普通用户 | 受企业设置限制 |

#### 2.2.2 企业成员角色

企业成员具有双重角色：

```typescript
// User 表中的系统角色
role: 'admin' | 'enterprise_admin' | 'developer' | 'user';

// Enterprise 表中每个成员的企业角色
members: Array<{
  userId: Schema.Types.ObjectId;
  role: 'admin' | 'member';  // 企业内部的管理员/成员
  joinedAt: Date;
}>;
```

#### 2.2.3 企业管理员配置入口

企业管理员通过以下方式配置：

| 入口 | 说明 | 访问条件 | 状态 |
|------|------|----------|------|
| **设置页面** | `/settings` - 添加"企业认证"标签页 | 登录用户 | 需新增 |
| **企业信息卡片** | 设置页中显示企业基本信息 | 企业成员 | 需完善 |

> **注意**：目前项目中没有独立的企业详情页 (`/enterprises/:id`)，所有企业相关的管理功能都将在设置页面中实现。

#### 2.2.4 成为企业管理员的方式

1. **创建企业时自动成为管理员**：
   ```typescript
   // enterpriseController.ts createEnterprise
   members: [{ userId: req.user?.userId, role: 'admin' }]
   ```

2. **被企业所有者邀请并授予 admin 角色**：
   ```typescript
   // enterpriseController.ts inviteMember
   POST /api/enterprises/:id/invite
   { email: "admin@company.com", role: "admin" }
   ```

3. **系统管理员（admin）可管理所有企业**：
   - 系统 admin 可直接访问任意企业的设置页面
   - 无需成为企业成员即可配置企业 OAuth

#### 2.2.5 OAuth 配置权限检查

```typescript
// 检查用户是否可以配置 OAuth
const canConfigureOAuth = (user: User, enterprise: Enterprise) => {
  // 1. 系统管理员始终可以
  if (user.role === 'admin') return true;
  
  // 2. 企业管理员可以
  if (user.enterpriseId?.toString() === enterprise._id.toString()) {
    const member = enterprise.members.find(
      m => m.userId.toString() === user._id.toString()
    );
    if (member?.role === 'admin') return true;
  }
  
  return false;
};
```

### 2.3 API 设计

#### 2.3.1 系统配置 API（获取回调 URL）

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/oauth/callback-paths` | 获取回调 URL 路径 | 公开 |

#### 2.3.2 企业认证设置 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/enterprises/:id/auth-settings` | 获取企业认证设置 | 企业成员 |
| PUT | `/api/enterprises/:id/auth-settings` | 更新企业认证设置 | 企业 admin |

#### 2.3.3 OAuth 配置 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/oauth/providers/enterprise/:enterpriseId` | 获取企业 OAuth 配置 | 企业成员 |
| POST | `/api/oauth/providers/enterprise` | 创建 OAuth 配置 | 企业 admin |
| PUT | `/api/oauth/providers/:id` | 更新 OAuth 配置 | 企业 admin |
| DELETE | `/api/oauth/providers/:id` | 删除 OAuth 配置 | 企业 admin |
| POST | `/api/oauth/providers/:id/toggle` | 启用/禁用 OAuth | 企业 admin |

#### 2.3 登录 API 修改

```typescript
// 登录时检查企业认证设置
const enterprise = await Enterprise.findById(user.enterpriseId);
if (enterprise?.settings.auth.passwordLoginEnabled === false) {
  if (user.role !== 'admin' && user.role !== 'enterprise_admin') {
    return res.status(403).json({
      error: 'PASSWORD_LOGIN_DISABLED',
      message: 'Password login is disabled. Please use OAuth login.'
    });
  }
}
```

### 2.4 前端 API 定义

#### 2.4.1 OAuth API

```typescript
// frontend/src/api/oauth.ts

export interface OAuthProvider {
  _id: string;
  name: string;
  provider: string;
  clientId: string;
  authorizationURL: string;
  tokenURL: string;
  userInfoURL: string;
  scope: string;
  callbackPath: string;
  userInfoConfig?: UserInfoConfig;
  isEnabled: boolean;
  enterpriseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfoConfig {
  method: 'GET' | 'POST';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  userIdPath: string;
  emailPath?: string;
  namePath?: string;
}

export interface CreateOAuthProviderInput {
  name: string;
  provider: string;
  clientId: string;
  clientSecret: string;
  authorizationURL?: string;
  tokenURL?: string;
  scope?: string;
  callbackPath?: string;
  userInfoConfig?: UserInfoConfig;
  enterpriseId: string;
}

export const oauthApi = {
  // 获取系统回调 URL 路径
  getCallbackPaths: () => 
    apiClient.get('/oauth/callback-paths'),
  
  // 获取企业 OAuth 配置列表
  getEnterpriseProviders: (enterpriseId: string) =>
    apiClient.get(`/oauth/providers/enterprise/${enterpriseId}`),
  
  // 创建 OAuth 配置
  createProvider: (data: CreateOAuthProviderInput) =>
    apiClient.post('/oauth/providers/enterprise', data),
  
  // 更新 OAuth 配置
  updateProvider: (id: string, data: Partial<CreateOAuthProviderInput>) =>
    apiClient.put(`/oauth/providers/${id}`, data),
  
  // 删除 OAuth 配置
  deleteProvider: (id: string) =>
    apiClient.delete(`/oauth/providers/${id}`),
  
  // 启用/禁用 OAuth
  toggleProvider: (id: string, enabled: boolean) =>
    apiClient.post(`/oauth/providers/${id}/toggle`, { enabled }),
};
```

#### 2.4.2 企业认证设置 API

```typescript
// frontend/src/api/enterprise.ts

export interface AuthSettings {
  passwordLoginEnabled: boolean;
  oauthRequired: boolean;
}

export const enterpriseApi = {
  // 获取企业认证设置
  getAuthSettings: (enterpriseId: string) =>
    apiClient.get(`/enterprises/${enterpriseId}/auth-settings`),
  
  // 更新企业认证设置
  updateAuthSettings: (enterpriseId: string, settings: AuthSettings) =>
    apiClient.put(`/enterprises/${enterpriseId}/auth-settings`, settings),
};
```

### 2.5 OAuth 回调处理流程

#### 2.4.1 OAuth 登录时确定企业归属

OAuth 登录时，企业归属通过以下方式确定：

1. **企业专属 OAuth 配置**：使用企业配置的 OAuth
   - 调用 `/api/oauth/providers?enterpriseId=xxx` 获取该企业的 OAuth 配置
   - 使用企业配置的 clientId/secret 进行授权

2. **用户首次 OAuth 登录**：
   - 通过 OAuth 获取用户邮箱（如 user@company.com）
   - 系统查找该邮箱是否已有企业成员身份
   - 如果用户已在某企业成员列表中，自动关联企业

3. **新用户注册**：
   - OAuth 回调时，如果用户不存在，创建新用户
   - 通过邮箱域名或企业邀请链接关联企业

```typescript
// OAuth 回调处理流程
export const handleOAuthCallback = async (req, res) => {
  const { provider, enterpriseId } = req.params;
  const { code, state } = req.query;
  
  // 1. 获取 OAuth 配置（优先使用企业配置）
  const oauthProvider = await getOAuthProvider(provider, enterpriseId);
  
  // 2. 用 code 换取 access_token
  const tokenResponse = await exchangeCodeForToken(code, oauthProvider);
  
  // 3. 获取用户信息
  const userInfo = await getUserInfo(tokenResponse.access_token, oauthProvider);
  
  // 4. 查找或创建用户
  let user = await User.findOne({ email: userInfo.email });
  
  if (!user) {
    // 新用户注册
    user = await createOAuthUser(userInfo, provider, enterpriseId);
  } else {
    // 现有用户，绑定 OAuth 账号
    await linkOAuthAccount(user._id, provider, userInfo);
  }
  
  // 5. 生成 token 返回
  res.redirect(`/oauth/callback?token=${generateToken(user)}`);
};
```

#### 2.4.3 标准 OAuth（Google/GitHub/Microsoft）

```
1. 用户授权 → 回调 /api/oauth/callback/:provider?code=xxx
2. 后端用 code 换取 access_token
3. 后端调用标准 userInfoURL 获取用户信息
4. 查找/创建用户，返回 token
```

#### 2.4.4 自定义 OAuth

```
1. 用户授权 → 回调 /api/oauth/callback/custom?code=xxx
2. 后端用 code 换取 access_token
3. 后端根据 userInfoConfig 调用自定义接口获取用户信息
4. 根据 userIdPath/emailPath/namePath 解析响应
5. 查找/创建用户，返回 token
```

## 3. 前端设计

### 3.1 设置页面结构

```
设置页面 (/settings)
├── 个人信息
├── 企业信息
├── 企业成员
├── 企业认证 ← 新增
│   ├── 登录方式设置
│   │   ├── [ ] 允许普通用户账密登录
│   │   └── [ ] 强制用户使用 OAuth 登录
│   │
│   └── OAuth 服务配置
│       ├── + 添加 OAuth 服务
│       ├── Google Workspace [启用] [编辑] [删除]
│       └── Microsoft Entra [启用] [编辑] [删除]
└── 通知设置
```

### 3.2 OAuth 配置表单字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 显示名称 |
| provider | select | 是 | google/github/microsoft/slack/custom |
| clientId | string | 是 | OAuth 客户端 ID |
| clientSecret | password | 是 | OAuth 客户端密钥 |
| authorizationURL | string | custom 必填 | 授权端点 |
| tokenURL | string | custom 必填 | Token 端点 |
| scope | string | 否 | 请求权限范围 |
| callbackPath | string | 否 | 回调路径（系统提供） |
| userInfoConfig | object | custom 必填 | 用户信息获取配置 |

### 3.3 登录页面适配

当企业禁用账密登录时：
- 仅显示 OAuth 登录按钮
- 普通用户看到提示："您的企业已启用单点登录"
- 管理员仍可使用账密登录

## 4. 实现计划

### Phase 1: 后端 API（预计 2 小时）

- [ ] 扩展 Enterprise 模型，添加 auth.settings
- [ ] 添加企业认证设置 CRUD API
- [ ] 添加 OAuthProvider 企业级 CRUD API
- [ ] 添加自定义 OAuth 回调处理逻辑
- [ ] 修改登录 API，添加企业认证检查
- [ ] 实现权限检查中间件

### Phase 2: 前端页面（预计 2 小时）

- [ ] 创建 AuthSettingsSection 组件
- [ ] 创建 OAuthConfigList 组件
- [ ] 创建 OAuthConfigForm 组件
- [ ] 在 SettingsPage 中集成认证设置
- [ ] 修改登录页面，根据企业设置显示/隐藏账密登录

### Phase 3: 测试与优化（预计 1 小时）

- [ ] 测试 OAuth 配置创建/编辑/删除
- [ ] 测试登录限制逻辑
- [ ] 测试权限控制
- [ ] UI 优化与错误处理

## 5. 验收标准

1. **OAuth 配置功能**：
   - [ ] 管理员可以添加 OAuth 服务配置
   - [ ] 管理员可以编辑 OAuth 配置
   - [ ] 管理员可以删除 OAuth 配置
   - [ ] 管理员可以启用/禁用 OAuth 服务

2. **登录限制功能**：
   - [ ] 企业可禁用普通用户账密登录
   - [ ] 企业可强制用户使用 OAuth 登录
   - [ ] 普通用户在强制 OAuth 时无法账密登录
   - [ ] 管理员始终可以使用账密登录

3. **用户体验**：
   - [ ] 登录页面正确显示可用的 OAuth 选项
   - [ ] 账密登录被禁用时显示友好提示
   - [ ] OAuth 配置页面响应式设计

4. **安全性**：
   - [ ] 仅管理员可访问 OAuth 配置 API
   - [ ] OAuth 凭证安全存储
   - [ ] 登录限制在服务端强制执行
