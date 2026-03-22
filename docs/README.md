# SkillHub 文档中心

> 统一的文档管理目录，按软件生命周期分类

---

## 目录结构

```
docs/
├── README.md                      # 文档索引 (本文件)
├── requirements/                  # 需求文档
├── architecture/                  # 架构设计
├── api/                           # API 设计
├── design/                        # 详细设计
├── guides/                        # 使用指南
├── operations/                    # 运维文档
├── changelog/                     # 变更历史
│   ├── updates/                   # 更新日志
│   ├── test-reports/              # 测试报告
│   └── verification/              # 功能验证
├── legacy/                        # 历史归档
└── project/                       # 项目管理
```

---

## 目录说明

### 📋 requirements - 需求文档

产品需求、功能规格、业务分析

| 文档 | 说明 |
|------|------|
| [product-strategy-YYYYMMDD-HHMMSS.md](requirements/product-strategy-20260315-142500.md) | 产品战略设计 |
| [product-feature-extension-analysis-YYYYMMDD.md](requirements/product-feature-extension-analysis-20260318.md) | 产品功能扩展分析 |
| [skill-management-optimization-YYYYMMDD.md](requirements/skill-management-optimization-20260318.md) | 技能管理优化建议 |

---

### 🏗️ architecture - 架构设计

系统架构、技术选型、部署方案

| 文档 | 说明 |
|------|------|
| [backend-architecture.md](architecture/backend-architecture.md) | 后端架构设计 |
| [backend-project-structure.md](architecture/backend-project-structure.md) | 后端项目结构 |
| [backend-api.md](architecture/backend-api.md) | API 设计 |
| [backend-security.md](architecture/backend-security.md) | 安全设计 |
| [community-trends-api-design.md](architecture/community-trends-api-design.md) | 社区趋势 API |

---

### 🔌 api - API 设计

RESTful API 接口规范

> 放置全局 API 设计文档，如 API 规范、认证方式等

---

### 🎨 design - 详细设计

模块详细设计、技术方案

| 文档 | 说明 |
|------|------|
| [module-version-management.md](design/module-version-management.md) | 版本管理模块 |
| [module-online-preview.md](design/module-online-preview.md) | 在线预览模块 |
| [module-online-test.md](design/module-online-test.md) | 在线测试模块 |
| [module-permission-management.md](design/module-permission-management.md) | 权限管理模块 |
| [skill-name-version-management.md](design/skill-name-version-management.md) | 技能名称版本管理 |

---

### 📖 guides - 使用指南

用户手册、开发者指南、最佳实践

| 文档 | 说明 |
|------|------|
| [frontend-architecture.md](guides/frontend-architecture.md) | 前端架构 |
| [frontend-pages.md](guides/frontend-pages.md) | 前端页面 |
| [frontend-components.md](guides/frontend-components.md) | 前端组件 |
| [frontend-state-management.md](guides/frontend-state-management.md) | 状态管理 |
| [frontend-routing.md](guides/frontend-routing.md) | 路由设计 |
| [frontend-design-detailed.md](guides/frontend-design-detailed.md) | 前端详细设计 |

---

### ⚙️ operations - 运维文档

部署、运维、故障处理

| 文档 | 说明 |
|------|------|
| [ERROR_CODES.md](operations/ERROR_CODES.md) | 错误码定义 |

---

### 📝 changelog - 变更历史

版本更新、测试报告、功能验证

**更新日志 (updates/)**
- [phase1-update.md](changelog/updates/2026-03-17-phase1-update.md)

**测试报告 (test-reports/)**
- [community-trends-test-report.md](changelog/test-reports/community-trends-test-report.md)

**功能验证 (verification/)**
- [feature-verification.md](changelog/verification/2026-03-17-feature-verification.md)

---

### 📦 legacy - 历史归档

旧版本文档、历史遗留文档

> 用于存放不再维护但需要保留的历史文档

---

### 📊 project - 项目管理

开发计划、里程碑、任务跟踪

| 文档 | 说明 |
|------|------|
| [batch-push-plan.md](project/batch-push-plan.md) | 分批推送计划 |
| [phase1-foundation-plan.md](project/2026-03-17-phase1-foundation-plan.md) | 第一阶段基础计划 |
| [enterprise-features.md](project/2026-03-15-enterprise-features.md) | 企业功能规划 |
| [enterprise-oauth-design.md](project/2026-03-15-enterprise-oauth-design.md) | 企业 OAuth 设计 |
| [agent-api-upload-design.md](project/2026-03-16-agent-api-upload-design.md) | Agent API 上传设计 |

---

## 命名规范

### 文件命名

- **日期格式**: `YYYY-MM-DD` 或 `YYYYMMDD-HHMMSS`
- **版本号**: `v1.0.0`, `v1.0.1`
- **模块前缀**: `module-{module-name}.md`

### 示例

```
product-strategy-20260315-142500.md
backend-architecture.md
module-online-preview.md
2026-03-17-phase1-update.md
```

---

## 维护指南

1. **新增文档**: 根据内容类型放入对应目录
2. **更新文档**: 保留历史版本到 `legacy/` 或 `changelog/`
3. **删除文档**: 先移动到 `legacy/` 目录，确认无问题后再删除

---

## 贡献指南

1. 文档使用 Markdown 格式
2. 文件名使用小写字母和连字符
3. 图片资源放在同目录 `images/` 子目录
4. 代码示例使用适当的语法高亮标记

---

**最后更新**: 2026-03-21