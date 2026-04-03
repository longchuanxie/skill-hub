---
title: SkillHub 快速入手指南
document-type: guides
version: 1.0.0
created-date: 2026-03-22
---

# SkillHub 快速入手指南

## 一、项目概述

SkillHub 是一个企业级 AI 资源管理平台，用于发现、分享和管理 AI 技能（Skills）与提示词（Prompts）。平台支持版本控制、企业管理和 API 集成等功能。

### 技术栈

| 层级 | 技术选型 |
|------|----------|
| 后端运行时 | Node.js |
| 后端框架 | Express.js |
| 数据库 | MongoDB + Mongoose ODM |
| 前端框架 | React 18 + TypeScript |
| 前端构建 | Vite |
| 样式框架 | Tailwind CSS |
| 状态管理 | Zustand |
| 用户认证 | JWT + OAuth 2.0 |

---

## 二、环境准备

### 2.1 前置要求

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm 或 yarn

### 2.2 端口配置

| 服务 | 默认端口 |
|------|----------|
| 后端 API | 3001 |
| 前端开发服务器 | 5173 |
| MongoDB | 27017 |

---

## 三、后端配置

### 3.1 安装依赖

```bash
cd backend
npm install
```

### 3.2 环境变量配置

在 `backend` 目录下创建 `.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/skillhub

# JWT 配置（生产环境必须修改）
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS 配置
CORS_ORIGIN=http://localhost:5173

# 前端 URL（用于邮件链接）
FRONTEND_URL=http://localhost:5173

# 邮件服务配置（可选，用于密码重置、邮箱验证）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
SMTP_FROM_NAME=SkillHub
SMTP_FROM_EMAIL=noreply@skillhub.com

# 存储配置
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=uploads
STORAGE_BASE_URL=

# OAuth 配置（可选，用于 GitHub/Google 等第三方登录）
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_CALLBACK_BASE_URL=http://localhost:3002

# 企业单租户配置（可选，用于私有化部署）
ENTERPRISE_ID=69b69cd7331f0d2ee69f9676
ENTERPRISE_MODE=single-tenant
ALLOW_PUBLIC_RESOURCES=false

# 日志配置
LOG_LEVEL=info

# 速率限制配置
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PUBLIC_WINDOW=60000
RATE_LIMIT_PUBLIC_MAX=10
RATE_LIMIT_AUTH_WINDOW=60000
RATE_LIMIT_AUTH_MAX=60
RATE_LIMIT_SENSITIVE_WINDOW=60000
RATE_LIMIT_SENSITIVE_MAX=20
RATE_LIMIT_EXTERNAL_WINDOW=60000
RATE_LIMIT_EXTERNAL_MAX=100

# Redis 配置（用于速率限制）
REDIS_URL=redis://localhost:6379

# 内容审核配置
CONTENT_REVIEW_ENABLED=true
CONTENT_REVIEW_STRICT_MODE=false
CONTENT_REVIEW_TIMEOUT=30000
SKIP_MALICIOUS_CODE_CHECK=false
SKIP_SENSITIVE_INFO_CHECK=false
SKIP_FORMAT_VALIDATION=false
```

### 3.3 配置项说明

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3001 | 服务器端口 |
| `NODE_ENV` | development | 运行环境 |
| `MONGODB_URI` | - | MongoDB 连接地址 |
| `JWT_SECRET` | - | JWT 密钥（生产环境必须修改） |
| `JWT_EXPIRES_IN` | 7d | Access Token 过期时间 |
| `JWT_REFRESH_EXPIRES_IN` | 30d | Refresh Token 过期时间 |
| `CORS_ORIGIN` | - | 允许的跨域来源 |
| `FRONTEND_URL` | - | 前端 URL（用于邮件链接） |

#### 邮件服务配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `SMTP_HOST` | - | SMTP 服务器地址 |
| `SMTP_PORT` | 587 | SMTP 服务器端口 |
| `SMTP_USER` | - | SMTP 用户名 |
| `SMTP_PASS` | - | SMTP 密码 |
| `SMTP_FROM_NAME` | SkillHub | 发送邮件的发件人名称 |
| `SMTP_FROM_EMAIL` | - | 发送邮件的发件人邮箱 |

