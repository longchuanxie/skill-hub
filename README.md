# SkillHub - AI Resource Platform

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## English

### Overview

SkillHub is an enterprise-grade AI resource management platform designed for discovering, sharing, and managing AI skills and prompts. It provides a comprehensive solution for teams and individuals to collaborate on AI resources with version control, enterprise management, and API integration capabilities.

### Features

#### Core Features
- **Skills Management** - Upload, share, and download AI skill packages (ZIP format)
- **Prompts Management** - Create, edit, and manage AI prompts with variable support
- **Version Control** - Complete version history, comparison, and rollback capabilities
- **Agent API** - RESTful API with API Key authentication for external integrations

#### Enterprise Features
- **Multi-tenant Architecture** - Enterprise-level resource isolation and management
- **OAuth Integration** - Support for GitHub and Google OAuth authentication
- **Content Review** - Automated content moderation and approval workflow
- **Permission Management** - Role-based access control (RBAC)

#### Community Features
- **Social Interactions** - Likes, favorites, comments, and ratings
- **Marketplace** - Public resource marketplace for community sharing
- **Trending** - Community trends and popular resources

### Tech Stack

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, OAuth 2.0
- **File Handling**: Multer, Archiver, Unzipper
- **Logging**: Winston

#### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Internationalization**: i18next
- **UI Components**: Radix UI, shadcn/ui
- **Icons**: Lucide React

### Project Structure

```
skill-hub/
├── backend/                    # Backend service
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Express middleware
│   │   ├── config/            # Configuration files
│   │   ├── utils/             # Utility functions
│   │   └── app.ts             # Application entry
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── api/               # API client
│   │   ├── stores/            # State management
│   │   ├── i18n/              # Internationalization
│   │   └── App.tsx            # Main application
│   ├── package.json
│   └── vite.config.ts
└── docs/                       # Documentation
```

### Quick Start

#### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm or yarn

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# Edit .env with your settings

# Start development server
npm run dev
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=3002
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/skillhub

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

### API Documentation

#### Authentication

```bash
# Login
POST /api/auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123"
}

# Register
POST /api/auth/register
Content-Type: application/json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123"
}
```

#### Skills API

```bash
# List skills
GET /api/skills?page=1&pageSize=12&category=general&search=keyword

# Create skill
POST /api/skills
Authorization: Bearer <token>
Content-Type: multipart/form-data

# Get skill details
GET /api/skills/:id

# Download skill
GET /api/skills/:id/download
```

#### Prompts API

```bash
# List prompts
GET /api/prompts?page=1&pageSize=12&category=general

# Create prompt
POST /api/prompts
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "My Prompt",
  "description": "Description",
  "content": "You are a helpful assistant...",
  "variables": [],
  "category": "general",
  "tags": ["assistant"]
}

# Version history
GET /api/prompts/:id/versions

# Version comparison
GET /api/prompts/:id/compare?version1=1.0.0&version2=1.1.0

# Rollback
POST /api/prompts/:id/rollback/:version
```

#### Agent API

```bash
# All Agent API requests require API Key
Headers:
  x-api-key: <your-api-key>

# List resources
GET /api/agent/skills
GET /api/agent/prompts

# Create resource
POST /api/agent/skills
POST /api/agent/prompts
```

### Data Models

#### User
| Field | Type | Description |
|-------|------|-------------|
| username | String | Unique username |
| email | String | Unique email |
| password | String | Hashed password |
| avatar | String | Avatar URL |
| enterpriseId | ObjectId | Enterprise reference |
| apiKeys | Array | API keys for authentication |

#### Skill
| Field | Type | Description |
|-------|------|-------------|
| name | String | Skill name |
| description | String | Description |
| owner | ObjectId | Creator reference |
| category | String | Category |
| tags | Array | Tags |
| files | Array | Uploaded files |
| version | String | Current version |
| versions | Array | Version history |
| visibility | String | public/private/enterprise |
| status | String | draft/pending/approved/rejected |
| downloads | Number | Download count |
| averageRating | Number | Average rating |

#### Prompt
| Field | Type | Description |
|-------|------|-------------|
| name | String | Prompt name |
| description | String | Description |
| content | String | Prompt content |
| variables | Array | Variable definitions |
| owner | ObjectId | Creator reference |
| version | String | Current version |
| versions | Array | Version history |
| visibility | String | public/private/enterprise |

#### Agent
| Field | Type | Description |
|-------|------|-------------|
| description | String | Agent description |
| apiKey | String | API key for authentication |
| owner | ObjectId | Owner reference |
| permissions | Object | Read/write permissions |
| usage | Object | Usage statistics |

### Internationalization

SkillHub supports multiple languages:
- English (en)
- Chinese (zh)

Language files are located in `frontend/src/i18n/locales/`.

### License

MIT License

---

<a name="中文"></a>

## 中文

### 项目简介

SkillHub 是一个企业级 AI 资源管理平台，专为发现、分享和管理 AI 技能与提示词而设计。它为团队和个人提供了一个完整的解决方案，支持版本控制、企业管理和 API 集成能力。

### 功能特性

