# 贡献指南

感谢为 SkillHub 贡献代码！完整的编码约定见 **[docs/guides/coding-standards-guide.md](docs/guides/coding-standards-guide.md)**（命名、错误契约、安全清单、测试、前端、Git 规范），本文只讲上手流程。

## 开发环境

```bash
npm run install:all          # 安装 backend + frontend 依赖
cp backend/.env.example backend/.env   # 并按需修改
npm run dev                  # concurrently 同时启动后端(3001)与前端(5173)
```

要求：Node.js ≥ 18，MongoDB ≥ 6（测试用 mongodb-memory-server，无需本地库）。

## 提交流程

1. 从最新主干切出分支：`feat/xxx`、`fix/xxx` 或 `chore/xxx`。
2. 编码遵循 [编码规范](docs/guides/coding-standards-guide.md)；新端点对照其中的安全清单。
3. 本地验证（全部通过再提交）：

   ```bash
   npm run lint               # 前后端 ESLint（0 error 是底线）
   cd backend && npm test     # 138+ 集成测试
   cd ../frontend && npm run build
   ```

4. 提交信息使用 Conventional Commits（commit-msg 钩子会校验）：

   ```
   feat(backend): add skill export endpoint
   fix(frontend): debounce market search input
   ```

5. 推送并创建 PR；CI 会重跑 lint / build / test。

## 钩子说明

- **pre-commit**：lint-staged 对暂存文件跑 Prettier。
- **commit-msg**：commitlint 校验提交信息格式。

## 常见任务

| 任务          | 位置                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- |
| 新增 API 端点 | `backend/src/routes/` + `controllers/` + `validations/`，限流登记 `routes/rateLimits.ts` |
| 新增错误码    | `backend/src/utils/errors.ts` 三处同步（枚举 / 中英文案 / 状态码分类）                   |
| 新增页面      | `frontend/src/pages/` + `App.tsx` lazy 注册 + 守卫                                       |
| 新增环境变量  | 代码 + `backend/src/config/env.ts` + `backend/.env.example`                              |
| 数据迁移      | `cd backend && npm run migrate:create`（见 backend/README.md）                           |
