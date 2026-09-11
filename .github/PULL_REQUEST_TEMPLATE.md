name: Pull Request

about: 代码变更提交
---

## 变更说明

<!-- 做了什么、为什么。关联 issue 用 Fixes #123。 -->

## 变更类型

- [ ] feat 新功能
- [ ] fix 缺陷修复
- [ ] refactor 重构
- [ ] docs 文档
- [ ] chore 工程化

## 自查清单

- [ ] 已阅读 [编码规范](docs/guides/coding-standards-guide.md)，新端点/新页面已对照 checklist
- [ ] lint 0 error（`npm run lint`）
- [ ] 后端测试全绿（`cd backend && npm test`）；行为变更附带测试
- [ ] 前端构建通过（`cd frontend && npm run build`）
- [ ] 新增环境变量已同步 `.env.example` 与 `config/env.ts`
- [ ] 用户可见文案已更新 `en.json` 与 `zh.json`；新 UI 已适配暗色模式
