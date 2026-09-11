# SkillHub 无用代码清理计划

> 生成时间：2026-08-11
> 范围：基于 `D:\workplace\idea\skill-hub` 的架构探索 + 后端/前端死代码深度分析
> 目标：在不破坏功能的前提下，移除死代码、误提交产物、未使用依赖与磁盘垃圾，并引入自动化检测防止复发

---

## 一、架构概览（探索结论）

| 层 | 技术栈 | 源码位置 | 规模 |
|---|---|---|---|
| 后端 | Node.js + Express + TypeScript | `backend/src` | 128 个 tracked 文件 |
| 前端 | React 18 + Vite + TypeScript | `frontend/src` | 117 个 tracked 文件 |
| 文档 | Markdown | `docs/` | 94 篇 |
| 测试 | Jest（后端）/ Vitest（前端） | `__tests__`、`*.test.ts(x)` | — |

**关键事实澄清**：项目根目录快照显示 `backend` 有 13k 文件、`frontend` 有 25k 文件，但这主要是 `node_modules` 与编译产物 `dist/`（均已被 `.gitignore` 忽略）。实际 **git 仅跟踪 398 个文件**，且工作树基本干净（仅 2 个文件本地修改：`backend/src/routes/auth.ts`、`backend/src/utils/errors.ts`）。

**分层结构**：
- 后端：`routes → controllers → models`，辅以 `middleware / services / utils / config / validations / types / interfaces / adapters`。入口 `backend/src/app.ts`。
- 前端：`pages`（单一路由 `App.tsx`）→ `components / api / stores / hooks`。
- **架构弱点**：后端 26 个 controller 但仅 3 个 service（`recommendationService / searchService / ZipAnalyzerService`），业务逻辑大量内联在 controller 中，缺乏真正 service 层（非死代码，但影响可维护性，单列记录）。

---

## 二、清理目标分类与风险

| 类别 | 风险 | 预计收益 |
|---|---|---|
| A. 误提交到 git 的临时文件 | 低 | 仓库干净 + 防冲突 |
| B. 源码孤儿模块 / 死导出 | 中 | 减少混淆、提升可维护性 |
| C. 未使用的 npm 依赖 | 中 | 缩小安装体积、减少攻击面 |
| D. 散落的一次性脚本 | 低 | 减少噪音 |
| E. 磁盘大件（二进制/数据） | 高（需确认） | 释放数 GB 空间 |
| F. .gitignore 补全 | 低 | 防止再次误提交 |
| G. 文档冗余 | 低（可选） | 减少噪音 |

---

## 三、详细清单

### A. 误提交到 git 的临时文件（低风险，直接删）
- `frontend/vite.config.ts.timestamp-1774685185420-a56d7fee2a00b.mjs` — Vite 临时产物，已被 git 跟踪（应忽略）。**删除并加入 `.gitignore`**。

### B. 源码死代码（中风险，删除后需 build + test 验证）

**后端**
- `backend/src/utils/versionGenerator.ts` — 导出 `generateNextSkillVersion` / `generateNextPromptVersion`，全库零引用；其版本递增逻辑已在 `SkillController.generateNextVersion` / `PromptController.generateNextVersion` 内联重复实现。→ **删除**。
- `backend/src/middleware/rateLimit/decorators/rateLimit.ts` — 导出 `RateLimit` / `getRateLimitMetadata`，装饰器方案已废弃（实际限流走 `routes/auth.ts` 的 `publicApiLimiter`）。→ **删除**。
- `backend/src/utils/resourceHelpers.ts` 中的 `buildSkillFiles` 导出 — 在 `routes/agentResources.ts` 被 import 但从未调用。→ **移除该无用 import**（函数本身保留，若确认无他用可一并删）。

**前端（7 个孤儿组件/钩子，全库零引用）**
- `frontend/src/components/animate-ui/primitives/texts/sliding-number.tsx`（`SlidingNumber`）
- `frontend/src/hooks/use-is-in-view.tsx`（仅被上面的 `sliding-number` 引用，死链）
- `frontend/src/components/layout/Grid.tsx`
- `frontend/src/components/recommendation/SimilarResources.tsx`
- `frontend/src/components/VersionCard.tsx`
- `frontend/src/components/VersionDiffPanel.tsx`
- `frontend/src/components/ui/EmptyState.tsx`
→ **逐个删除**（建议小批量，每批删除后跑 `vitest` 冒烟）。

### C. 未使用的 npm 依赖（中风险，需先全量 grep 确认无动态引用）

**后端 `backend/package.json`**
- `form-data` — `src` 内零 import。→ **移除**。
- `uuid` — `src` 内零 import。→ **移除**。
- `reflect-metadata` — 仅 `app.ts:2` 副作用 import，其唯一潜在消费者（`decorators/rateLimit.ts`）已是死模块。→ **复核后移除 import 与依赖**。
- `archiver` — 仅在测试辅助 `src/__tests__/helpers/testZip.ts` 使用。→ **若保留测试则移入 devDependencies**，否则移除。

