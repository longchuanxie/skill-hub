# 管理员和企业管理员功能 - 详细设计方案

## 1. 概述

### 1.1 项目背景
SkillHub 是一个技能和提示词共享平台，需要完善系统管理员和企业管理员的功能，以便更好地管理平台用户、企业和内容。

### 1.2 设计目标
- 提供完整的系统管理员功能
- 提供完整的企业管理员功能
- 遵循现有的代码风格和架构模式
- 确保权限控制的安全性
- 提供良好的用户体验

---

## 2. 功能需求规格

### 2.1 系统管理员功能

#### 2.1.1 管理员仪表板
| 功能 | 说明 | 优先级 |
|------|------|--------|
| 统计概览 | 显示用户总数、企业总数、Skill总数、待审核内容等 | P0 |
| 最近注册用户 | 展示最近注册的用户列表 | P1 |
| 待审核内容 | 展示待审核的 Skill 和 Prompt | P1 |
| 快速操作 | 提供常用功能的快捷入口 | P1 |

#### 2.1.2 用户管理
| 功能 | 说明 | 优先级 |
|------|------|--------|
| 用户列表 | 分页显示所有用户 | P0 |
| 用户搜索 | 按用户名、邮箱搜索 | P0 |
| 用户筛选 | 按角色、状态、企业筛选 | P1 |
| 用户详情 | 查看用户完整信息 | P0 |
| 角色分配 | 更改用户角色 | P0 |
| 状态管理 | 启用/禁用/封禁用户 | P0 |
| 重置密码 | 管理员重置用户密码 | P1 |

#### 2.1.3 企业管理
| 功能 | 说明 | 优先级 |
|------|------|--------|
| 企业列表 | 分页显示所有企业 | P0 |
| 企业搜索 | 按企业名称搜索 | P0 |
| 企业详情 | 查看企业完整信息和成员 | P0 |
| 企业审核 | 审核企业申请（如需要） | P1 |
| 企业状态管理 | 启用/禁用/暂停企业 | P0 |
| 企业统计 | 查看企业的资源、成员等统计 | P1 |

#### 2.1.4 内容审核
| 功能 | 说明 | 优先级 |
|------|------|--------|
| 待审核列表 | 显示所有待审核的 Skill 和 Prompt | P0 |
| 内容详情 | 查看待审核内容的详细信息 | P0 |
| 审核通过 | 批准内容发布 | P0 |
| 审核拒绝 | 拒绝内容并提供原因 | P0 |
| 批量审核 | 批量处理审核任务 | P1 |

### 2.2 企业管理员功能

#### 2.2.1 企业仪表板
| 功能 | 说明 | 优先级 |
|------|------|--------|
| 企业统计 | 成员数、资源数、活跃度等 | P0 |
| 快速操作 | 邀请成员、管理资源等快捷入口 | P1 |
| 最近活动 | 展示企业内的最近活动 | P1 |

#### 2.2.2 成员管理
| 功能 | 说明 | 优先级 |
|------|------|--------|
| 成员列表 | 显示企业所有成员 | P0 |
| 成员搜索 | 按用户名、邮箱搜索成员 | P0 |
| 邀请成员 | 通过邮箱邀请新成员 | P0 |
| 成员角色管理 | 分配成员角色（admin/member） | P0 |
| 移除成员 | 从企业中移除成员 | P0 |
| 成员详情 | 查看成员详细信息 | P1 |

#### 2.2.3 企业资源管理
| 功能 | 说明 | 优先级 |
|------|------|--------|
| 企业资源列表 | 显示企业内所有 Skill 和 Prompt | P0 |
| 资源审核 | 审核企业成员提交的资源 | P1 |
| 资源管理 | 编辑、删除企业资源 | P1 |

#### 2.2.4 企业设置
| 功能 | 说明 | 优先级 |
|------|------|--------|
| 基本信息 | 修改企业名称、描述、Logo | P0 |
| 认证设置 | 配置密码登录、OAuth 要求 | P0 |
| 资源审核设置 | 配置自动审核、内容过滤 | P0 |

---

## 3. 数据模型设计

### 3.1 新增/更新的数据模型

#### 3.1.1 邀请模型 (Invitation)
```typescript
interface IInvitation extends Document {
  email: string;
  enterpriseId: Schema.Types.ObjectId;
  invitedBy: Schema.Types.ObjectId;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
```

#### 3.1.2 审核日志模型 (AuditLog)
```typescript
interface IAuditLog extends Document {
  action: string;
  actor: Schema.Types.ObjectId;
  targetType: 'user' | 'enterprise' | 'skill' | 'prompt';
  targetId?: Schema.Types.ObjectId;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}
```

