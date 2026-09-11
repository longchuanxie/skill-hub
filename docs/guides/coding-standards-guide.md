---
title: SkillHub 代码编写规范
document-type: guide
version: 1.0.0
created-date: 2026-09-12
---

# SkillHub 代码编写规范

> 本规范是全仓库编码约定的唯一权威来源。工具链（ESLint / Prettier / commitlint / CI）强制执行其中可自动化的部分，其余靠评审把关。
> 与 `.trae/rules/error-code-rule.md`（错误码规则）、`.trae/rules/docs-dic-rule.md`（文档规则）配套使用，冲突时以本文为准。

## 1. 总则

- **底线由工具链强制**：提交前 pre-commit 自动运行 Prettier；commit-msg 钩子校验提交信息格式；CI 对 backend/frontend 各跑 lint + build + test。**lint 必须 0 error**（warning 是存量基线，见 §4）。
- **新代码不留旧债**：新文件、新函数不允许新增 lint warning（尤其是 `no-explicit-any`）；触碰旧文件时顺手消掉该文件的 warning。
- **行为变更必须带测试**：修 bug 先写失败测试再修；安全相关行为必须有回归测试（参考 `src/__tests__/authSecurity.test.ts`）。
- 注释只写"代码本身表达不了的约束"（为什么这样做、边界在哪），不复述代码在做什么。

## 2. 项目结构与分层

### 2.1 后端请求链路

```
routes/          路由定义 + 中间件编排，禁止内联业务逻辑
  → middleware/  authenticate / requireRole / upload / rate limit
  → controllers/ 请求解析、校验结果处理、调 service/model、组装响应
  → services/    跨 controller 复用的业务逻辑（目前 3 个，按需新增）
  → models/      Mongoose Schema，唯一的数据定义处
```

- **新端点**：逻辑写在 controller（或抽 service）；`routes/` 只做 `router.post('/x', authenticate, validation, handler)` 这类编排。`routes/agentResources.ts` 的内联业务是历史反例，不要模仿。
- **入口**：`app.ts` 只组装 Express 应用（可被测试 import，不连接数据库）；连接/监听/优雅停机只在 `server.ts`。
- **配置**：所有环境变量经 `src/config/env.ts`（zod）校验；其他模块只读 `process.env` 中 env.ts 已声明的键，新变量必须同时补 `.env.example`。

### 2.2 前端结构

```
pages/        页面组件（路由级，必须 lazy 加载）
components/   可复用组件；ui/ 是 shadcn 基础件
api/          按领域的 API 模块（唯一允许发请求的地方）
stores/       zustand 全局状态（auth / theme）
i18n/locales/ en.json 与 zh.json 必须成对更新
```

## 3. 命名规范

| 对象                                      | 风格                         | 示例                                     |
| ----------------------------------------- | ---------------------------- | ---------------------------------------- |
| 后端 model                                | PascalCase.ts                | `SkillVersion.ts`                        |
| 后端 controller / service                 | camelCase + 后缀             | `skillController.ts`、`searchService.ts` |
| 后端 routes / middleware / utils / config | camelCase.ts                 | `rateLimits.ts`、`tokenBlacklist.ts`     |
| 前端 pages / components                   | PascalCase.tsx               | `SkillDetailPage.tsx`                    |
| 前端 api / stores / utils                 | camelCase.ts                 | `market.ts`、`themeStore.ts`             |
| 测试文件                                  | `*.test.ts`，放 `__tests__/` | `authSecurity.test.ts`                   |
| 变量 / 函数                               | camelCase                    | `escapeRegex`                            |
| 类 / 接口 / 类型                          | PascalCase                   | `TokenPayload`                           |
| 常量                                      | UPPER_SNAKE_CASE             | `MAX_LOGIN_ATTEMPTS`                     |
| React 组件                                | PascalCase，default export   | `ThemeToggle`                            |
| Mongoose model                            | 单数 PascalCase              | `model('RevokedToken', …)`               |
| 环境变量                                  | UPPER_SNAKE_CASE             | `JWT_REFRESH_SECRET`                     |
| Git 分支                                  | `feat                        | fix                                      | chore/短描述` | `chore/cleanup-unused-code` |

存量大小写混用（如 6 个 PascalCase controller）不做批量重命名，避免无谓 churn；新文件一律按上表。

## 4. TypeScript 规范

- 两端 `strict: true` 已开启，**新代码禁止新增 `any`**。存量 ~270 处 `any` 以 warning 记账，逐步清偿。
- 外部输入用 `unknown` + 类型收窄，不用 `any` 断言。
- 领域类型显式建模并导出（如 `api/market.ts` 的 `Skill`/`Prompt` 接口）；优先与后端契约对齐，禁止"方便起见"改宽类型（见 visibility 枚举对齐的教训）。
- 枚举值、魔法字符串提为常量/联合类型，禁止散落硬编码（如 `'public' | 'private' | 'enterprise' | 'shared'`）。

## 5. 错误处理规范

错误响应**只有一个契约**——`utils/errors.ts` 的扁平结构：

```json
{ "code": "SKILL_NOT_FOUND", "message": "技能不存在", "statusCode": 404, "details": null }
```

