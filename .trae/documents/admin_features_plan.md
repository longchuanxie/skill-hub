# 管理员和企业管理员功能完善 - 实施计划

## 项目现状分析

### 已有功能
- 用户角色系统（admin、enterprise_admin、developer、user）
- 企业模型和基础控制器
- RBAC 权限中间件
- 基础企业创建和信息管理
- 用户 API 基础框架

### 缺失的功能
- 系统管理员控制面板
- 企业管理员控制面板
- 用户管理界面（管理员视角）
- 企业成员管理界面
- 资源审核功能
- 统计分析和仪表板
- 权限精细化管理

---

## [ ] Task 1: 后端 - 完善管理员 API 控制器
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 创建 AdminController 提供系统管理员功能
  - 完善 UserController 的管理员功能
  - 添加用户管理 API（列表、搜索、状态管理、角色分配）
  - 添加企业管理 API（列表、审核、统计）
- **Success Criteria**:
  - 管理员可以查看、搜索所有用户
  - 管理员可以管理用户状态和角色
  - 管理员可以查看和管理企业
- **Test Requirements**:
  - `programmatic` TR-1.1: 管理员 API 端点返回正确的用户列表
  - `programmatic` TR-1.2: 角色分配 API 正确更新用户角色
  - `human-judgement` TR-1.3: API 响应结构合理，错误处理完善
- **Notes**: 保持与现有代码风格一致，使用 createLogger 和错误码系统

---

## [ ] Task 2: 后端 - 完善企业成员管理 API
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 实现 inviteMember 功能（替换未实现的占位符）
  - 添加成员列表、搜索 API
  - 添加成员邀请和接受流程
  - 添加权限审计日志
- **Success Criteria**:
  - 企业管理员可以邀请成员
  - 成员可以接受/拒绝邀请
  - 企业管理员可以管理成员角色
- **Test Requirements**:
  - `programmatic` TR-2.1: 邀请 API 可以成功创建邀请
  - `programmatic` TR-2.2: 成员列表 API 返回正确的成员信息
  - `human-judgement` TR-2.3: 成员管理流程符合预期
- **Notes**: 需要考虑邮箱通知（可选，后续优化）

---

## [ ] Task 3: 后端 - 添加统计和仪表板 API
- **Priority**: P1
- **Depends On**: None
- **Description**:
  - 创建 DashboardController
  - 用户统计（总用户、活跃用户、新增用户）
  - 资源统计（Skill/Prompt 数量、下载量、评分）
  - 企业统计（企业数量、成员规模）
- **Success Criteria**:
  - 管理员可以获取平台整体统计数据
  - 企业管理员可以获取企业内部统计数据
- **Test Requirements**:
  - `programmatic` TR-3.1: 统计 API 返回正确的数据结构
  - `programmatic` TR-3.2: 数据计算准确无误
  - `human-judgement` TR-3.3: 统计维度合理且有价值

---

## [ ] Task 4: 后端 - 添加后端路由和权限保护
- **Priority**: P0
- **Depends On**: Task 1, Task 2
- **Description**:
  - 创建管理员路由文件
  - 注册到 app.ts
  - 应用适当的 RBAC 中间件
  - 确保 API 端点权限正确配置
- **Success Criteria**:
  - 新 API 端点正确注册
  - 权限中间件正确应用
  - 非授权用户访问返回 403
- **Test Requirements**:
  - `programmatic` TR-4.1: 路由正确注册且可访问
  - `programmatic` TR-4.2: 权限中间件阻止未授权访问
  - `human-judgement` TR-4.3: 权限配置符合业务逻辑

---

## [ ] Task 5: 前端 - 创建管理员 API 客户端
- **Priority**: P0
- **Depends On**: Task 4
- **Description**:
  - 创建 frontend/src/api/admin.ts
  - 定义类型接口
  - 实现用户管理 API 调用
  - 实现企业管理 API 调用
  - 实现统计 API 调用
- **Success Criteria**:
  - API 客户端函数完整定义
  - TypeScript 类型正确
  - 与后端 API 兼容
- **Test Requirements**:
  - `programmatic` TR-5.1: TypeScript 编译无错误
  - `programmatic` TR-5.2: API 调用能正确发送请求
  - `human-judgement` TR-5.3: 代码结构清晰易维护

---

## [ ] Task 6: 前端 - 创建系统管理员控制面板页面
- **Priority**: P0
- **Depends On**: Task 5
- **Description**:
  - 创建 AdminDashboardPage.tsx
  - 统计卡片展示
  - 快速操作区域
  - 响应式设计
- **Success Criteria**:
  - 仪表板页面正常显示
  - 统计数据正确加载
  - UI 符合项目设计风格
- **Test Requirements**:
  - `programmatic` TR-6.1: 页面正确渲染且无控制台错误
  - `programmatic` TR-6.2: 统计数据正确获取和显示
  - `human-judgement` TR-6.3: UI 美观且易用

---

## [ ] Task 7: 前端 - 创建用户管理页面
- **Priority**: P0
- **Depends On**: Task 5
- **Description**:
  - 创建 UserManagementPage.tsx
  - 用户列表展示
  - 搜索和筛选功能
  - 用户详情查看
  - 角色分配和状态管理
