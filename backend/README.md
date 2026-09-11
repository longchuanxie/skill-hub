# Backend - Agent Browser API

Agent Browser 后端服务，提供技能和提示词管理的 RESTful API。

## 技术栈

- **Node.js** - 运行时环境
- **Express.js** - Web 框架
- **TypeScript** - 类型安全
- **MongoDB** - 数据库
- **Mongoose** - ODM
- **JWT** - 身份认证
- **Multer** - 文件上传
- **Winston** - 日志管理

## 目录结构

```
backend/
├── src/
│   ├── controllers/     # 控制器
│   │   ├── authController.ts      # 认证控制器
│   │   ├── UserController.ts      # 用户控制器
│   │   ├── SkillController.ts     # 技能控制器
│   │   ├── PromptController.ts    # 提示词控制器
│   │   ├── agentController.ts     # Agent 控制器
│   │   └── ...
│   ├── models/          # 数据模型
│   │   ├── User.ts               # 用户模型
│   │   ├── Skill.ts              # 技能模型
│   │   ├── Prompt.ts             # 提示词模型
│   │   ├── Agent.ts              # Agent 模型
│   │   └── ...
│   ├── routes/          # 路由定义
│   │   ├── auth.ts               # 认证路由
│   │   ├── users.ts              # 用户路由
│   │   ├── skills.ts             # 技能路由
│   │   ├── prompts.ts            # 提示词路由
│   │   ├── agentResources.ts     # Agent API 路由
│   │   └── ...
│   ├── middleware/      # 中间件
│   │   ├── auth.ts               # JWT 认证中间件
│   │   ├── agentAuth.ts          # Agent API Key 认证
│   │   ├── upload.ts             # 文件上传中间件
│   │   └── ...
│   ├── config/          # 配置
│   │   ├── enterpriseContext.ts  # 企业上下文配置
│   │   └── contentReviewConfig.ts # 内容审核配置
│   ├── utils/           # 工具函数
│   │   ├── logger.ts             # 日志工具
│   │   ├── resourceAutoReview.ts # 资源自动审核
│   │   └── ...
│   └── app.ts           # 应用入口
├── uploads/             # 上传文件存储
├── dist/                # 编译输出
├── .env                 # 环境变量
├── package.json
└── tsconfig.json
```

## 环境配置

创建 `.env` 文件：

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

# OAuth (可选)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 安装与运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 编译
npm run build

# 生产模式
npm start
```

## API 接口

### 认证接口

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### 技能接口

#### 获取技能列表
```
GET /api/skills?page=1&pageSize=12&category=general&search=keyword
Authorization: Bearer <token>
```

#### 创建技能
```
POST /api/skills
Authorization: Bearer <token>
Content-Type: multipart/form-data

name: My Skill
description: Skill description
category: general
file: skill.zip
```

#### 获取版本历史
```
GET /api/skills/:id/versions
Authorization: Bearer <token>
```

#### 版本回滚
```
POST /api/skills/:id/rollback/:version
Authorization: Bearer <token>
```

### 提示词接口

#### 获取提示词列表
```
GET /api/prompts?page=1&pageSize=12&category=general&search=keyword
Authorization: Bearer <token>
```

#### 创建提示词
```
POST /api/prompts
Authorization: Bearer <token>
Content-Type: application/json

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

#### 版本对比
```
GET /api/prompts/:id/compare?version1=1.0.0&version2=1.1.0
Authorization: Bearer <token>
```

### Agent API 接口

Agent API 使用 API Key 认证，适用于外部系统集成。

#### 认证方式
```
Headers:
  x-api-key: <your-api-key>
```

#### 获取技能列表
```
GET /api/agent/skills
x-api-key: <your-api-key>
```

#### 创建技能
```
POST /api/agent/skills
x-api-key: <your-api-key>
Content-Type: multipart/form-data

name: My Skill
description: Skill description
file: skill.zip
```

## 数据模型

### User
```typescript
{
  username: string;
  email: string;
  password: string;
  avatar?: string;
  enterpriseId?: ObjectId;
  apiKeys: Array<{
    description: string;
    key: string;
    createdAt: Date;
    lastUsed?: Date;
  }>;
}
```

### Skill
```typescript
{
  name: string;
  description: string;
  owner: ObjectId;
  category: string;
  tags: string[];
  files: Array<{
    filename: string;
    path: string;
    size: number;
  }>;
  version: string;
  versions: Array<{
    version: string;
    url: string;
    createdAt: Date;
  }>;
  visibility: 'public' | 'private' | 'enterprise';
  status: 'pending' | 'approved' | 'rejected';
  downloads: number;
  averageRating: number;
}
```

### Prompt
```typescript
{
  name: string;
  description: string;
  content: string;
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    description?: string;
  }>;
  owner: ObjectId;
  category: string;
  tags: string[];
  version: string;
  versions: Array<{
    version: string;
    content: string;
    description: string;
    variables: Array<any>;
    createdAt: Date;
  }>;
  visibility: 'public' | 'private' | 'enterprise';
  status: 'pending' | 'approved' | 'rejected';
}
```

### Agent
```typescript
{
  description: string;
  apiKey: string;
  owner: ObjectId;
  enterpriseId?: ObjectId;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    allowedResources: string[];
  };
  usage: {
    totalRequests: number;
    lastUsed: Date;
  };
}
```

## 版本控制实现

### 版本保存
每次更新资源时，自动将当前版本保存到 `versions` 数组：
- 记录版本号、内容、描述、变量等信息
- 自动生成版本号（基于时间戳或语义化版本）

### 版本对比
通过 `compare` 接口对比两个版本的差异：
- 内容变更检测
- 描述变更检测
- 变量变更检测

### 版本回滚
回滚到指定版本时：
1. 将当前版本保存到历史记录
2. 恢复目标版本的内容
3. 生成新的版本号（如 `1.0.0-restored`）

## mongoDB 索引启动命令
"D:\workplace\idea\skill-hub\mongodb-win32-x86_64-windows-7.0.14\bin\mongod.exe" --port 27017 --dbpath "D:\workplace\idea\skill-hub\data"

## 数据库索引要求

### 必需索引

上线前需要确保以下索引已创建：

#### Skill 模型索引

```javascript
// 同一用户不能创建同名技能（复合唯一索引）
db.skills.createIndex(
  { owner: 1, name: 1 },
  { unique: true, partialFilterExpression: { name: { $exists: true, $ne: '' } } }
)
```

#### Prompt 模型索引

```javascript
// 同一用户不能创建同名提示词（复合唯一索引）
db.prompts.createIndex(
  { owner: 1, name: 1 },
  { unique: true }
)
```

### 数据清理

创建唯一索引前，需先清理重复数据：

```javascript
// 查找 Skill 重复数据
db.skills.aggregate([
  { $match: { name: { $exists: true, $ne: '' } } },
  { $group: { _id: { owner: "$owner", name: "$name" }, count: { $sum: 1 }, docs: { $push: "$_id" } } },
  { $match: { count: { $gt: 1 } } }
])

// 查找 Prompt 重复数据
db.prompts.aggregate([
  { $group: { _id: { owner: "$owner", name: "$name" }, count: { $sum: 1 }, docs: { $push: "$_id" } } },
  { $match: { count: { $gt: 1 } } }
])
```

### 同名资源版本管理

当同一用户上传同名资源时，系统会自动：
1. 检测 `owner + name` 组合是否已存在
2. 如存在，自动创建新版本而非新建记录
3. 版本号自动递增（如 1.0.0 → 1.0.1）

## 许可证

MIT License
