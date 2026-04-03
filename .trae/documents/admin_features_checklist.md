# 管理员和企业管理员功能 - 任务清单

## Phase 1: 后端基础开发

### Task 1.1: 创建邀请模型 (Invitation)
- [ ] 创建 `backend/src/models/Invitation.ts`
- [ ] 定义 TypeScript 接口 IInvitation
- [ ] 创建 Mongoose Schema
- [ ] 添加必要的索引
- [ ] 导出模型

### Task 1.2: 创建审核日志模型 (AuditLog)
- [ ] 创建 `backend/src/models/AuditLog.ts`
- [ ] 定义 TypeScript 接口 IAuditLog
- [ ] 创建 Mongoose Schema
- [ ] 添加必要的索引
- [ ] 导出模型

### Task 1.3: 创建 AdminController
- [ ] 创建 `backend/src/controllers/adminController.ts`
- [ ] 实现 getDashboardStats - 获取统计数据
- [ ] 实现 getUserList - 获取用户列表
- [ ] 实现 getUserById - 获取用户详情
- [ ] 实现 updateUserRole - 更新用户角色
- [ ] 实现 updateUserStatus - 更新用户状态
- [ ] 实现 resetUserPassword - 重置用户密码
- [ ] 实现 getEnterpriseList - 获取企业列表
- [ ] 实现 getEnterpriseById - 获取企业详情
- [ ] 实现 updateEnterpriseStatus - 更新企业状态
- [ ] 实现 getPendingContent - 获取待审核内容
- [ ] 实现 approveContent - 审核通过
- [ ] 实现 rejectContent - 审核拒绝
- [ ] 使用 createLogger 记录日志
- [ ] 使用错误码系统

### Task 1.4: 创建 DashboardController
- [ ] 创建 `backend/src/controllers/dashboardController.ts`
- [ ] 实现 getAdminStats - 系统管理员统计
- [ ] 实现 getEnterpriseStats - 企业管理员统计
- [ ] 统计用户数、企业数、资源数等
- [ ] 统计最近活动

### Task 1.5: 完善 enterpriseController 的成员管理
- [ ] 完善 inviteMember - 实现邀请功能
- [ ] 添加 getMembers - 获取成员列表
- [ ] 添加 acceptInvitation - 接受邀请
- [ ] 添加 declineInvitation - 拒绝邀请
- [ ] 添加 getPendingInvitations - 获取待处理邀请

### Task 1.6: 创建管理员路由
- [ ] 创建 `backend/src/routes/admin.ts`
- [ ] 注册仪表板路由
- [ ] 注册用户管理路由
- [ ] 注册企业管理路由
- [ ] 注册内容审核路由
- [ ] 应用 requireAdmin 中间件

### Task 1.7: 更新 app.ts 注册新路由
- [ ] 导入 adminRoutes
- [ ] 导入 dashboardRoutes（如需要）
- [ ] 注册路由到 `/api/admin`
- [ ] 确保权限中间件正确应用

---

## Phase 2: 前端 API 客户端

### Task 2.1: 创建管理员 API 客户端
- [ ] 创建 `frontend/src/api/admin.ts`
- [ ] 定义 TypeScript 类型接口
- [ ] 实现 getDashboardStats
- [ ] 实现 getUserList
- [ ] 实现 getUserById
- [ ] 实现 updateUserRole
- [ ] 实现 updateUserStatus
- [ ] 实现 resetUserPassword
- [ ] 实现 getEnterpriseList
- [ ] 实现 getEnterpriseById
- [ ] 实现 updateEnterpriseStatus
- [ ] 实现 getPendingContent
- [ ] 实现 approveContent
- [ ] 实现 rejectContent

### Task 2.2: 更新 enterprise API 客户端
- [ ] 更新 `frontend/src/api/enterprise.ts`
- [ ] 添加 getMembers
- [ ] 添加 inviteMember
- [ ] 添加 acceptInvitation
- [ ] 添加 declineInvitation
- [ ] 添加 getDashboardStats

---

## Phase 3: 系统管理员界面

### Task 3.1: 创建 AdminDashboardPage
- [ ] 创建 `frontend/src/pages/AdminDashboardPage.tsx`
- [ ] 使用 useTranslation 进行国际化
- [ ] 创建统计卡片组件
- [ ] 获取并显示统计数据
- [ ] 显示最近注册用户
- [ ] 显示待审核内容
- [ ] 添加快速操作按钮
- [ ] 响应式设计
- [ ] 加载状态和错误处理