- **Success Criteria**:
  - 管理员可以查看用户列表
  - 可以搜索和筛选用户
  - 可以管理用户角色和状态
- **Test Requirements**:
  - `programmatic` TR-7.1: 用户列表正确加载和显示
  - `programmatic` TR-7.2: 搜索筛选功能正常工作
  - `human-judgement` TR-7.3: 用户管理流程顺畅

---

## [ ] Task 8: 前端 - 创建企业管理页面
- **Priority**: P0
- **Depends On**: Task 5
- **Description**:
  - 创建 EnterpriseManagementPage.tsx
  - 企业列表展示
  - 企业详情查看
  - 企业审核功能
  - 企业统计展示
- **Success Criteria**:
  - 管理员可以查看所有企业
  - 可以查看企业详情
  - 可以审核企业申请
- **Test Requirements**:
  - `programmatic` TR-8.1: 企业列表正确加载
  - `programmatic` TR-8.2: 企业审核功能正常
  - `human-judgement` TR-8.3: 企业管理体验良好

---

## [ ] Task 9: 前端 - 完善企业管理员控制面板
- **Priority**: P0
- **Depends On**: Task 5
- **Description**:
  - 创建 EnterpriseAdminDashboardPage.tsx
  - 企业内部统计展示
  - 快速操作区域
  - 企业资源概览
- **Success Criteria**:
  - 企业管理员可以查看企业仪表板
  - 统计数据正确展示
  - 功能入口清晰
- **Test Requirements**:
  - `programmatic` TR-9.1: 企业仪表板正常渲染
  - `programmatic` TR-9.2: 企业统计数据正确
  - `human-judgement` TR-9.3: 界面符合企业管理需求

---

## [ ] Task 10: 前端 - 创建企业成员管理页面
- **Priority**: P0
- **Depends On**: Task 5
- **Description**:
  - 创建 EnterpriseMembersPage.tsx
  - 成员列表展示
  - 邀请成员功能
  - 成员角色管理
  - 移除成员功能
- **Success Criteria**:
  - 企业管理员可以查看成员列表
  - 可以邀请新成员
  - 可以管理成员角色
- **Test Requirements**:
  - `programmatic` TR-10.1: 成员列表正确显示
  - `programmatic` TR-10.2: 邀请和角色管理功能正常
  - `human-judgement` TR-10.3: 成员管理流程直观

---

## [ ] Task 11: 前端 - 更新导航和路由
- **Priority**: P0
- **Depends On**: Task 6-10
- **Description**:
  - 更新 App.tsx 添加新路由
  - 更新 Layout.tsx 根据用户角色显示导航
  - 添加权限检查，隐藏无权限的菜单项
- **Success Criteria**:
  - 新页面路由正确配置
  - 导航菜单根据角色动态显示
  - 无权限用户看不到管理员菜单
- **Test Requirements**:
  - `programmatic` TR-11.1: 路由配置正确且可访问
  - `programmatic` TR-11.2: 导航菜单根据角色正确显示/隐藏
  - `human-judgement` TR-11.3: 导航体验流畅自然

---

## [ ] Task 12: 前端 - 添加国际化翻译
- **Priority**: P1
- **Depends On**: Task 6-11
- **Description**:
  - 更新 en.json 添加管理员相关翻译
  - 更新 zh.json 添加管理员相关翻译
  - 确保所有新页面文本都有翻译
- **Success Criteria**:
  - 中英文翻译完整
  - 翻译键命名规范
  - 页面正确显示翻译文本
- **Test Requirements**:
  - `programmatic` TR-12.1: 翻译文件 JSON 格式正确
  - `programmatic` TR-12.2: 所有新文本键都有对应翻译
  - `human-judgement` TR-12.3: 翻译内容准确自然

---

## [ ] Task 13: 集成测试和功能验证
- **Priority**: P0
- **Depends On**: All previous tasks
- **Description**:
  - 端到端测试管理员功能流程
  - 端到端测试企业管理员功能流程
  - 权限边界测试
  - 用户体验优化
- **Success Criteria**:
  - 所有功能正常工作
  - 权限控制正确
  - 无明显 bug
- **Test Requirements**:
  - `programmatic` TR-13.1: 所有主要流程可以完整执行
  - `programmatic` TR-13.2: 权限边界测试通过
  - `human-judgement` TR-13.3: 整体用户体验良好

---

## 实施顺序建议

1. **后端 API 层** (Task 1-4) - 先完成后端基础
2. **前端 API 客户端** (Task 5) - 连接前后端
3. **管理员界面** (Task 6-8) - 系统管理员功能
4. **企业管理员界面** (Task 9-10) - 企业管理员功能
5. **导航和路由** (Task 11) - 集成到主应用
6. **国际化** (Task 12) - 完善多语言支持
7. **测试验证** (Task 13) - 确保质量

---

## 注意事项

- 保持与现有代码风格一致
- 复用已有的 UI 组件
- 遵循 RBAC 权限设计原则
- 考虑性能优化（分页、懒加载等）
- 确保错误处理完善
