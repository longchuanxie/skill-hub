# 企业级 OAuth 配置与登录限制 - 实施计划

> **Goal:** 实现企业级 OAuth 配置与登录限制功能，包括后端 API 和前端页面
> 
> **Tech Stack:** React + TypeScript + Express + MongoDB

---

## Phase 1: 后端 - 数据模型扩展

### Task 1.1: 扩展 Enterprise 模型

**Files:**
- `backend/src/models/Enterprise.ts`

**Steps:**

1. 在 `settings` 中添加 `auth` 对象：

```typescript
settings: {
  auth: {
    passwordLoginEnabled: { type: Boolean, default: true },
    oauthRequired: { type: Boolean, default: false }
  }
}
```

2. 添加企业名称唯一索引：

```typescript
enterpriseSchema.index({ name: 1 }, { unique: true });
```

3. 添加默认值初始化逻辑（如果 settings.auth 不存在）

**Verification:**
- 启动后端，检查 Enterprise 模型是否包含新字段

---

### Task 1.2: 扩展 OAuthProvider 模型

**Files:**
- `backend/src/models/OAuthProvider.ts`

**Steps:**

1. 添加新字段：

```typescript
callbackPath: { type: String, default: '/api/oauth/callback/:provider' },
userInfoConfig: {
  method: { type: String, enum: ['GET', 'POST'] },
  url: { type: String },
  headers: { type: Schema.Types.Mixed },
  body: { type: String },
  userIdPath: { type: String },
  emailPath: { type: String },
  namePath: { type: String },
  avatarPath: { type: String }
}
```

2. 添加企业名称唯一索引（防重）：

```typescript
// 企业名称唯一索引
enterpriseSchema.index({ name: 1 }, { unique: true });

// OAuth 配置防重索引：同一企业不能配置相同的 OAuth 提供商
oauthProviderSchema.index({ provider: 1, enterpriseId: 1 }, { unique: true });
```

### Task 1.2 (新增): Skill/Prompt 企业内名称防重

**Files:**
- `backend/src/models/Skill.ts`
- `backend/src/models/Prompt.ts`

**Steps:**

1. Skill 模型添加企业内名称唯一索引：

```typescript
skillSchema.index({ name: 1, enterpriseId: 1 }, { unique: true });
```

2. Prompt 模型添加企业内名称唯一索引：

```typescript
promptSchema.index({ name: 1, enterpriseId: 1 }, { unique: true });
```

**Verification:**
- 检查模型索引是否创建成功

2. 添加 `enterpriseId` 索引

**Verification:**
- 检查 OAuthProvider 模型是否包含所有新字段

---

### Task 1.3: 创建 UserOAuth 绑定模型

**Files:**
- `backend/src/models/UserOAuth.ts` (新建)

**Steps:**

1. 创建 UserOAuth 模型：

```typescript
interface IUserOAuth extends Document {
  userId: Schema.Types.ObjectId;
  provider: string;
  providerUserId: string;
  email: string;
  linkedAt: Date;
}
```

2. 添加复合索引 `{ provider: 1, providerUserId: 1 }`

**Verification:**
- 检查模型是否创建成功

---

## Phase 2: 后端 - API 实现

### Task 2.1: 获取回调 URL 路径 API

**Files:**
- `backend/src/controllers/oauthController.ts`
- `backend/src/routes/oauth.ts`

**Steps:**

1. 添加新控制器方法：

```typescript
export const getCallbackPaths = async (req: Request, res: Response) => {
  const baseUrl = process.env.OAUTH_BASE_URL || `${req.protocol}://${req.get('host')}`;
  
  res.json({
    success: true,
    data: {
      baseUrl,
      paths: {
        google: '/api/oauth/callback/google',
        github: '/api/oauth/callback/github',
        microsoft: '/api/oauth/callback/microsoft',
        slack: '/api/oauth/callback/slack',
        custom: '/api/oauth/callback/custom'
      }
    }
  });
};
```

2. 添加路由：`router.get('/callback-paths', getCallbackPaths)`

**Verification:**
- 测试：`curl http://localhost:3002/api/oauth/callback-paths`

---