#### 3.1.3 更新 User 模型
补充 `status` 字段（如缺失）：
```typescript
status: {
  type: String,
  enum: ['active', 'inactive', 'banned'],
  default: 'active'
}
```

---

## 4. API 设计规格

### 4.1 系统管理员 API

#### 4.1.1 仪表板 API
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/admin/dashboard/stats | 获取统计数据 | admin |

#### 4.1.2 用户管理 API
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/admin/users | 获取用户列表 | admin |
| GET | /api/admin/users/:id | 获取用户详情 | admin |
| PUT | /api/admin/users/:id/role | 更新用户角色 | admin |
| PUT | /api/admin/users/:id/status | 更新用户状态 | admin |
| POST | /api/admin/users/:id/reset-password | 重置用户密码 | admin |

#### 4.1.3 企业管理 API
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/admin/enterprises | 获取企业列表 | admin |
| GET | /api/admin/enterprises/:id | 获取企业详情 | admin |
| PUT | /api/admin/enterprises/:id/status | 更新企业状态 | admin |

#### 4.1.4 内容审核 API
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/admin/moderation/pending | 获取待审核列表 | admin |
| PUT | /api/admin/moderation/:type/:id/approve | 审核通过 | admin |
| PUT | /api/admin/moderation/:type/:id/reject | 审核拒绝 | admin |

### 4.2 企业管理员 API

#### 4.2.1 企业仪表板 API
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/enterprises/:id/dashboard | 获取企业统计 | enterprise_admin |

#### 4.2.2 成员管理 API
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/enterprises/:id/members | 获取成员列表 | enterprise_admin, admin |
| POST | /api/enterprises/:id/members/invite | 邀请成员 | enterprise_admin, admin |
| PUT | /api/enterprises/:id/members/:memberId/role | 更新成员角色 | enterprise_admin, admin |
| DELETE | /api/enterprises/:id/members/:memberId | 移除成员 | enterprise_admin, admin |
| POST | /api/enterprises/invitations/:token/accept | 接受邀请 | 登录用户 |
| POST | /api/enterprises/invitations/:token/decline | 拒绝邀请 | 登录用户 |

---

## 5. 前端页面设计规格

### 5.1 系统管理员页面

#### 5.1.1 管理员仪表板 (AdminDashboardPage.tsx)
**路由**: `/admin`
**权限**: admin

**组件结构**:
```
AdminDashboardPage
├── StatsGrid (统计卡片网格)
│   ├── StatCard (用户总数)
│   ├── StatCard (企业总数)
│   ├── StatCard (Skill总数)
│   └── StatCard (待审核)
├── RecentUsers (最近用户)
└── PendingContent (待审核内容)
```

#### 5.1.2 用户管理页面 (UserManagementPage.tsx)
**路由**: `/admin/users`
**权限**: admin

**组件结构**:
```
UserManagementPage
├── PageHeader (标题 + 操作按钮)
├── FilterBar (搜索 + 筛选)
├── UserTable (用户列表表格)
│   ├── 用户名
│   ├── 邮箱
│   ├── 角色
│   ├── 状态
│   ├── 所属企业
│   ├── 注册时间
│   └── 操作列
└── Pagination (分页)
```

**用户详情模态框**:
- 显示完整用户信息
- 角色选择器
- 状态选择器
- 重置密码按钮

#### 5.1.3 企业管理页面 (EnterpriseManagementPage.tsx)
**路由**: `/admin/enterprises`
**权限**: admin

**组件结构**:
```
EnterpriseManagementPage
├── PageHeader
├── FilterBar (搜索 + 状态筛选)
├── EnterpriseList (企业列表)
│   ├── EnterpriseCard
│   │   ├── 企业名称
│   │   ├── 成员数
│   │   ├── 资源数
│   │   ├── 状态
│   │   └── 操作
└── Pagination
```

### 5.2 企业管理员页面

#### 5.2.1 企业仪表板 (EnterpriseAdminDashboardPage.tsx)
**路由**: `/enterprise/dashboard`
**权限**: enterprise_admin, admin (同企业)

**组件结构**:
```
EnterpriseAdminDashboardPage
├── EnterpriseStats (企业统计)
│   ├── 成员总数
│   ├── Skill总数
│   ├── Prompt总数
│   └── 本周活跃
├── QuickActions (快速操作)
└── RecentActivity (最近活动)
```

#### 5.2.2 成员管理页面 (EnterpriseMembersPage.tsx)
**路由**: `/enterprise/members`
**权限**: enterprise_admin, admin (同企业)

