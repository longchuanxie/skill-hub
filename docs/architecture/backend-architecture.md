# SkillHub 后端 - 系统架构设计

## 1. 系统架构概述

### 1.1 技术栈
| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 运行时 | Node.js | JavaScript运行环境 |
| 框架 | Express.js | Web应用框架 |
| 数据库 | MongoDB | 文档型数据库 |
| ODM | Mongoose | MongoDB对象建模 |
| 认证 | JWT | JSON Web Token |
| 密码加密 | bcryptjs | 密码哈希 |
| 文件存储 | MinIO / 本地存储 | Skill文件存储 |
| 内容检测 | 自定义检测服务 | 提示词安全检测 |

### 1.2 服务端口配置
- **API服务**: 3001
- **MongoDB**: 27017
- **MinIO**: 9000 (API) / 9001 (Console)

### 1.3 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │  Web   │  │  移动端 │  │  智能体 │  │  API   │      │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘      │
└───────┼────────────┼────────────┼────────────┼─────────────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                           │
                    ┌──────┴──────┐
                    │   网关层    │
                    │  (Express)  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────┴───────┐  ┌──────┴──────┐  ┌──────┴───────┐
│   认证中间件   │  │  业务逻辑层  │  │  公共服务层   │
│  (Middleware) │  │ (Services)  │  │  (Utils)     │
└───────┬───────┘  └──────┬──────┘  └──────┬───────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
   ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐
   │  MongoDB  │    │   MinIO   │    │   外部    │
   │ (数据库)   │    │ (文件存储) │    │   API    │
   └───────────┘    └───────────┘    └───────────┘
```

### 1.4 目录结构

```
backend/
├── src/
│   ├── config/              # 配置文件
│   │   ├── database.ts      # 数据库配置
│   │   ├── redis.ts         # Redis配置
│   │   └── storage.ts       # 存储配置
│   ├── controllers/         # 控制器
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── skill.controller.ts
│   │   ├── prompt.controller.ts
│   │   ├── enterprise.controller.ts
│   │   ├── agent.controller.ts
│   │   └── upload.controller.ts
│   ├── models/              # 数据模型
│   │   ├── User.ts
│   │   ├── Enterprise.ts
│   │   ├── Skill.ts
│   │   ├── Prompt.ts
│   │   ├── Rating.ts
│   │   └── Agent.ts
│   ├── services/             # 业务逻辑
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── skill.service.ts
│   │   ├── prompt.service.ts
│   │   ├── enterprise.service.ts
│   │   ├── agent.service.ts
│   │   └── upload.service.ts
│   ├── middleware/           # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── enterprise.middleware.ts
│   │   ├── resource.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   ├── agent.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/              # 路由定义
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── skill.routes.ts
│   │   ├── prompt.routes.ts
│   │   ├── enterprise.routes.ts
│   │   ├── agent.routes.ts
│   │   └── upload.routes.ts
│   ├── utils/               # 工具函数
│   │   ├── response.ts
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   ├── validator.ts
│   │   └── security.ts
│   ├── constants/          # 常量定义
│   │   ├── roles.ts
│   │   ├── errors.ts
│   │   └── config.ts
│   ├── types/               # 类型定义
│   │   └── express.d.ts
│   ├── app.ts              # 应用入口
│   └── server.ts           # 服务入口
├── tests/                   # 测试文件
├── package.json
└── tsconfig.json
```
