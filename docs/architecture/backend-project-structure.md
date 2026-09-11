# SkillHub 后端 - 项目结构

## 1. 项目结构总览

本文档详细描述SkillHub后端项目的目录结构和各模块职责。

## 2. 目录结构

```
backend/
├── src/
│   ├── config/                 # 配置文件
│   │   ├── database.ts         # 数据库配置
│   │   ├── jwt.ts             # JWT配置
│   │   ├── storage.ts         # 存储配置
│   │   └── rateLimit.ts       # 速率限制配置
│   │
│   ├── controllers/            # 控制器(处理请求)
│   │   ├── AuthController.ts      # 认证相关
│   │   ├── UserController.ts     # 用户相关
│   │   ├── SkillController.ts    # Skill相关
│   │   ├── PromptController.ts   # 提示词相关
│   │   ├── EnterpriseController.ts # 企业相关
│   │   ├── RatingController.ts   # 评分相关
│   │   ├── UploadController.ts   # 文件上传相关
│   │   └── AgentController.ts    # Agent相关
│   │
│   ├── middleware/             # 中间件
│   │   ├── auth.ts             # 认证中间件
│   │   ├── roleCheck.ts        # 角色检查中间件
│   │   ├── resourceOwner.ts    # 资源所有权验证
│   │   ├── securityCheck.ts   # 安全检查中间件
│   │   ├── rateLimiter.ts     # 速率限制中间件
│   │   ├── upload.ts          # 文件上传中间件
│   │   └── agent.ts           # Agent认证中间件
│   │
│   ├── models/                 # 数据模型(Mongoose)
│   │   ├── User.ts            # 用户模型
│   │   ├── Enterprise.ts      # 企业模型
│   │   ├── Skill.ts           # Skill模型
│   │   ├── Prompt.ts          # 提示词模型
│   │   ├── Rating.ts          # 评分模型
│   │   └── Agent.ts           # Agent模型
│   │
│   ├── routes/                 # 路由定义
│   │   ├── authRoutes.ts       # 认证路由
│   │   ├── userRoutes.ts       # 用户路由
│   │   ├── skillRoutes.ts      # Skill路由
│   │   ├── promptRoutes.ts     # 提示词路由
│   │   ├── enterpriseRoutes.ts # 企业路由
│   │   ├── uploadRoutes.ts     # 上传路由
│   │   └── agentRoutes.ts     # Agent路由
│   │
│   ├── services/               # 业务逻辑层
│   │   ├── AuthService.ts      # 认证服务
│   │   ├── UserService.ts      # 用户服务
│   │   ├── SkillService.ts     # Skill服务
│   │   ├── PromptService.ts    # 提示词服务
│   │   ├── EnterpriseService.ts # 企业服务
│   │   ├── StorageService.ts   # 存储服务
│   │   ├── SecurityService.ts  # 安全检测服务
│   │   └── AgentService.ts     # Agent服务
│   │
│   ├── utils/                  # 工具函数
│   │   ├── validators.ts       # 数据验证
│   │   ├── responseFormatter.ts # 响应格式化
│   │   ├── logger.ts           # 日志工具
│   │   ├── errors.ts           # 错误处理
│   │   ├── crypto.ts           # 加密工具
│   │   └── date.ts             # 日期工具
│   │
│   ├── constants/               # 常量定义
│   │   ├── roles.ts            # 角色常量
│   │   ├── errors.ts           # 错误码常量
│   │   └── config.ts           # 配置常量
│   │
│   ├── types/                   # 类型定义
│   │   ├── express.d.ts        # Express扩展类型
│   │   └── index.ts            # 全局类型
│   │
│   ├── app.ts                  # Express应用
│   └── server.ts               # 服务入口
│
├── uploads/                    # 本地文件存储目录
│
├── tests/                      # 测试文件
│   ├── unit/                   # 单元测试
│   ├── integration/            # 集成测试
│   └── e2e/                   # 端到端测试
│
├── .env                        # 环境变量(本地)
├── .env.example                # 环境变量示例
├── .gitignore                  # Git忽略配置
│
├── package.json                # 项目依赖
├── tsconfig.json               # TypeScript配置
├── jest.config.js              # Jest测试配置
└── README.md                  # 项目说明
```

## 3. 模块职责

### 3.1 控制器层 (Controllers)

负责处理HTTP请求，调用服务层，返回响应。

```
职责:
- 接收并解析请求参数
- 调用业务逻辑
- 处理异常
- 返回响应

特点:
- 保持简洁，不包含复杂业务逻辑
- 专注于请求/响应处理
- 调用Service层完成业务
```

### 3.2 服务层 (Services)

负责核心业务逻辑。

```
职责:
- 实现业务规则
- 处理数据操作
- 调用模型层
- 事务管理

特点:
- 包含核心业务逻辑
- 可被多个Controller调用
- 不直接处理HTTP请求
```

### 3.3 模型层 (Models)

负责数据结构和数据库操作。

```
职责:
- 定义数据结构
- 数据库CRUD操作
- 索引管理
- 钩子函数

特点:
- 使用Mongoose ODM
- 包含schema验证
- 可添加实例方法
```

### 3.4 中间件层 (Middleware)

负责请求处理的前置/后置工作。

```
职责:
- 认证检查
- 权限验证
- 数据预处理
- 响应后处理

类型:
- 全局中间件: 所有请求都会执行
- 路由中间件: 仅特定路由执行
```

### 3.5 路由层 (Routes)

负责定义API路由和中间件配置。

```
职责:
- 定义路由路径
- 配置中间件
- 绑定控制器方法
- API版本管理
```

## 4. 请求处理流程

```
客户端请求
     │
     ▼
┌─────────────────┐
│   路由匹配      │ ──► 404 Not Found
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 全局中间件      │ (日志、错误处理等)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 路由级中间件    │ (认证、权限等)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   控制器        │ (请求处理)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   服务层        │ (业务逻辑)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   模型层        │ (数据库操作)
└────────┬────────┘
         │
         ▼
    数据库MongoDB
         │
         ▼
┌─────────────────┐
│   响应返回      │
└─────────────────┘
```

## 5. 文件命名规范

| 类型 | 命名规范 | 示例 |
|------|----------|------|
| 控制器 | {name}.controller.ts | skill.controller.ts |
| 服务 | {name}.service.ts | skill.service.ts |
| 模型 | {name}.model.ts | skill.model.ts |
| 路由 | {name}.routes.ts | skill.routes.ts |
| 中间件 | {name}.middleware.ts | auth.middleware.ts |
| 工具 | {name}.ts | logger.ts |
| 类型 | {name}.d.ts | express.d.ts |

## 6. 导出约定

```typescript
// controllers/skill.controller.ts
export class SkillController {
  static async list() { }
  static async get() { }
  static async create() { }
  static async update() { }
  static async delete() { }
}

// 导出方式
import { SkillController } from './controllers/skill.controller';
```

## 7. 依赖关系

```
┌─────────────────────────────────────────────────────────┐
│                      Routes                             │
│   (定义API端点，绑定Controller和Middleware)            │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   Controllers                          │
│   (处理HTTP请求，调用Service)                         │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    Services                            │
│   (核心业务逻辑，调用Models和Utils)                   │
└──────────────────────────┬──────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Models    │    │   Utils     │    │  External   │
│  (数据库)   │    │  (工具)     │    │   APIs      │
└─────────────┘    └─────────────┘    └─────────────┘
```