### Task 2.2: 企业认证设置 API

**Files:**
- `backend/src/controllers/enterpriseController.ts`
- `backend/src/routes/enterprises.ts`

**Steps:**

1. 添加控制器方法：

```typescript
export const getAuthSettings = async (req: Request, res: Response) => {
  const { id } = req.params;
  const enterprise = await Enterprise.findById(id);
  
  res.json({
    success: true,
    data: enterprise?.settings.auth || { 
      passwordLoginEnabled: true, 
      oauthRequired: false 
    }
  });
};

export const updateAuthSettings = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { passwordLoginEnabled, oauthRequired } = req.body;
  
  await Enterprise.findByIdAndUpdate(id, {
    'settings.auth.passwordLoginEnabled': passwordLoginEnabled,
    'settings.auth.oauthRequired': oauthRequired
  });
  
  res.json({ success: true });
};
```

2. 添加路由：

```typescript
router.get('/:id/auth-settings', authenticate, getAuthSettings);
router.put('/:id/auth-settings', authenticate, requireEnterpriseAdmin, updateAuthSettings);
```

**Verification:**
- 测试获取和更新企业认证设置

---

### Task 2.3: OAuthProvider CRUD API

**Files:**
- `backend/src/controllers/oauthController.ts`
- `backend/src/routes/oauth.ts`

**Steps:**

1. 添加控制器方法：

```typescript
// 获取企业 OAuth 配置列表
export const getEnterpriseProviders = async (req, res) => {
  const { enterpriseId } = req.params;
  const providers = await OAuthProvider.find({ 
    $or: [{ enterpriseId }, { enterpriseId: null }] 
  }).select('-clientSecret');
  
  res.json({ success: true, data: providers });
};

// 创建 OAuth 配置
export const createProvider = async (req, res) => {
  // 验证权限 + 创建逻辑
};

// 更新 OAuth 配置
export const updateProvider = async (req, res) => {
  // 验证权限 + 更新逻辑
};

// 删除 OAuth 配置
export const deleteProvider = async (req, res) => {
  // 验证权限 + 删除逻辑
};

// 启用/禁用
export const toggleProvider = async (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;
  
  await OAuthProvider.findByIdAndUpdate(id, { isEnabled: enabled });
  res.json({ success: true });
};
```

2. 添加路由：

```typescript
router.get('/providers/enterprise/:enterpriseId', authenticate, getEnterpriseProviders);
router.post('/providers/enterprise', authenticate, requireEnterpriseAdmin, createProvider);
router.put('/providers/:id', authenticate, requireEnterpriseAdmin, updateProvider);
router.delete('/providers/:id', authenticate, requireEnterpriseAdmin, deleteProvider);
router.post('/providers/:id/toggle', authenticate, requireEnterpriseAdmin, toggleProvider);
```

**Verification:**
- 测试 CRUD 操作

---

### Task 2.4: 修改登录 API

**Files:**
- `backend/src/controllers/authController.ts`

**Steps:**

1. 在 `login` 方法中添加企业认证检查：

```typescript
// 登录时检查企业认证设置
const enterprise = await Enterprise.findById(user.enterpriseId);
if (enterprise?.settings?.auth?.passwordLoginEnabled === false) {
  // 检查用户角色
  if (user.role !== 'admin' && user.role !== 'enterprise_admin') {
    res.status(403).json({
      error: 'PASSWORD_LOGIN_DISABLED',
      message: 'Password login is disabled for your organization. Please use OAuth login.'
    });
    return;
  }
}
```

**Verification:**
- 测试普通用户账密登录被拒绝

---

### Task 2.5: 自定义 OAuth 回调处理

**Files:**
- `backend/src/controllers/oauthController.ts`

**Steps:**

1. 扩展 `handleCallback` 方法，支持自定义用户信息获取：

