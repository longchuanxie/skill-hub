# SkillHub 企业级功能增强产品战略设计

**文档版本**: v1.0  
**创建日期**: 2026-03-15  
**产品负责人**: Product Strategy Team  
**目标用户**: 企业用户、开发者、资源创作者

---

## 一、产品愿景

将 SkillHub 打造成企业级 AI 资源管理平台，支持私有化部署、多版本管理、国际化、企业身份集成和 API 开放能力，成为企业 AI 资产管理的首选平台。

---

## 二、功能需求详细设计

### 2.1 底部导航栏自定义内容功能

#### 2.1.1 需求背景

企业私有化部署场景下，About、Terms、Privacy 等页面内容需要根据企业实际情况进行定制，当前系统使用硬编码内容，无法满足企业个性化需求。

#### 2.1.2 产品目标

- 支持企业自定义 About、Terms、Privacy 页面内容
- 支持 Markdown 格式编辑
- 支持多语言版本
- 支持版本历史记录

#### 2.1.3 数据模型设计

```typescript
interface ICustomPage {
  _id: ObjectId;
  enterpriseId?: ObjectId;  // null 表示全局默认
  pageType: 'about' | 'terms' | 'privacy';
  content: {
    zh: string;  // 中文内容 (Markdown)
    en: string;  // 英文内容 (Markdown)
  };
  title: {
    zh: string;
    en: string;
  };
  version: number;
  isActive: boolean;
  createdBy: ObjectId;
  updatedBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface ICustomPageHistory {
  _id: ObjectId;
  pageId: ObjectId;
  content: {
    zh: string;
    en: string;
  };
  title: {
    zh: string;
    en: string;
  };
  version: number;
  changedBy: ObjectId;
  changedAt: Date;
  changeReason?: string;
}
```

#### 2.1.4 API 设计

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/custom-pages/:type` | 获取页面内容 | 公开 |
| GET | `/api/admin/custom-pages` | 获取所有自定义页面列表 | admin |
| POST | `/api/admin/custom-pages` | 创建自定义页面 | admin |
| PUT | `/api/admin/custom-pages/:id` | 更新自定义页面 | admin |
| GET | `/api/admin/custom-pages/:id/history` | 获取页面历史版本 | admin |
| POST | `/api/admin/custom-pages/:id/restore/:version` | 恢复历史版本 | admin |

#### 2.1.5 前端组件设计

```
src/
├── pages/
│   ├── AboutPage.tsx        # About 页面展示
│   ├── TermsPage.tsx        # Terms 页面展示
│   └── PrivacyPage.tsx      # Privacy 页面展示
├── components/
│   └── admin/
│       └── CustomPageEditor.tsx  # Markdown 编辑器组件
└── api/
    └── customPages.ts       # API 调用
```

#### 2.1.6 用户故事

**作为** 企业管理员  
**我想要** 自定义 About、Terms、Privacy 页面内容  
**以便于** 展示企业特定的信息和政策

**验收标准**:
- [ ] 支持在线 Markdown 编辑器
- [ ] 支持实时预览
- [ ] 支持中英文双语编辑
- [ ] 支持版本历史查看和恢复
- [ ] 非管理员用户只能查看内容

---

### 2.2 Skill 和 Prompt 多版本控制功能

#### 2.2.1 需求背景

当前系统 Skill 和 Prompt 模型已有 `version` 和 `versions` 字段，但功能不完善，用户无法方便地创建、管理和切换多个版本。

#### 2.2.2 产品目标

- 支持创建多个版本
- 支持版本对比功能
- 支持版本回滚
- 支持版本发布状态管理
- 支持版本变更日志

#### 2.2.3 数据模型优化

```typescript
interface IResourceVersion {
  _id: ObjectId;
  resourceType: 'skill' | 'prompt';
  resourceId: ObjectId;
  version: string;           // 语义化版本号 (如 1.0.0)
  versionTag: 'latest' | 'stable' | 'beta' | 'deprecated';
  content: any;              // 资源内容快照
  files?: IFileVersion[];    // 文件版本 (仅 Skill)
  changelog: string;         // 变更日志
  status: 'draft' | 'published' | 'deprecated';
  publishedAt?: Date;
  publishedBy?: ObjectId;
  downloads: number;
  createdAt: Date;
  createdBy: ObjectId;
}

