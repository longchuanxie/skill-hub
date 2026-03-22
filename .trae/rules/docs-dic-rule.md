# 项目开发文档目录结构

## 一、目录结构

```
docs/
├── requirements/       # 需求文档
├── architecture/       # 架构设计
├── api/                # API 设计
├── design/             # 详细设计
├── guides/             # 使用指南
├── operations/         # 运维文档
├── changelog/          # 变更历史(updates/test-reports/verification)
├── legacy/             # 历史归档
└── project/            # 项目管理
```

## 二、文档命名规则

| 类型 | 目录 | 命名 |
|------|------|------|
| 产品需求 | requirements/ | `product-strategy-YYYYMMDD-HHMMSS.md` |
| 架构设计 | architecture/ | `*-architecture.md` |
| API设计 | api/ | `*-api-design.md` |
| 详细设计 | design/ | `module-*-design-v{version}.md` |
| 使用指南 | guides/ | `*-guide.md` |
| 运维文档 | operations/ | `*-ops.md` |
| 开发计划 | project/ | `YYYY-MM-DD-*-plan.md` |
| 更新日志 | changelog/updates/ | `YYYY-MM-DD-*-update.md` |

## 三、版本号

- `v1.0` 初始版本
- `v1.1` 功能新增
- `v2.0` 重大变更

## 四、文档头部

```markdown
---
title: 文档标题
document-type: architecture-design | api-design | module-design
version: 1.0.0
created-date: YYYY-MM-DD
---
```

## 五、维护规则

1. 新增：按类型放入对应目录
2. 更新：保留历史版本到changelog/
3. 删除：先移到legacy/
4. 评审：status字段标识状态