```typescript
// 获取用户信息（标准或自定义）
const getUserInfo = async (accessToken: string, oauthProvider: IOAuthProvider) => {
  // 如果是自定义 OAuth
  if (oauthProvider.provider === 'custom' && oauthProvider.userInfoConfig) {
    return fetchCustomUserInfo(accessToken, oauthProvider.userInfoConfig);
  }
  
  // 标准 OAuth
  const response = await axios.get(oauthProvider.userInfoURL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  return {
    userId: response.data.id || response.data.sub,
    email: response.data.email,
    name: response.data.name
  };
};

// 自定义用户信息获取
const fetchCustomUserInfo = async (token: string, config: UserInfoConfig) => {
  let url = config.url.replace(':token', token);
  const body = config.body?.replace('{{token}}', token);
  
  const options: any = {
    method: config.method,
    headers: { 'Content-Type': 'application/json', ...config.headers }
  };
  
  if (config.method === 'POST' && body) {
    options.body = body;
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  // 解析字段路径
  const getField = (obj: any, path: string) => 
    path.split('.').reduce((o, k) => o?.[k], obj);
  
  return {
    userId: getField(data, config.userIdPath),
    email: config.emailPath ? getField(data, config.emailPath) : undefined,
    name: config.namePath ? getField(data, config.namePath) : undefined
  };
};
```

**Verification:**
- 测试自定义 OAuth 回调处理

---

## Phase 3: 前端 - API 定义

### Task 3.1: 扩展 OAuth API

**Files:**
- `frontend/src/api/oauth.ts`

**Steps:**

1. 添加新接口和 API 方法：

```typescript
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

export const oauthApi = {
  getCallbackPaths: () => apiClient.get('/oauth/callback-paths'),
  getEnterpriseProviders: (enterpriseId: string) => 
    apiClient.get(`/oauth/providers/enterprise/${enterpriseId}`),
  createProvider: (data: any) => 
    apiClient.post('/oauth/providers/enterprise', data),
  updateProvider: (id: string, data: any) => 
    apiClient.put(`/oauth/providers/${id}`, data),
  deleteProvider: (id: string) => 
    apiClient.delete(`/oauth/providers/${id}`),
  toggleProvider: (id: string, enabled: boolean) => 
    apiClient.post(`/oauth/providers/${id}/toggle`, { enabled }),
};
```

**Verification:**
- 检查 TypeScript 编译无错误

---

### Task 3.2: 添加企业认证设置 API

**Files:**
- `frontend/src/api/enterprise.ts` (新建)

**Steps:**

```typescript
import { apiClient } from './client';

export interface AuthSettings {
  passwordLoginEnabled: boolean;
  oauthRequired: boolean;
}

export const enterpriseApi = {
  getAuthSettings: (enterpriseId: string) =>
    apiClient.get(`/enterprises/${enterpriseId}/auth-settings`),
  
  updateAuthSettings: (enterpriseId: string, settings: AuthSettings) =>
    apiClient.put(`/enterprises/${enterpriseId}/auth-settings`, settings),
};
```

**Verification:**
- 检查 TypeScript 编译无错误

---

## Phase 4: 前端 - 组件实现

### Task 4.1: 创建 OAuth 配置列表组件

**Files:**
- `frontend/src/components/OAuthConfigList.tsx` (新建)

**Steps:**

1. 创建组件，显示 OAuth 配置列表
2. 支持启用/禁用开关
3. 支持编辑和删除按钮
4. 支持添加新配置按钮

**Components:**
- `OAuthProviderCard` - 单个 OAuth 配置卡片
- `EnableSwitch` - 启用/禁用开关

**Verification:**
- 组件能正确显示配置列表

---

### Task 4.2: 创建 OAuth 配置表单组件

**Files:**
- `frontend/src/components/OAuthConfigForm.tsx` (新建)

**Steps:**

1. 创建表单，支持标准 OAuth 和自定义 OAuth
2. 当选择 `custom` provider 时，显示自定义配置字段
3. 显示系统提供的回调 URL（只读）

**Form Fields:**
- `name` - 显示名称
- `provider` - 提供商类型（select）
- `clientId` - 客户端 ID
- `clientSecret` - 客户端密钥
- `authorizationURL` - 授权端点（custom 必填）
- `tokenURL` - Token 端点（custom 必填）
- `scope` - 请求范围
- `userInfoConfig` - 自定义用户信息配置（custom 必填）

**Verification:**
- 表单能正确创建和编辑 OAuth 配置

