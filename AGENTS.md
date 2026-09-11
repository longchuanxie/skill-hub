# AGENTS.md

给 AI 编码代理（ZCode / Claude Code / Codex 等）的仓库操作说明。完整编码约定见
[docs/guides/coding-standards-guide.md](docs/guides/coding-standards-guide.md)（下称"规范"），本文是它的事务性摘要：命令、硬规则、本仓库特有的坑。两者冲突时以规范为准。

## 项目概览

SkillHub——AI 技能/提示词/Agent 资源托管与市场平台。前后端分离，**npm**（不要用 yarn/pnpm），开发环境为 Windows（Git Bash）。

- **backend/**：Express 4 + TypeScript(strict) + Mongoose 8 + MongoDB；JWT 认证；winston 日志
- **frontend/**：React 18 + Vite 5 + TypeScript(strict) + zustand + Tailwind **v3**（不是 v4）+ radix/shadcn + i18next
- 无 monorepo workspace；根 package.json 只是脚本编排

## 常用命令

```bash
# 根目录
npm run install:all        # 安装前后端全部依赖
npm run dev                # concurrently 同起 backend(3001) + frontend(5173)
npm run lint               # 前后端 ESLint（0 error 是底线）
npm run build:all          # 前端 build + 后端 tsc
npm test                   # 后端 jest（138 个集成测试）

# backend/
npm run dev                # ts-node-dev 启动 src/server.ts
npm test                   # jest；已配置 forceExit，套件结束即退出
npm run migrate:status     # migrate-mongo（需要本地 MongoDB 运行）

# frontend/
npm run build              # tsc + vite build（约 4-5s，产物在 dist/）
```

后端测试用 mongodb-memory-server，**不需要本地 MongoDB**；`npm run dev` 和 migrate 命令需要。

## 验证要求（提交前必须全绿）

```bash
npm run lint && npm test && npm run build:all
```

CI（`.github/workflows/ci.yml`）会重跑同样内容：backend lint+build+test、frontend lint+build。

## 硬性规则（违反会被 lint/钩子/评审拒绝）

1. **错误响应只有一个契约**：`createErrorResponse(ErrorCode.XXX)` 的扁平 `{code, message, statusCode}`。禁止 `res.json({ error: '...' })`、自造格式。新错误码在 `backend/src/utils/errors.ts` 三处同步：枚举、`ERROR_MESSAGES`（中英双语）、`getStatusCode` 分类数组。
2. **新代码禁止新增** `any`、`console.*`（用 `createLogger('module')`）。
3. **用户输入进正则前必须 `escapeRegex()`**（`backend/src/utils/escapeRegex.ts`）；文件路径拼接必须做包含校验（参照 `PreviewController` 的 `resolveWithinDir`）。
4. **测试禁止自建 `MongoMemoryServer` 或调用 `mongoose.connect`**——全局 setup（`__tests__/setup.ts`）已提供连接、JWT 密钥并关闭限流。违例曾导致整套件挂死。
5. **前端只经共享 `apiClient`（`src/api/client.ts`）发请求**：禁止组件内原生 `fetch`、禁止新建 axios 实例。
6. **环境变量三件套**：代码引用 + `backend/src/config/env.ts`（zod 声明）+ `backend/.env.example` 同步更新。
7. **i18n 成对更新**：`frontend/src/i18n/locales/en.json` 与 `zh.json`。
8. **routes/ 只做编排不写业务**；`app.ts` 不得连接数据库（测试要 import 它）；新页面在 `App.tsx` 用 `lazy()` 注册并按需包 `ProtectedRoute`/`RoleRoute`。
9. **提交信息走 Conventional Commits**，scope 限 `backend|frontend|tooling|docs|ci|deps`；commit-msg 钩子强制校验，pre-commit 自动跑 Prettier。
10. 认证/权限/安全相关改动**必须跑** `npx jest authSecurity --forceExit` 并按需补回归用例。

## 架构要点（改这些区域前先读懂）

- **三个入口**：`app.ts`（组装 Express，测试用）、`server.ts`（生产入口：连库、首管引导、优雅停机）、`app-memory.ts`（演示用内存库，与 app.ts 存在漂移，改动 app.ts 时注意同步）。
- **JWT 双密钥体系**：access(JWT_SECRET, 24h) 与 refresh(JWT_REFRESH_SECRET, 7d) 分离，payload 含 `type` 与随机 `jti`；登出/轮换经 `RevokedToken` 黑名单（SHA-256 哈希 + TTL 索引）。生产缺密钥直接拒绝启动。**不要**回退到共用 secret 或去掉 jti（同秒签发碰撞问题）。
- **限流**：分级表在 `backend/src/routes/rateLimits.ts`，新端点要登记；全局中间件按表匹配；`RATE_LIMIT_ENABLED=false` 关闭。
- **mongo-sanitize** 全局生效，会剥请求体里 `$` 前缀的键——新增依赖 Mongo 操作符的内部字段时注意。
- **错误/日志链路**：controller 自 catch + `createErrorResponse` 是现状主流；路由级新代码用 `asyncHandler` + 抛 `AppError`。
- **前端构建**：29 页全部 lazy + vendor manualChunks，主包 ~111KB；`react-syntax-highlighter` 等 906KB 在 vendor-editor 按需加载。Tailwind `darkMode: 'class'`，主题存 `themeStore`。
- **数据库迁移**：migrate-mongo（数据回填/破坏性变更用）；普通 schema 变更由 Mongoose 隐式同步。

## 本仓库特有的坑

- Windows Git Bash：`NODE_ENV=production node ...` 前缀写法**不生效**，用根目录 `npm start`（已 cross-env）。
- Git 的 LF→CRLF 警告是正常的（`endOfLine: auto`），不要试图"修复"。
- 命令行管道里 `| grep` 挂住 jest 输出时，改为重定向到文件再读（Git Bash 下已知现象）。
- 根目录 2GB 的 `mongodb-win32-*/` 与 `data/` 是本地开发库（已 gitignore），不是仓库内容。
- 存量反例（不要模仿、也暂不重构）：`routes/agentResources.ts` 内联业务、13 个页面自包 Layout、~270 处历史 `any`（lint warning 记账）。

## 文档去向

新文档按 `.trae/rules/docs-dic-rule.md`：指南→`docs/guides/*-guide.md`，架构→`docs/architecture/*-architecture.md`，更新日志→`docs/changelog/updates/YYYY-MM-DD-*-update.md`；删除先移 `docs/legacy/`。文档带头部元信息（title/document-type/version/created-date）。

## 快速定位

| 要改什么  | 去哪                                                                         |
| --------- | ---------------------------------------------------------------------------- |
| API 端点  | `backend/src/routes/` + `controllers/` + `validations/`                      |
| 错误码    | `backend/src/utils/errors.ts`                                                |
| 认证/权限 | `backend/src/middleware/auth.ts`、`rbac.ts`、`controllers/authController.ts` |
| 限流配置  | `backend/src/middleware/rateLimit/`、`routes/rateLimits.ts`                  |
| 前端请求  | `frontend/src/api/`（16 个领域模块）                                         |
| 全局状态  | `frontend/src/stores/`（auth/theme，zustand persist）                        |
| 首管引导  | `INITIAL_SUPER_ADMIN_*` 环境变量（`utils/initSuperAdmin.ts`）                |