- **禁止** `res.json({ error: '...' })`、`res.json({ errors: [...] })` 等自造格式（前端 `errorHandler.ts` 只认 `code` 字段）。
- controller 内：`res.status(error.statusCode).json(createErrorResponse(ErrorCode.XXX))`。
- 路由级新代码：用 `utils/asyncHandler.ts` 包裹 + 抛 `AppError`，交给 `middleware/errorHandler.ts` 统一输出。
- 新增错误码三处同步：`ErrorCode` 枚举、`ERROR_MESSAGES`（中英双语）、`getStatusCode` 分类数组。分类规则见 `error-code-rule.md`（AUTH/AUTHZ/VAL/RES/BIZ/SRV 前缀）。
- 语义专属场景建专属码（如 `INVITATION_EXPIRED`），不要全塞 `INVALID_INPUT`。

## 6. 安全编码清单（新增/修改端点必查）

- [ ] 认证：`authenticate` / `optionalAuth`（`middleware/auth.ts`）；管理端用 `requireRole`（`middleware/rbac.ts`，**不要**自写角色判断）。
- [ ] 输入校验：express-validator schema 放 `validations/`，路由上挂载并处理 `validationResult`。
- [ ] 限流登记：写操作/敏感端点在 `routes/rateLimits.ts` 的 `rateLimitRoutes` 表中登记分级（PUBLIC/AUTH/SENSITIVE/EXTERNAL）。
- [ ] 用户输入进 `$regex` / `new RegExp` 前必须 `escapeRegex()`（`utils/escapeRegex.ts`）。
- [ ] 拼接文件路径必须做包含校验（参考 `PreviewController.resolveWithinDir`），杜绝路径穿越。
- [ ] 密钥只从 env 读取；生产必填项在 `config/env.ts` 里 fail-fast；`.env.example` 同步更新，**不提交任何真实凭据**。
- [ ] 日志与响应中不出现 token、密码、apiKey 明文。
- [ ] 权限/角色相关变更补 `authSecurity.test.ts` 或专属回归测试。

## 7. 日志规范

- 统一 `createLogger('moduleName')`（winston child logger）；**禁止 `console.*`**（唯一例外：`config/env.ts` 的启动失败输出，此时 logger 可能尚未就绪）。
- 结构化键值：`logger.info('User login attempt', { email, ip })`；消息文案用英文。
- 用户可见文案不进日志，走 ErrorCode（后端）或 i18n（前端）。

## 8. 测试规范

- 后端集成测试直接用全局基建（`__tests__/setup.ts` 已提供内存 Mongo、JWT 密钥、关闭限流）——**禁止在测试文件里自建 `MongoMemoryServer` 或再 `mongoose.connect`**（曾导致整套件失败）。
- 用例命名：`it('should <行为> when <条件>')`；`describe` 用被测模块/API 分组。
- 断言响应契约时认 `code` 字段，不认旧 `error` 字段。
- 涉及时间的断言注意 JWT 同秒签发问题（已用 `jti` 解决，勿回退）。
- 前端 vitest 基建就绪（`src/__tests__/`），新组件/工具函数随写随测。

## 9. 前端规范

- **新页面**：`App.tsx` 用 `lazy(() => import(...))` 注册；需要框架的页面由 App 包 `<Layout>`（不要页面自包，存量 13 处为历史遗留）；受保护路由包 `ProtectedRoute`，管理路由包 `RoleRoute`。
- **发请求**：只用共享 `apiClient`（`api/client.ts`）。**禁止**自建 axios 实例、禁止组件内原生 `fetch`。API 定义集中在 `api/` 模块：接口类型 + `xxxApi` 对象。
- **状态**：跨页面共享才进 zustand（带 persist 的参考 `authStore`/`themeStore` 模式）；组件内状态用 useState；`useEffect` 依赖数组必须完整，搜索类输入加防抖。
- **样式**：优先 shadcn/radix 组件；**新 UI 必须同时写亮/暗两套**（`dark:` 变体或语义 token），不再新增只适配亮色的硬编码灰度值。
- **i18n**：组件内禁止硬编码用户可见文案；`en.json` 与 `zh.json` 成对更新，键名按 `模块.功能` 分层。
- **错误提示**：`useErrorHandler` 或 sonner toast，读 `code` 做翻译/分流。

## 10. Git 与提交规范

- **提交信息**：Conventional Commits，commit-msg 钩子强制校验：

  ```
  <type>(<scope>): <subject>

  type:  feat | fix | refactor | perf | test | docs | chore | ci | style | build
  scope: backend | frontend | tooling | docs | ci | deps（可省略）
  ```

  subject 用英文祈使句、不加句号；正文（可选）说明动机与影响，破坏性变更必须写明。

- **分支**：`feat/…`、`fix/…`、`chore/…` + 短横线分隔的小写描述。
- **提交前自查**：

  ```bash
  npm run lint        # 根目录：两端一起
  cd backend && npm test
  cd ../frontend && npm run build
  ```

- 钩子：pre-commit 跑 lint-staged（Prettier 格式化暂存文件）；commit-msg 跑 commitlint。绕过钩子（`--no-verify`）仅限紧急修复且须在 PR 中说明。

## 11. 文档规范

按 `docs-dic-rule.md` 执行：指南入 `guides/` 用 `*-guide.md`；架构入 `architecture/` 用 `*-architecture.md`；更新历史入 `changelog/updates/`；删除的文档先移 `legacy/`。新文档带头部元信息（title / document-type / version / created-date）。

## 12. Checklist 速查

**新后端端点**：路由编排 → 认证 → RBAC → 校验 schema → 限流登记 → controller/service → createErrorResponse → 测试。
**新前端页面**：lazy 路由 → 守卫 → api 模块 → i18n 双语 → 暗/亮样式 → 错误处理。
**新环境变量**：代码引用 → env.ts 声明 → .env.example 注释 → 必要时 README。