#### 核心功能
- **技能管理** - 上传、分享和下载 AI 技能包（ZIP 格式）
- **提示词管理** - 创建、编辑和管理支持变量的 AI 提示词
- **版本控制** - 完整的版本历史、版本对比和版本回滚功能
- **Agent API** - 支持 API Key 认证的 RESTful API，便于外部系统集成

#### 企业功能
- **多租户架构** - 企业级资源隔离和管理
- **OAuth 集成** - 支持 GitHub 和 Google OAuth 认证
- **内容审核** - 自动化内容审核和审批工作流
- **权限管理** - 基于角色的访问控制（RBAC）

#### 社区功能
- **社交互动** - 点赞、收藏、评论和评分
- **资源市场** - 公开资源市场，支持社区分享
- **热门趋势** - 社区趋势和热门资源展示

### 技术栈

#### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: MongoDB + Mongoose ODM
- **认证**: JWT、OAuth 2.0
- **文件处理**: Multer、Archiver、Unzipper
- **日志**: Winston

#### 前端
- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **国际化**: i18next
- **UI 组件**: Radix UI、shadcn/ui
- **图标**: Lucide React

### 项目结构

```
skill-hub/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── controllers/       # 控制器
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由定义
│   │   ├── middleware/        # 中间件
│   │   ├── config/            # 配置文件
│   │   ├── utils/             # 工具函数
│   │   └── app.ts             # 应用入口
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/        # React 组件
│   │   ├── pages/             # 页面组件
│   │   ├── api/               # API 客户端
│   │   ├── stores/            # 状态管理
│   │   ├── i18n/              # 国际化
│   │   └── App.tsx            # 主应用
│   ├── package.json
│   └── vite.config.ts
└── docs/                       # 文档
```

### 快速开始

#### 环境要求
- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm 或 yarn

#### 后端配置

```bash
cd backend

# 安装依赖
npm install

# 创建环境配置文件
cp .env.example .env

# 配置环境变量
# 编辑 .env 文件，填入您的配置

# 启动开发服务器
npm run dev
```

#### 前端配置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 环境变量

在 backend 目录下创建 `.env` 文件：

```env
# 服务器配置
PORT=3002
NODE_ENV=development

# 数据库
MONGODB_URI=mongodb://localhost:27017/skillhub

# JWT 配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# OAuth（可选）
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 邮件配置（可选）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

### API 文档

#### 认证接口

```bash
# 登录
POST /api/auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123"
}

# 注册
POST /api/auth/register
Content-Type: application/json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123"
}
```

#### 技能接口

```bash
# 获取技能列表
GET /api/skills?page=1&pageSize=12&category=general&search=keyword

# 创建技能
POST /api/skills
Authorization: Bearer <token>
Content-Type: multipart/form-data

# 获取技能详情
GET /api/skills/:id

# 下载技能
GET /api/skills/:id/download
```

#### 提示词接口

```bash
# 获取提示词列表
GET /api/prompts?page=1&pageSize=12&category=general

# 创建提示词
POST /api/prompts
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "我的提示词",
  "description": "描述",
  "content": "你是一个有帮助的助手...",
  "variables": [],
  "category": "general",
  "tags": ["assistant"]
}

# 版本历史
GET /api/prompts/:id/versions

# 版本对比
GET /api/prompts/:id/compare?version1=1.0.0&version2=1.1.0

# 版本回滚
POST /api/prompts/:id/rollback/:version
```

#### Agent API

```bash
# 所有 Agent API 请求需要 API Key
Headers:
  x-api-key: <your-api-key>

# 获取资源列表
GET /api/agent/skills
GET /api/agent/prompts

# 创建资源
POST /api/agent/skills
POST /api/agent/prompts
```

### 数据模型

#### 用户
| 字段 | 类型 | 描述 |
|------|------|------|
| username | String | 用户名（唯一） |
| email | String | 邮箱（唯一） |
| password | String | 加密密码 |
| avatar | String | 头像 URL |
| enterpriseId | ObjectId | 企业引用 |
| apiKeys | Array | API 密钥列表 |

#### 技能
| 字段 | 类型 | 描述 |
|------|------|------|
| name | String | 技能名称 |
| description | String | 描述 |
| owner | ObjectId | 创建者引用 |
| category | String | 分类 |
| tags | Array | 标签 |
| files | Array | 上传的文件 |
| version | String | 当前版本 |
| versions | Array | 版本历史 |
| visibility | String | public/private/enterprise |
| status | String | draft/pending/approved/rejected |
| downloads | Number | 下载次数 |
| averageRating | Number | 平均评分 |

#### 提示词
| 字段 | 类型 | 描述 |
|------|------|------|
| name | String | 提示词名称 |
| description | String | 描述 |
| content | String | 提示词内容 |
| variables | Array | 变量定义 |
| owner | ObjectId | 创建者引用 |
| version | String | 当前版本 |
| versions | Array | 版本历史 |
| visibility | String | public/private/enterprise |

#### Agent
| 字段 | 类型 | 描述 |
|------|------|------|
| description | String | Agent 描述 |
| apiKey | String | API 密钥 |
| owner | ObjectId | 所有者引用 |
| permissions | Object | 读写权限 |
| usage | Object | 使用统计 |

### 国际化

SkillHub 支持多语言：
- 英文
- 中文

语言文件位于 `frontend/src/i18n/locales/`。

### 许可证

MIT License