#### OAuth 配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `GITHUB_CLIENT_ID` | - | GitHub OAuth 应用 Client ID |
| `GITHUB_CLIENT_SECRET` | - | GitHub OAuth 应用 Client Secret |
| `GOOGLE_CLIENT_ID` | - | Google OAuth 应用 Client ID |
| `GOOGLE_CLIENT_SECRET` | - | Google OAuth 应用 Client Secret |
| `OAUTH_CALLBACK_BASE_URL` | http://localhost:3002 | OAuth 回调基础 URL |

#### 企业单租户配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `ENTERPRISE_ID` | - | 企业 MongoDB ObjectId，用于单租户模式 |
| `ENTERPRISE_MODE` | multi-tenant | 部署模式：`single-tenant` 或 `multi-tenant` |
| `ALLOW_PUBLIC_RESOURCES` | false | 单租户模式下是否允许公开资源 |

#### 日志配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `LOG_LEVEL` | info | 日志级别：debug, info, warn, error |

#### 速率限制配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `RATE_LIMIT_ENABLED` | true | 是否启用速率限制 |
| `RATE_LIMIT_PUBLIC_WINDOW` | 60000 | 公开接口时间窗口（毫秒） |
| `RATE_LIMIT_PUBLIC_MAX` | 10 | 公开接口最大请求数 |
| `RATE_LIMIT_AUTH_WINDOW` | 60000 | 认证接口时间窗口（毫秒） |
| `RATE_LIMIT_AUTH_MAX` | 60 | 认证接口最大请求数 |
| `RATE_LIMIT_SENSITIVE_WINDOW` | 60000 | 敏感操作时间窗口（毫秒） |
| `RATE_LIMIT_SENSITIVE_MAX` | 20 | 敏感操作最大请求数 |
| `RATE_LIMIT_EXTERNAL_WINDOW` | 60000 | 外部 API 时间窗口（毫秒） |
| `RATE_LIMIT_EXTERNAL_MAX` | 100 | 外部 API 最大请求数 |

#### Redis 配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `REDIS_URL` | redis://localhost:6379 | Redis 连接地址（用于速率限制） |

#### 内容审核配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CONTENT_REVIEW_ENABLED` | true | 是否启用内容审核 |
| `CONTENT_REVIEW_STRICT_MODE` | false | 严格模式：审核失败则拒绝上传 |
| `CONTENT_REVIEW_TIMEOUT` | 30000 | 审核超时时间（毫秒） |
| `CUSTOM_REVIEW_PLUGIN_PATH` | - | 自定义审核插件路径 |
| `SKIP_MALICIOUS_CODE_CHECK` | false | 跳过恶意代码检测 |
| `SKIP_SENSITIVE_INFO_CHECK` | false | 跳过敏感信息检测 |
| `SKIP_FORMAT_VALIDATION` | false | 跳过格式验证 |

##### 内容审核插件接口

系统支持通过自定义插件扩展内容审核能力。插件需实现以下接口：

```typescript
interface ReviewPlugin {
  name: string;           // 插件名称
  version: string;        // 插件版本
  description: string;    // 插件描述
  review: (context: ReviewContext) => Promise<ReviewResult>;  // 审核方法
  validate?: () => Promise<boolean>;   // 可选：插件验证
  cleanup?: () => Promise<void>;       // 可选：清理资源
}

interface ReviewContext {
  resourceType: 'skill' | 'prompt';
  resourceData: any;
  filePath?: string;
  userId?: string;
  enterpriseId?: string;
  metadata?: Record<string, any>;
}

interface ReviewResult {
  passed: boolean;        // 审核是否通过
  reasons: string[];      // 未通过原因
  severity: 'low' | 'medium' | 'high';  // 严重程度
  warnings: string[];      // 警告信息
  customData?: any;       // 自定义数据
}
```

##### 自定义插件开发示例

```typescript
// custom-review-plugin.ts
export default {
  name: 'custom-review-plugin',
  version: '1.0.0',
  description: '自定义内容审核插件',

  async review(context) {
    // 实现自定义审核逻辑
    const { resourceType, resourceData } = context;

    // 示例：检查敏感词
    const sensitiveWords = ['xxx', 'yyy'];
    const found = sensitiveWords.filter(w => 
      JSON.stringify(resourceData).includes(w)
    );

    return {
      passed: found.length === 0,
      reasons: found.length > 0 ? [`发现敏感词: ${found.join(', ')}`] : [],
      severity: found.length > 0 ? 'high' : 'low',
      warnings: []
    };
  },

  async validate() {
    // 验证插件配置
    return true;
  }
};
```