### Task 3.2: 创建 UserManagementPage
- [ ] 创建 `frontend/src/pages/UserManagementPage.tsx`
- [ ] 用户列表表格
- [ ] 搜索和筛选功能
- [ ] 分页组件
- [ ] 用户详情模态框
- [ ] 角色编辑功能
- [ ] 状态编辑功能
- [ ] 重置密码功能
- [ ] 确认对话框
- [ ] 加载状态和错误处理

### Task 3.3: 创建 EnterpriseManagementPage
- [ ] 创建 `frontend/src/pages/EnterpriseManagementPage.tsx`
- [ ] 企业列表展示
- [ ] 搜索和筛选功能
- [ ] 分页组件
- [ ] 企业详情查看
- [ ] 企业状态管理
- [ ] 确认对话框
- [ ] 加载状态和错误处理

---

## Phase 4: 企业管理员界面

### Task 4.1: 创建 EnterpriseAdminDashboardPage
- [ ] 创建 `frontend/src/pages/EnterpriseAdminDashboardPage.tsx`
- [ ] 企业统计卡片
- [ ] 快速操作区域
- [ ] 最近活动列表
- [ ] 响应式设计
- [ ] 加载状态和错误处理

### Task 4.2: 创建 EnterpriseMembersPage
- [ ] 创建 `frontend/src/pages/EnterpriseMembersPage.tsx`
- [ ] 成员列表展示
- [ ] 搜索功能
- [ ] 邀请成员模态框
- [ ] 成员角色管理
- [ ] 移除成员功能
- [ ] 确认对话框
- [ ] 加载状态和错误处理

---

## Phase 5: 集成和优化

### Task 5.1: 更新路由配置
- [ ] 修改 `frontend/src/App.tsx`
- [ ] 添加 `/admin` 路由
- [ ] 添加 `/admin/users` 路由
- [ ] 添加 `/admin/enterprises` 路由
- [ ] 添加 `/enterprise/dashboard` 路由
- [ ] 添加 `/enterprise/members` 路由
- [ ] 应用权限保护

### Task 5.2: 更新 Layout 导航
- [ ] 修改 `frontend/src/components/Layout.tsx`
- [ ] 根据用户角色显示导航菜单
- [ ] 为 admin 角色显示系统管理菜单
- [ ] 为 enterprise_admin 角色显示企业管理菜单
- [ ] 隐藏无权限的菜单项

### Task 5.3: 添加国际化翻译
- [ ] 更新 `frontend/src/i18n/locales/en.json`
- [ ] 添加管理员相关翻译键
- [ ] 添加企业管理员相关翻译键
- [ ] 更新 `frontend/src/i18n/locales/zh.json`
- [ ] 添加对应的中文翻译
- [ ] 验证所有翻译键都有对应值

### Task 5.4: 更新 authStore（如需要）
- [ ] 检查 `frontend/src/stores/authStore.ts`
- [ ] 确保用户角色信息正确存储
- [ ] 添加权限检查辅助函数（如需要）

---

## Phase 6: 测试和验证

### Task 6.1: 后端测试
- [ ] 测试管理员 API 端点
- [ ] 测试权限控制
- [ ] 测试企业成员管理 API
- [ ] 测试统计 API
- [ ] 运行现有测试确保无回归

### Task 6.2: 前端测试
- [ ] 测试管理员仪表板页面
- [ ] 测试用户管理功能
- [ ] 测试企业管理功能
- [ ] 测试企业管理员功能
- [ ] 测试权限控制

### Task 6.3: 集成测试
- [ ] 端到端测试管理员工作流
- [ ] 端到端测试企业管理员工作流
- [ ] 测试权限边界
- [ ] 测试响应式设计

### Task 6.4: 用户体验优化
- [ ] 优化加载状态
- [ ] 优化错误提示
- [ ] 优化操作反馈
- [ ] 性能优化

---

## 优先级说明

- **P0**: 必须完成，核心功能
- **P1**: 重要功能，建议完成
- **P2**: 优化功能，可以后续迭代

## 依赖关系

```
Phase 1 (后端) → Phase 2 (API 客户端) → Phase 3-4 (页面) → Phase 5 (集成) → Phase 6 (测试)
```

## 验收检查清单

### 功能完整性
- [ ] 所有 P0 任务已完成
- [ ] 所有 API 端点正常工作
- [ ] 所有页面可以正常访问
- [ ] 权限控制正确实施

### 代码质量
- [ ] 遵循现有代码风格
- [ ] TypeScript 类型正确
- [ ] 无 lint 错误
- [ ] 无控制台错误

### 用户体验
- [ ] 界面美观，符合设计规范
- [ ] 操作流程顺畅
- [ ] 加载状态明确
- [ ] 错误提示清晰

### 安全性
- [ ] 权限边界清晰
- [ ] 无越权访问
- [ ] 敏感操作有日志
- [ ] 输入验证完善