**组件结构**:
```
EnterpriseMembersPage
├── PageHeader
├── InviteMemberButton (邀请成员按钮)
├── MemberList (成员列表)
│   ├── 头像
│   ├── 用户名
│   ├── 邮箱
│   ├── 角色
│   ├── 加入时间
│   └── 操作
└── InvitationModal (邀请模态框)
```

---

## 6. 权限控制设计

### 6.1 角色权限矩阵

| 操作 | admin | enterprise_admin | developer | user |
|------|-------|------------------|-----------|------|
| 访问系统管理后台 | ✅ | ❌ | ❌ | ❌ |
| 管理所有用户 | ✅ | ❌ | ❌ | ❌ |
| 管理所有企业 | ✅ | ❌ | ❌ | ❌ |
| 审核所有内容 | ✅ | ❌ | ❌ | ❌ |
| 访问企业管理后台 | ❌ | ✅ (同企业) | ❌ | ❌ |
| 管理企业成员 | ❌ | ✅ (同企业) | ❌ | ❌ |
| 审核企业内容 | ❌ | ✅ (同企业) | ❌ | ❌ |
| 管理企业设置 | ❌ | ✅ (同企业) | ❌ | ❌ |

### 6.2 中间件设计

复用现有的 `rbac.ts` 中间件，新增：
- `requireEnterpriseAdminOrOwner`: 企业管理员或企业所有者
- `requireEnterpriseMember`: 企业成员

---

## 7. UI/UX 设计原则

### 7.1 设计风格
- 遵循现有项目的黑色主色调设计
- 使用图标增强操作识别性
- 强化可操作组件的存在感
- 响应式设计，支持移动端

### 7.2 交互设计
- 重要操作需要二次确认
- 操作后提供及时反馈
- 加载状态有明确指示
- 错误信息清晰易懂

---

## 8. 国际化 (i18n)

### 8.1 新增翻译键

**管理员相关**:
- `admin.dashboard.title`: 管理后台
- `admin.dashboard.totalUsers`: 用户总数
- `admin.dashboard.totalEnterprises`: 企业总数
- `admin.dashboard.totalSkills`: Skill总数
- `admin.dashboard.pendingReview`: 待审核
- `admin.users.title`: 用户管理
- `admin.users.searchPlaceholder`: 搜索用户名或邮箱...
- `admin.users.role`: 角色
- `admin.users.status`: 状态
- `admin.users.enterprise`: 所属企业
- `admin.users.editRole`: 编辑角色
- `admin.users.editStatus`: 编辑状态
- `admin.enterprises.title`: 企业管理
- `admin.enterprises.memberCount`: 成员数
- `admin.enterprises.resourceCount`: 资源数

**企业管理员相关**:
- `enterpriseAdmin.dashboard.title`: 企业管理
- `enterpriseAdmin.members.title`: 成员管理
- `enterpriseAdmin.members.invite`: 邀请成员
- `enterpriseAdmin.members.invitePlaceholder`: 输入邮箱地址...
- `enterpriseAdmin.members.role.admin`: 管理员
- `enterpriseAdmin.members.role.member`: 成员

---

## 9. 实施任务分解

### Phase 1: 后端基础 (Task 1-4)
1. 创建邀请和审核日志数据模型
2. 完善 AdminController
3. 完善企业成员管理 API
4. 创建 DashboardController
5. 添加路由和权限保护

### Phase 2: 前端 API 客户端 (Task 5)
1. 创建 admin.ts API 客户端
2. 定义 TypeScript 类型接口

### Phase 3: 系统管理员界面 (Task 6-8)
1. 创建 AdminDashboardPage
2. 创建 UserManagementPage
3. 创建 EnterpriseManagementPage

### Phase 4: 企业管理员界面 (Task 9-10)
1. 创建 EnterpriseAdminDashboardPage
2. 创建 EnterpriseMembersPage

### Phase 5: 集成和优化 (Task 11-13)
1. 更新导航和路由
2. 添加国际化翻译
3. 集成测试和功能验证

---

## 10. 验收标准

### 10.1 功能验收
- 所有 API 端点正常工作
- 权限控制正确实施
- 前后端数据交互正常
- 无明显 bug

### 10.2 性能验收
- 列表页面加载时间 < 2s
- 分页查询正常工作
- 搜索功能响应迅速

### 10.3 安全验收
- 权限边界清晰
- 无越权访问漏洞
- 敏感操作有日志记录

### 10.4 用户体验验收
- 界面美观，符合设计规范
- 操作流程顺畅
- 错误提示清晰