##### 启用自定义插件

1. 将插件文件放置到合适的位置（如 `backend/plugins/custom-review-plugin.ts`）
2. 在 `.env` 中配置插件路径：

```env
CUSTOM_REVIEW_PLUGIN_PATH=./plugins/custom-review-plugin.ts
```

### 3.4 启动后端服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

---

## 四、前端配置

### 4.1 安装依赖

```bash
cd frontend
npm install
```

### 4.2 启动前端服务

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

---

## 五、功能模块介绍

### 5.1 认证模块 `/api/auth`

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/refresh` | POST | 刷新 Token |
| `/api/auth/logout` | POST | 登出 |
| `/api/auth/forgot-password` | POST | 发送密码重置邮件 |
| `/api/auth/reset-password` | POST | 重置密码 |

**用户注册示例：**
```json
POST /api/auth/register
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**用户登录示例：**
```json
POST /api/auth/login
{
  "account": "test@example.com",
  "password": "password123"
}
```

### 5.2 技能管理模块 `/api/skills`

技能（Skill）是可上传的 AI 能力包，以 ZIP 格式存储。

| 功能 | 说明 |
|------|------|
| 创建技能 | 上传 ZIP 包，包含元数据和文件 |
| 版本管理 | 支持多版本、上传新版本、版本回滚 |
| 权限控制 | public/private/enterprise/shared 四种权限类型 |
| 内容审核 | 提交后需管理员审核批准 |

**获取技能列表：**
```
GET /api/skills?page=1&pageSize=12&category=general&search=keyword
Authorization: Bearer <token>
```

### 5.3 提示词管理模块 `/api/prompts`

提示词（Prompt）是可复用的 AI 提示模板，支持变量替换。

| 功能 | 说明 |
|------|------|
| 创建提示词 | 包含名称、内容、变量定义 |
| 变量支持 | 支持 string/number/boolean 等类型 |
| 版本历史 | 完整的版本记录和对比功能 |
| 安全检测 | 自动检测提示词安全性 |

**创建提示词示例：**
```json
POST /api/prompts
{
  "name": "My Prompt",
  "description": "Prompt description",
  "content": "You are a helpful assistant...",
  "variables": [
    {
      "name": "topic",
      "type": "string",
      "required": true,
      "description": "Topic to discuss"
    }
  ],
  "category": "general",
  "tags": ["assistant", "general"]
}
```

### 5.4 企业管理模块 `/api/enterprises`

| 功能 | 说明 |
|------|------|
| 多租户架构 | 企业间数据隔离 |
| 成员管理 | 邀请、移除企业成员 |
| OAuth 集成 | 支持 GitHub/Google OAuth 登录 |
| 内容审核 | 企业内资源审核流程 |

### 5.5 Agent API `/api/agents`

面向外部智能体的 RESTful API，支持 API Key 认证。

| 功能 | 说明 |
|------|------|
| API Key 管理 | 生成和管理 API Key |
| 资源访问 | 通过 API 访问技能和提示词 |
| 速率限制 | 防止滥用 |

### 5.6 社区互动功能

| 功能 | 路由 | 说明 |
|------|------|------|
| 收藏 | `/api/favorites` | 收藏资源 |
| 点赞 | `/api/likes` | 点赞资源 |
| 评论 | `/api/comments` | 评论资源 |
| 趋势 | `/api/trends` | 热门资源排行 |

### 5.7 其他功能

| 功能 | 路由 | 说明 |
|------|------|------|
| 搜索 | `/api/search` | 搜索技能和提示词 |
| 推荐 | `/api/recommendations` | 个性化推荐 |
| 首页 | `/api/home` | 首页数据聚合 |
| 在线测试 | `/api/test` | 提示词在线测试 |

---

## 六、核心数据模型

### 6.1 用户模型 (User)

| 字段 | 类型 | 说明 |
|------|------|------|
| username | string | 用户名，唯一 |
| email | string | 邮箱，唯一 |
| password | string | 加密后的密码 |
| role | string | 角色：admin/enterprise_admin/developer/user |
| enterpriseId | ObjectId | 所属企业 |
| status | string | 状态：active/inactive/banned |