---

### Task 4.3: 创建企业认证设置组件

**Files:**
- `frontend/src/components/AuthSettingsSection.tsx` (新建)

**Steps:**

1. 创建开关组件，配置登录方式
2. 显示系统回调 URL 信息

**Settings:**
- `passwordLoginEnabled` - 允许普通用户账密登录
- `oauthRequired` - 强制 OAuth 登录

**Verification:**
- 设置能正确保存

---

### Task 4.4: 在设置页面中集成

**Files:**
- `frontend/src/pages/SettingsPage.tsx`

**Steps:**

1. 添加新的标签页："企业认证"
2. 引入 `AuthSettingsSection` 和 `OAuthConfigList` 组件
3. 添加加载逻辑：获取企业信息、认证设置、OAuth 配置

**Verification:**
- 设置页面能正确显示企业认证配置

---

### Task 4.5: 修改登录页面

**Files:**
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/components/OAuthLoginButtons.tsx`

**Steps:**

1. 修改 `OAuthLoginButtons`，支持传入 `enterpriseId`
2. 在登录页面添加判断：根据企业设置显示/隐藏账密登录
3. 添加错误提示：当账密登录被拒绝时

**Verification:**
- 登录页面根据企业设置正确显示

---

## Phase 5: 测试与优化

### Task 5.1: 后端单元测试

**Steps:**

1. 测试 Enterprise 模型扩展
2. 测试 OAuthProvider CRUD API
3. 测试登录限制逻辑
4. 测试自定义 OAuth 回调

---

### Task 5.2: 前端集成测试

**Steps:**

1. 测试 OAuth 配置创建/编辑/删除
2. 测试登录限制提示
3. 测试响应式布局

---

### Task 5.3: 错误处理优化

**Steps:**

1. 添加前端错误提示
2. 添加加载状态
3. 优化用户体验

---

## 文件清单

### 新建文件

| 文件 | 说明 |
|------|------|
| `backend/src/models/UserOAuth.ts` | 用户 OAuth 绑定模型 |
| `frontend/src/api/enterprise.ts` | 企业 API |
| `frontend/src/components/OAuthConfigList.tsx` | OAuth 配置列表 |
| `frontend/src/components/OAuthConfigForm.tsx` | OAuth 配置表单 |
| `frontend/src/components/AuthSettingsSection.tsx` | 认证设置组件 |

### 修改文件

| 文件 | 说明 |
|------|------|
| `backend/src/models/Enterprise.ts` | 添加 auth.settings |
| `backend/src/models/OAuthProvider.ts` | 添加自定义字段 |
| `backend/src/controllers/oauthController.ts` | 添加新 API |
| `backend/src/routes/oauth.ts` | 添加新路由 |
| `backend/src/controllers/enterpriseController.ts` | 添加认证设置 API |
| `backend/src/routes/enterprises.ts` | 添加认证设置路由 |
| `backend/src/controllers/authController.ts` | 添加登录限制 |
| `frontend/src/api/oauth.ts` | 扩展 OAuth API |
| `frontend/src/pages/SettingsPage.tsx` | 添加企业认证页面 |
| `frontend/src/pages/LoginPage.tsx` | 适配登录限制 |
| `frontend/src/components/OAuthLoginButtons.tsx` | 支持企业 ID |

---

## 验收标准

### 功能验收

- [ ] 管理员可以创建 OAuth 配置
- [ ] 管理员可以编辑 OAuth 配置
- [ ] 管理员可以删除 OAuth 配置
- [ ] 管理员可以启用/禁用 OAuth
- [ ] 管理员可以配置登录限制
- [ ] 普通用户无法账密登录（当企业禁用时）
- [ ] 管理员始终可以账密登录
- [ ] 自定义 OAuth 正常工作

### 界面验收

- [ ] 登录页面正确显示 OAuth 选项
- [ ] 账密登录被禁用时显示提示
- [ ] OAuth 配置页面功能完整
- [ ] 响应式布局正常

### 安全验收

- [ ] 仅管理员可访问配置 API
- [ ] OAuth 凭证安全
- [ ] 登录限制服务端强制执行