**前端 `frontend/package.json`**
- `dayjs` — 零 import。→ **移除**。
- `react-markdown` — 零 import。→ **移除**。
- `zod` + `@hookform/resolvers`（成对）— `react-hook-form` 本身在用（TestCaseEditor），但无 `zodResolver` 调用。→ **复核后移除这两个**。
- `docx`（devDependency）— 零 import。→ **移除**。

> ⚠️ 依赖移除前，建议用 [`knip`](https://github.com/webpro-npm/knip) 或 `depcheck` 全量复核，避免遗漏动态 import / 字符串引用。

### D. 散落的一次性脚本（低风险）
- `backend/test-admin-api.js`、`backend/test-admin-registration.js`、`backend/test-api.js`、`backend/update-admin-role.js` — 未被 `package.json` scripts 引用、无任何源文件 require，属一次性手工调试脚本。→ **删除**（如确有价值，迁移至 `backend/examples/` 或 `scripts/` 并纳入 npm script）。

### E. 磁盘大件（高风险，需你确认后再动）
- `mongodb-win32-x86_64-windows-7.0.14/`（**2.0 GB**）— 本地 MongoDB 服务端二进制，已被 `.gitignore` 忽略（`mongodb-*/`）。可删除释放空间（需要时重新安装）。→ **建议删，但先确认非你手动管理**。
- `data/`（**722 MB**）— 运行时 MongoDB WiredTiger 数据文件，已被忽略（`data/`）。**这极可能是正在使用的数据库，切勿随意删除**。→ **保留；仅在你确认是一次性测试数据时才清**。
- `.venv`（26 MB）— Python 虚拟环境，未被 gitignore 且未跟踪。→ **加入 `.gitignore`**，不进仓库。
- `mongodb/`（空）、`test-results/`（空）— 未跟踪未忽略。→ **清理并加入 `.gitignore`**。

### F. 补全 `.gitignore`（低风险）
在现有 `.gitignore` 增加：
```
# Python
.venv/

# Vite temp artifacts
vite.config.ts.timestamp-*.mjs

# Empty/scratch dirs
mongodb/
test-results/
```
（注：`node_modules/`、`dist/`、`logs/`、`backend/temp/`、`*.map` 已覆盖。）

### G. 文档冗余（可选，低风险）
- `docs/legacy/` 为空目录；`docs/` 下 94 篇含 `changelog / updates / verification / test-reports` 等多类文档，部分可能过期。→ **建议人工巡检，非必须清理**。

### 附：功能缺口（非死代码，仅记录）
- `backend/src/app-memory.ts`（dev:memory 入口）未挂载 `admin / invitation / skillVersions / promptVersions / rateLimits` 五个路由，内存模式运行时不暴露这些端点。→ 建议在清理收尾时一并补齐，保证两个入口一致。

---

## 四、执行步骤（分阶段、可回滚）

1. **建保护分支**：`git checkout -b chore/cleanup-unused-code`，确保所有改动可回滚。
2. **Phase 1（低风险，先执行）**：补全 `.gitignore`；删除 `frontend/vite.config.ts.timestamp-*.mjs` 与空目录 `mongodb/`、`test-results/`；将 `.venv` 加入忽略。
3. **Phase 2（源码死代码）**：删除后端 2 个孤儿模块、清理 `buildSkillFiles` 死导入；删除前端 7 个孤儿组件/钩子（每删 2–3 个跑一次 `vitest`）。
4. **Phase 3（依赖）**：运行 `knip`/`depcheck` 复核 → 编辑 `backend/package.json` 与 `frontend/package.json` 移除未用依赖 → `npm install` 重新生成 lock。
5. **Phase 4（脚本）**：删除或迁移 4 个散落 JS 脚本。
6. **Phase 5（磁盘大件，需你确认）**：处理 `mongodb-win32`（2GB）与 `data/`（是否保留）。
7. **Phase 6（验证）**：
   - 后端：`cd backend && npm run build && npm test`
   - 前端：`cd frontend && npm run build && npm test`
   - 全量死代码复核：安装 `knip` 并加 `lint:unused` 脚本，作为 CI 门禁。

## 五、验证与回滚
- 每次删除后用对应 `build` + `test` 验证；建议 `knip` 输出应为 0 unused。
- 任何阶段出问题：`git stash` / `git checkout -- .` 回滚到分支起点。
- **切勿**在未确认前删除 `data/`。

## 六、可持续化建议
- 引入 `knip`（devDependency）+ `npm run lint:unused` 脚本，纳入 pre-commit / CI，防止死代码再次累积。
- 后端补全 service 层（将 controller 内联逻辑下沉）作为后续重构项，不在本次清理范围。