### 6.2 技能模型 (Skill)

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 技能名称 |
| description | string | 技能描述 |
| author | ObjectId | 作者 |
| version | string | 当前版本号 |
| versions | array | 版本历史 |
| category | string | 分类 |
| tags | array | 标签 |
| status | string | 状态：draft/pending/approved/rejected |
| marketType | string | 市场类型：public/enterprise |

### 6.3 提示词模型 (Prompt)

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 提示词名称 |
| content | string | 提示词内容 |
| variables | array | 变量定义 |
| author | ObjectId | 作者 |
| version | string | 当前版本号 |
| category | string | 分类 |
| securityCheck | object | 安全检测结果 |

---

## 七、项目结构

```
skill-hub/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── controllers/       # 控制器（处理请求）
│   │   ├── models/            # 数据模型（Mongoose Schema）
│   │   ├── routes/            # 路由定义
│   │   ├── middleware/        # 中间件（认证、错误处理等）
│   │   ├── config/            # 配置文件
│   │   ├── utils/             # 工具函数
│   │   └── app.ts             # 应用入口
│   ├── package.json
│   └── .env.example
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/        # React 组件
│   │   ├── api/              # API 客户端
│   │   ├── i18n/             # 国际化配置
│   │   └── App.tsx           # 主应用
│   └── package.json
└── docs/                       # 文档
    └── guides/                # 指南文档
```

---

## 八、常用命令

### 后端

```bash
cd backend

# 安装依赖
npm install

# 开发模式
npm run dev

# 运行测试
npm test

# 代码检查
npm run lint

# 构建
npm run build
```

### 前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

---

## 九、存储配置

### 9.1 存储适配器架构

系统支持通过适配器模式扩展不同的存储方式。核心接口定义在 `src/interfaces/storage.interface.ts`：

```typescript
export interface StorageAdapter {
  upload(file: Express.Multer.File, destination?: string): Promise<string>;
  delete(filename: string): Promise<void>;
  getUrl(filename: string): string;
  getLocalPath(filename: string): string;
}
```

### 9.2 内置适配器

| 适配器 | 说明 |
|--------|------|
| `LocalStorageAdapter` | 本地文件系统存储 |

### 9.3 配置项说明

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `STORAGE_LOCAL_PATH` | `uploads` | 本地存储路径 |
| `STORAGE_BASE_URL` | 空 | 文件访问基础 URL |

### 9.4 自定义存储适配器

如需支持其他存储服务（如 S3、阿里云 OSS、MinIO、华为 OBS 等），可实现 `StorageAdapter` 接口：

```typescript
import { StorageAdapter } from '../interfaces/storage.interface';
import { Express } from 'express';

export class CustomStorageAdapter implements StorageAdapter {
  async upload(file: Express.Multer.File, destination?: string): Promise<string> {
    // 实现上传逻辑，返回文件名或对象 key
    return filename;
  }

  async delete(filename: string): Promise<void> {
    // 实现删除逻辑
  }

  getUrl(filename: string): string {
    // 返回文件的访问 URL
    return `https://cdn.example.com/${filename}`;
  }

  getLocalPath(filename: string): string {
    // 返回本地路径（用于服务读取）
    return `/path/to/storage/${filename}`;
  }
}
```

然后在 `StorageFactory.ts` 中注册：

```typescript
// StorageFactory.ts
import { StorageAdapter } from '../interfaces/storage.interface';
import { CustomStorageAdapter } from './CustomStorageAdapter';
import { localStorageAdapter } from './LocalStorageAdapter';

let storageAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (storageAdapter) {
    return storageAdapter;
  }

  // 可根据配置选择不同的适配器
  // const type = process.env.STORAGE_TYPE;
  // if (type === 'custom') {
  //   storageAdapter = new CustomStorageAdapter();
  // } else {
  storageAdapter = localStorageAdapter;
  // }

  return storageAdapter;
}
```

---

## 十、注意事项

1. **JWT Secret**：生产环境必须修改 `JWT_SECRET`，使用足够长的随机字符串
2. **CORS 配置**：确保 `CORS_ORIGIN` 与前端实际地址一致
3. **数据库连接**：确保 MongoDB 服务正常运行
4. **端口占用**：启动前确认 3001 和 5173 端口未被占用
5. **存储适配器**：自定义适配器需实现完整的 `StorageAdapter` 接口方法