interface IFileVersion {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  hash: string;              // 文件哈希值
}

interface IVersionDiff {
  fromVersion: string;
  toVersion: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
```

#### 2.2.4 API 设计

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/skills/:id/versions` | 获取 Skill 所有版本 | 公开/私有 |
| GET | `/api/skills/:id/versions/:version` | 获取特定版本详情 | 公开/私有 |
| POST | `/api/skills/:id/versions` | 创建新版本 | owner |
| PUT | `/api/skills/:id/versions/:version/status` | 更新版本状态 | owner |
| GET | `/api/skills/:id/versions/:v1/diff/:v2` | 版本对比 | 公开/私有 |
| POST | `/api/skills/:id/versions/:version/rollback` | 版本回滚 | owner |
| GET | `/api/prompts/:id/versions` | 获取 Prompt 所有版本 | 公开/私有 |
| GET | `/api/prompts/:id/versions/:version` | 获取特定版本详情 | 公开/私有 |
| POST | `/api/prompts/:id/versions` | 创建新版本 | owner |
| PUT | `/api/prompts/:id/versions/:version/status` | 更新版本状态 | owner |
| GET | `/api/prompts/:id/versions/:v1/diff/:v2` | 版本对比 | 公开/私有 |
| POST | `/api/prompts/:id/versions/:version/rollback` | 版本回滚 | owner |

#### 2.2.5 前端组件设计

```
src/
├── components/
│   ├── VersionList.tsx          # 版本列表组件
│   ├── VersionDetail.tsx        # 版本详情组件
│   ├── VersionDiff.tsx          # 版本对比组件
│   ├── VersionCreateModal.tsx   # 创建版本弹窗
│   └── VersionTimeline.tsx      # 版本时间线
├── pages/
│   └── VersionHistoryPage.tsx   # 版本历史页面
└── api/
    └── versions.ts              # 版本 API
```

#### 2.2.6 版本管理流程

```
┌─────────────┐    创建     ┌─────────────┐    发布     ┌─────────────┐
│   Draft     │ ─────────> │  Published  │ ─────────> │  Deprecated │
│   草稿      │            │   已发布    │            │   已废弃    │
└─────────────┘            └─────────────┘            └─────────────┘
                                  │
                                  │ 标记
                                  ▼
                           ┌─────────────┐
                           │   Stable    │
                           │   稳定版    │
                           └─────────────┘
```

#### 2.2.7 用户故事

**作为** 资源创作者  
**我想要** 为我的 Skill/Prompt 创建多个版本  
**以便于** 追踪变更历史并允许用户选择使用特定版本

**验收标准**:
- [ ] 支持语义化版本号 (semver)
- [ ] 创建新版本时自动生成变更日志模板
- [ ] 支持版本对比 (Diff 视图)
- [ ] 支持一键回滚到任意历史版本
- [ ] 支持版本标签管理 (latest, stable, beta)
- [ ] 用户可以下载特定版本的资源

---

### 2.3 国际化功能 (i18n)

#### 2.3.1 需求背景

当前系统界面仅支持英文，无法满足中文用户的使用需求，需要实现完整的国际化支持。

#### 2.3.2 产品目标

- 支持中文和英文界面
- 支持用户语言偏好设置
- 支持资源内容多语言
- 支持浏览器语言自动检测

#### 2.3.3 技术方案

**前端方案**: 使用 `react-i18next` 库

```typescript
// i18n 配置
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: require('./locales/en.json') },
      zh: { translation: require('./locales/zh.json') },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
```

**目录结构**:
```
src/
├── i18n/
│   ├── index.ts              # i18n 配置
│   └── locales/
│       ├── en.json           # 英文翻译
│       └── zh.json           # 中文翻译
├── stores/
│   └── languageStore.ts      # 语言偏好状态管理
└── components/
    └── LanguageSwitcher.tsx  # 语言切换组件
```

#### 2.3.4 数据模型扩展

**用户模型扩展**:
```typescript
interface IUser {
  // ... 现有字段
  preferences: {
    language: 'zh' | 'en' | 'auto';
    timezone?: string;
  };
}
```

**资源模型扩展**:
```typescript
interface ISkill {
  // ... 现有字段
  i18n: {
    name: { zh?: string; en: string };
    description: { zh?: string; en: string };
  };
}
```

#### 2.3.5 API 设计

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/i18n/locales/:lang` | 获取语言包 | 公开 |
| PUT | `/api/users/me/preferences/language` | 更新用户语言偏好 | user |

#### 2.3.6 翻译内容范围

**需要翻译的内容**:
1. 界面文本 (按钮、标签、提示等)
2. 表单验证消息
3. 错误提示信息
4. 邮件模板
5. 系统通知
6. 导航菜单
7. 页面标题

**翻译文件示例**:
```json
{
  "common": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View"
  },
  "nav": {
    "skills": "Skills",
    "prompts": "Prompts",
    "myResources": "My Resources",
    "profile": "Profile",
    "settings": "Settings"
  },
  "auth": {
    "login": "Login",
    "register": "Register",
    "logout": "Logout",
    "forgotPassword": "Forgot Password"
  }
}
```

#### 2.3.7 用户故事

**作为** 中文用户  
**我想要** 使用中文界面  
**以便于** 更好地理解和使用系统功能

**验收标准**:
- [ ] 所有界面文本支持中英文切换
- [ ] 用户可以在设置中选择语言偏好
- [ ] 支持浏览器语言自动检测
- [ ] 语言偏好持久化存储
- [ ] 切换语言后无需刷新页面

---

### 2.4 企业 OAuth2 登录集成

#### 2.4.1 需求背景

企业私有化部署场景下，需要与企业现有身份认证系统集成，支持 OAuth2 标准协议登录，并获取用户信息用于权限控制。

#### 2.4.2 产品目标

- 支持标准 OAuth2 授权码流程
- 支持多 OAuth2 提供商配置
- 支持用户信息映射
- 支持角色权限同步

#### 2.4.3 数据模型设计

```typescript
interface IOAuthProvider {
  _id: ObjectId;
  enterpriseId: ObjectId;
  name: string;                    // 提供商名称
  type: 'oauth2' | 'oidc';         // 协议类型
  config: {
    authorizationUrl: string;       // 授权端点
    tokenUrl: string;               // Token 端点
    userInfoUrl: string;            // 用户信息端点
    clientId: string;
    clientSecret: string;           // 加密存储
    scope: string[];                // 请求范围
    redirectUri: string;
  };
  mapping: {
    username: string;               // 用户名字段映射
    email: string;                  // 邮箱字段映射
    avatar?: string;                // 头像字段映射
    roles?: string;                 // 角色字段映射
  };
  roleMapping: {
    externalRole: string;           // 外部角色
    internalRole: string;           // 内部角色
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IOAuthSession {
  _id: ObjectId;
  userId: ObjectId;
  providerId: ObjectId;
  externalUserId: string;          // 外部系统用户ID
  accessToken: string;             // 加密存储
  refreshToken?: string;           // 加密存储
  expiresAt: Date;
  createdAt: Date;
}
```

#### 2.4.4 OAuth2 流程设计

```
┌──────────┐     1. 点击登录      ┌──────────┐
│   用户   │ ─────────────────> │  前端    │
└──────────┘                     └──────────┘
                                      │
                                 2. 重定向
                                      ▼
┌──────────┐     3. 授权页面      ┌──────────┐
│   用户   │ <───────────────── │ OAuth    │
└──────────┘                     │ Provider │
     │                           └──────────┘
     │ 4. 用户授权                     │
     ▼                                │
┌──────────┐     5. 授权码          │
│   用户   │ ──────────────────────>│
└──────────┘                         │
                                 6. 回调
                                      ▼
                               ┌──────────┐
                               │  后端    │
                               └──────────┘
                                     │
                           7. 用授权码换Token
                                     ▼
                               ┌──────────┐
                               │ OAuth    │
                               │ Provider │
                               └──────────┘
                                     │
                           8. 返回Token
                                     ▼
                               ┌──────────┐
                               │  后端    │
                               └──────────┘
                                     │
                           9. 获取用户信息
                                     ▼
                               ┌──────────┐
                               │ OAuth    │
                               │ Provider │
                               └──────────┘
                                     │
                          10. 返回用户信息
                                     ▼
                               ┌──────────┐
                               │  后端    │
                               └──────────┘
                                     │
                          11. 创建/更新用户
                          12. 生成JWT
                                     ▼
                               ┌──────────┐
                               │  前端    │
                               └──────────┘
```

#### 2.4.5 API 设计

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/oauth/providers` | 获取可用 OAuth 提供商列表 | 公开 |
| GET | `/api/oauth/:provider/authorize` | 获取授权URL | 公开 |
| GET | `/api/oauth/:provider/callback` | OAuth 回调处理 | 公开 |
| POST | `/api/oauth/:provider/token` | Token 交换 | 公开 |
| GET | `/api/oauth/session` | 获取当前 OAuth 会话信息 | user |
| DELETE | `/api/oauth/session` | 撤销 OAuth 会话 | user |
| POST | `/api/admin/oauth/providers` | 创建 OAuth 提供商配置 | admin |
| PUT | `/api/admin/oauth/providers/:id` | 更新 OAuth 提供商配置 | admin |
| DELETE | `/api/admin/oauth/providers/:id` | 删除 OAuth 提供商配置 | admin |

#### 2.4.6 前端组件设计

```
src/
├── pages/
│   └── OAuthCallbackPage.tsx    # OAuth 回调处理页面
├── components/
│   ├── OAuthLoginButton.tsx     # OAuth 登录按钮
│   └── admin/
│       └── OAuthProviderConfig.tsx  # OAuth 配置组件
└── api/
    └── oauth.ts                 # OAuth API
```

#### 2.4.7 权限控制设计

```typescript
interface IPermission {
  resource: string;    // 资源类型
  action: string;      // 操作类型
  conditions?: any;    // 条件约束
}

interface IRole {
  name: string;
  permissions: IPermission[];
}

// 默认角色权限
const defaultRoles = {
  admin: {
    permissions: [
      { resource: '*', action: '*' }
    ]
  },
  enterprise_admin: {
    permissions: [
      { resource: 'skill', action: '*' },
      { resource: 'prompt', action: '*' },
      { resource: 'user', action: 'read' },
    ]
  },
  developer: {
    permissions: [
      { resource: 'skill', action: 'create' },
      { resource: 'skill', action: 'update', conditions: { owner: 'self' } },
      { resource: 'prompt', action: 'create' },
      { resource: 'prompt', action: 'update', conditions: { owner: 'self' } },
    ]
  },
  user: {
    permissions: [
      { resource: 'skill', action: 'read' },
      { resource: 'prompt', action: 'read' },
    ]
  }
};
```

#### 2.4.8 用户故事

**作为** 企业管理员  
**我想要** 配置企业 OAuth2 登录  
**以便于** 员工使用企业账号登录系统

**验收标准**:
- [ ] 支持配置多个 OAuth2 提供商
- [ ] 支持自定义用户信息字段映射
- [ ] 支持角色同步映射
- [ ] 首次登录自动创建用户
- [ ] 后续登录自动更新用户信息
- [ ] 支持 OIDC 协议

---

### 2.5 Agent API 前端开放功能

#### 2.5.1 需求背景

当前后端已有 Agent 模型和 API，但前端缺少对应的管理界面，用户无法方便地创建、管理 API Key 和查看使用情况。

#### 2.5.2 产品目标

- 提供 Agent 管理界面
- 支持 API Key 生成和管理
- 提供使用统计和分析
- 提供在线 API 文档

#### 2.5.3 前端页面设计

```
src/
├── pages/
│   ├── AgentsPage.tsx           # Agent 列表页面
│   ├── AgentDetailPage.tsx      # Agent 详情页面
│   ├── AgentCreatePage.tsx      # 创建 Agent 页面
│   └── ApiDocsPage.tsx          # API 文档页面
├── components/
│   ├── AgentCard.tsx            # Agent 卡片组件
│   ├── ApiKeyDisplay.tsx        # API Key 显示组件
│   ├── UsageChart.tsx           # 使用统计图表
│   └── ApiTester.tsx            # API 测试工具
└── api/
    └── agents.ts                # Agent API
```

#### 2.5.4 功能模块设计

**Agent 管理模块**:
- Agent 列表展示
- 创建新 Agent
- 编辑 Agent 信息
- 删除 Agent
- 启用/禁用 Agent

**API Key 管理**:
- 显示 API Key (仅创建时显示一次)
- 重新生成 API Key
- 设置 API Key 过期时间
- API Key 权限配置

**使用统计模块**:
- 请求次数统计
- 按时间段的请求趋势
- 按资源类型的请求分布
- 错误率统计
- 速率限制使用情况

**API 文档模块**:
- 交互式 API 文档
- 在线测试工具
- SDK 下载
- 示例代码

#### 2.5.5 API 文档内容

```markdown
# SkillHub API 文档

## 认证

所有 API 请求需要在 Header 中携带 API Key:

```
Authorization: Bearer sk_xxxxxxxxxxxxxxxx
```

## 端点

### 获取 Skill 列表

GET /api/agent-resources/skills

**参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `category`: 分类筛选
- `search`: 搜索关键词

**响应**:
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### 获取 Skill 详情

GET /api/agent-resources/skills/:id

### 下载 Skill

GET /api/agent-resources/skills/:id/download

### 获取 Prompt 列表

GET /api/agent-resources/prompts

### 获取 Prompt 详情

GET /api/agent-resources/prompts/:id

## 错误处理

| 状态码 | 描述 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 请求频率超限 |
| 500 | 服务器错误 |
```

#### 2.5.6 用户故事

**作为** 开发者  
**我想要** 创建和管理 API Key  
**以便于** 通过 API 访问 SkillHub 资源

**验收标准**:
- [ ] 可以创建多个 Agent
- [ ] API Key 仅在创建时显示一次
- [ ] 可以重新生成 API Key
- [ ] 可以设置权限范围
- [ ] 可以查看使用统计
- [ ] 提供在线 API 文档
- [ ] 提供在线测试工具

---

## 三、技术架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                   │
├─────────────────────────────────────────────────────────────────┤
│  Pages          │  Components      │  Stores      │  API        │
│  - Home         │  - Layout        │  - authStore │  - client   │
│  - Skills       │  - SkillCard     │  - langStore │  - auth     │
│  - Prompts      │  - PromptCard    │              │  - skills   │
│  - Agents       │  - VersionList   │              │  - agents   │
│  - Settings     │  - LangSwitcher  │              │             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (Express + TypeScript)            │
├─────────────────────────────────────────────────────────────────┤
│  Routes         │  Controllers     │  Services    │  Models     │
│  - auth         │  - authCtrl      │  - oauth     │  - User     │
│  - oauth        │  - oauthCtrl     │  - version   │  - Skill    │
│  - versions     │  - versionCtrl   │  - i18n      │  - Prompt   │
│  - agents       │  - agentCtrl     │              │  - Agent    │
│  - customPages  │  - customPageCtrl│              │  - Version  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database (MongoDB)                        │
├─────────────────────────────────────────────────────────────────┤
│  Collections                                                     │
│  - users, skills, prompts, agents, enterprises                   │
│  - versions, custompages, oauthproviders, oauthsessions          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 数据库索引优化

```javascript
// versions collection
db.versions.createIndex({ resourceType: 1, resourceId: 1, version: 1 });
db.versions.createIndex({ resourceType: 1, resourceId: 1, status: 1 });

// custompages collection
db.custompages.createIndex({ enterpriseId: 1, pageType: 1 });

// oauthproviders collection
db.oauthproviders.createIndex({ enterpriseId: 1, isActive: 1 });

// oauthsessions collection
db.oauthsessions.createIndex({ userId: 1, providerId: 1 });
db.oauthsessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## 四、实施路线图

### Phase 1: 基础功能 (2周)

**目标**: 完成国际化基础架构和底部导航栏自定义

**任务**:
1. 集成 react-i18next
2. 创建中英文翻译文件
3. 实现语言切换组件
4. 创建 CustomPage 模型和 API
5. 实现自定义页面管理界面

### Phase 2: 版本控制 (2周)

**目标**: 完成 Skill 和 Prompt 多版本控制功能

**任务**:
1. 创建 Version 模型
2. 实现版本创建 API
3. 实现版本对比功能
4. 实现版本回滚功能
5. 创建版本管理前端界面

### Phase 3: 企业集成 (2周)

**目标**: 完成 OAuth2 登录集成

**任务**:
1. 创建 OAuthProvider 模型
2. 实现 OAuth2 授权流程
3. 实现用户信息映射
4. 实现角色权限同步
5. 创建 OAuth 配置管理界面

### Phase 4: API 开放 (1周)

**目标**: 完成 Agent API 前端管理功能

**任务**:
1. 创建 Agent 管理页面
2. 实现 API Key 管理界面
3. 实现使用统计图表
4. 创建 API 文档页面
5. 实现在线测试工具

---

## 五、风险评估与缓解

| 风险 | 影响 | 可能性 | 缓解措施 |
|------|------|--------|----------|
| OAuth2 集成兼容性问题 | 高 | 中 | 支持多种 OAuth2 提供商，提供详细配置文档 |
| 版本控制性能问题 | 中 | 低 | 使用分页和索引优化，限制版本数量 |
| 翻译内容维护成本 | 低 | 高 | 使用翻译管理工具，支持社区贡献 |
| API Key 安全风险 | 高 | 低 | 加密存储，定期轮换，访问日志审计 |

---

## 六、成功指标

### 用户指标
- 月活跃用户增长 > 20%
- 企业用户注册增长 > 30%
- API 调用量增长 > 50%

### 功能指标
- 国际化覆盖率 > 95%
- 版本控制使用率 > 40%
- OAuth 登录使用率 > 60%
- Agent API 使用率 > 25%

### 质量指标
- API 响应时间 < 200ms
- 页面加载时间 < 2s
- 错误率 < 0.1%

---

## 七、附录

### A. 相关技术文档

- [react-i18next 官方文档](https://react.i18next.com/)
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [Semantic Versioning](https://semver.org/)

### B. 现有代码参考

- [User Model](file:///d:/workplace/idea/agent-browser/backend/src/models/User.ts)
- [Skill Model](file:///d:/workplace/idea/agent-browser/backend/src/models/Skill.ts)
- [Agent Model](file:///d:/workplace/idea/agent-browser/backend/src/models/Agent.ts)
- [Layout Component](file:///d:/workplace/idea/agent-browser/frontend/src/components/Layout.tsx)

---

**文档结束**
