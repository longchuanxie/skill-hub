# 分批Push计划

> 创建时间: 2026-03-21
> 仓库: https://github.com/longchuanxie/skill-hub
> 当前分支: v.1.0

---

## 概述

本次开发涉及 **6个主要功能模块**，分为 **8批次** 推送。

---

## 变更总览

| 状态 | 文件类型 | 数量 |
|------|----------|------|
| 已提交 | 1个commit | 1 |
| 已修改 | 后端文件 | 25+ |
| 新增 | 后端文件 | 40+ |
| 已修改 | 前端文件 | 12+ |
| 新增 | 前端文件 | 15+ |
| 新增 | 文档文件 | 15+ |

---

## 功能模块分类

### 模块1: Agent API 增强 (第一批 - 已提交)

**状态**: ✅ 已提交到分支

**Commit**: `ffb3454 feat(agent-api): add check-update endpoint for resource version monitoring`

**包含内容**:
- `backend/src/__tests__/agentResourcesVersion.test.ts` (+564行测试)
- `backend/src/routes/agentResources.ts` (+471行路由更新)
- `docs/plans/2026-03-16-agent-api-upload-design.md` (接口设计更新)

---

### 模块2: 在线预览功能 (第二批)

**优先级**: P1

**新增文件**:
- `backend/src/controllers/PreviewController.ts` - 预览控制器
- `backend/src/routes/preview.ts` - 预览路由
- `frontend/src/pages/SkillPreviewPage.tsx` - 预览页面

**修改文件**:
- `backend/src/app.ts` - 注册预览路由
- `frontend/src/App.tsx` - 添加路由

**文档**:
- `docs/design/module-online-preview.md`

---

### 模块3: 版本管理功能 (第三批)

**优先级**: P2

**新增模型**:
- `backend/src/models/SkillVersion.ts`
- `backend/src/models/PromptVersion.ts`
- `backend/src/models/ResourceVersion.ts`

**新增工具**:
- `backend/src/utils/versionGenerator.ts` - 版本号生成
- `backend/src/utils/resourceHelpers.ts` - 资源辅助函数

**新增控制器**:
- `backend/src/controllers/SkillVersionController.ts`
- `backend/src/controllers/PromptVersionController.ts`

**新增路由**:
- `backend/src/routes/skillVersions.ts`
- `backend/src/routes/promptVersions.ts`

**新增前端页面**:
- `frontend/src/pages/SkillVersionHistoryPage.tsx` - 版本历史
- `frontend/src/pages/SkillVersionComparePage.tsx` - 版本对比

**文档**:
- `docs/design/module-version-management.md`
- `docs/design/skill-name-version-management.md`

---

### 模块4: 在线测试功能 (第四批)

**优先级**: P2

**新增模型**:
- `backend/src/models/TestCase.ts`
- `backend/src/models/TestResult.ts`

**新增控制器**:
- `backend/src/controllers/onlineTestController.ts`

**新增路由**:
- `backend/src/routes/test.ts` (已修改)

**新增前端**:
- `frontend/src/pages/SkillOnlineTestPage.tsx` - 测试页面
- `frontend/src/components/TestCaseEditor.tsx` - 测试用例编辑器
- `frontend/src/components/TestCaseList.tsx` - 测试用例列表
- `frontend/src/components/TestRunner.tsx` - 测试运行器
- `frontend/src/api/onlineTest.ts`

**文档**:
- `docs/design/module-online-test.md`

---

### 模块5: 权限管理功能 (第五批)

**优先级**: P2

**新增模型**:
- `backend/src/models/PermissionAuditLog.ts`
- `backend/src/models/SkillPermissions.ts`

**新增控制器**:
- `backend/src/controllers/permissionController.ts`

**新增路由**:
- `backend/src/routes/permissions.ts`

**新增前端**:
- `frontend/src/pages/SkillPermissionsPage.tsx` - 权限管理页面
- `frontend/src/components/PermissionManager.tsx` - 权限管理组件
- `frontend/src/api/permissions.ts`

**文档**:
- `docs/design/module-permission-management.md`

---

### 模块6: 上传编辑优化 (第六批)

**优先级**: P1

**新增工具**:
- `frontend/src/utils/skillParser.ts` - SKILL.md解析

**修改前端**:
- `frontend/src/pages/UploadPage.tsx` - 上传页面调整
- `frontend/src/pages/SkillEditPage.tsx` - 编辑页面调整

**文档**:
- `docs/plans/2026-03-21-skill-upload-edit-design.md`

---

### 模块7: API限流功能 (第七批)

**优先级**: P3

**新增中间件**:
- `backend/src/middleware/rateLimit/` - 限流中间件目录

**新增配置**:
- `backend/rate-limit.env.example`

**新增路由**:
- `backend/src/routes/rateLimits.ts`

**文档**:
- `docs/plans/2026-03-21-rate-limiting-design.md`

---

### 模块8: 测试框架和工具 (第八批)

**优先级**: P2

**测试配置**:
- `backend/jest.config.js`
- `backend/src/__tests__/setup.ts`
- `backend/src/__tests__/helpers/`

**测试文件**:
- `backend/src/__tests__/onlineTest.test.ts`
- `backend/src/__tests__/permissionManagement.test.ts`
- `backend/src/__tests__/promptNameVersion.test.ts`
- `backend/src/__tests__/skillNameVersion.test.ts`
- `backend/src/__tests__/versionManagement.test.ts`

**前端测试**:
- `frontend/vitest.config.ts`
- `frontend/src/__tests__/`

**工具文件**:
- `backend/src/app-memory.ts` - 内存应用
- `backend/src/types/express.d.ts` - 类型扩展
- `backend/src/utils/cache.ts` - 缓存工具
- `backend/src/utils/errors.ts` - 错误工具

---

### 文档更新 (随功能模块)

**产品策略**:
- `docs/product-strategy/product-feature-extension-analysis-20260318.md`
- `docs/product-strategy/skill-management-optimization-20260318.md`

**实施计划**:
- `docs/plans/2026-03-17-phase1-foundation-plan.md`
- `docs/plans/2026-03-21-agent-check-update-design.md`
- `docs/plans/2026-03-21-agent-resources-version-management.md`
- `docs/plans/2026-03-21-rate-limiting-design.md`
- `docs/plans/2026-03-21-skill-upload-edit-design.md`

**其他**:
- `docs/ERROR_CODES.md`
- `docs/updates/` - 更新日志目录
- `docs/verification/` - 验证文档目录

---

## 推荐Push顺序

| 批次 | 模块 | 理由 |
|------|------|------|
| 1 | Agent API 增强 | ✅ 已提交，可立即推送 |
| 2 | 在线预览功能 | 基础功能，其他模块可能依赖 |
| 3 | 版本管理功能 | 核心功能，建议早推 |
| 4 | 上传编辑优化 | 用户上传体验优化 |
| 5 | 权限管理功能 | 企业功能，可独立 |
| 6 | 在线测试功能 | 测试功能，可独立 |
| 7 | API限流功能 | 安全功能，可独立 |
| 8 | 测试框架 | 开发支持，最后推送 |

---

## 更新日志模板

每批次推送时，创建更新日志：

```markdown
## [版本号] - YYYY-MM-DD

### 新增功能
- 功能描述

### 优化改进
- 优化描述

### Bug修复
- 修复描述

### 文档更新
- 文档描述
```

---

## 验证清单

推送前请确认：

- [ ] 测试通过
- [ ] 文档更新
- [ ] 更新日志已创建
- [ ] PR标题清晰描述变更
