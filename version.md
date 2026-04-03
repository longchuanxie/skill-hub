# SkillHub 版本记录

## 版本 1.1.0 - 管理员系统增强

**发布日期**: 2026-03-28

### 新增功能

#### 1. 管理员邀请系统
- 实现邀请制管理员注册机制
- 支持创建、验证、取消管理员邀请
- 邀请链接通过邮件发送，包含7天有效期
- 支持邀请角色分级：super_admin、admin、audit_admin

#### 2. 初始超级管理员自动创建
- 系统首次部署时通过环境变量自动创建初始超级管理员
- 支持配置项：`INITIAL_SUPER_ADMIN_USERNAME`、`INITIAL_SUPER_ADMIN_EMAIL`、`INITIAL_SUPER_ADMIN_PASSWORD`
- 密码强度验证（至少12位，包含大小写字母、数字和特殊字符）

#### 3. 安全增强
- **双重认证支持**: 添加TOTP双重认证字段和接口
- **密码策略**: 90天密码过期策略，强制密码更新
- **登录监控**: 记录登录历史（IP、用户代理、时间、结果）
- **账户锁定**: 5次登录失败后锁定15分钟
- **审计日志**: 记录所有管理员操作

#### 4. 角色权限体系
- 新增角色类型：super_admin、admin、audit_admin
- 实现基于角色的访问控制（RBAC）
- 超级管理员拥有最高权限，可邀请其他管理员
- 细粒度权限控制中间件

#### 5. 管理员管理界面
- **仪表盘**: 显示系统统计信息（用户数、企业数、技能数、提示词数）
- **用户管理**: 查看、编辑、禁用用户，修改用户角色
- **企业管理**: 查看、编辑、管理企业信息
- **邀请管理**: 创建、查看、取消管理员邀请

#### 6. 前端国际化
- 管理员相关页面完整国际化支持
- 支持中文和英文切换
- 所有管理功能界面已翻译

### 技术改进

#### 后端
- 新增模型：`AdminInvitation`、`AuditLog`、`Invitation`
- 更新模型：`User`（添加安全相关字段）
- 新增控制器：`adminController`、`adminInvitationController`
- 新增路由：`admin`、`invitation`
- 新增工具：`initSuperAdmin`（初始化超级管理员）

#### 前端
- 新增页面：`AdminDashboardPage`、`AdminUsersPage`、`AdminEnterprisesPage`
- 新增组件：`EnterpriseMemberManager`、`Table`
- 新增API客户端：`admin.ts`
- 更新布局：`Layout`（添加管理员导航链接）

#### 测试
- 新增测试脚本：`test-api.js`、`test-admin-api.js`
- 单元测试覆盖：Invitation模型、AuditLog模型

### 文档

#### 新增文档
- `docs/architecture/admin-registration-architecture.md` - 管理员注册方案设计
- `docs/guides/super-admin-setup-guide.md` - 超级管理员设置指南
- `backend/.env.example` - 环境变量示例配置

### 安全特性

1. **邀请码安全**: 使用加密随机生成的32字节邀请码
2. **邮箱验证**: 强制邮箱验证，确保真实性
3. **密码加密**: 使用bcrypt（成本因子12）存储密码
4. **会话安全**: JWT令牌，支持刷新令牌机制
5. **CORS配置**: 支持多端口跨域访问

### 部署说明

#### 环境变量配置
```bash
# 初始超级管理员配置
INITIAL_SUPER_ADMIN_USERNAME=admin
INITIAL_SUPER_ADMIN_EMAIL=admin@yourcompany.com
INITIAL_SUPER_ADMIN_PASSWORD=YourSecurePassword123!

# 邮件服务配置（用于发送邀请）
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# 前端URL（用于邀请链接）
FRONTEND_URL=http://localhost:5173
```

#### 部署步骤
1. 配置环境变量
2. 启动后端服务（自动创建初始超级管理员）
3. 启动前端服务
4. 使用初始超级管理员登录
5. 修改初始密码并启用双重认证
6. 创建其他管理员账户作为备份

### 兼容性

- **数据库**: MongoDB 4.4+
- **Node.js**: 18.x+
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+

### 已知问题

无

### 后续计划

- [ ] 添加IP白名单功能
- [ ] 完善会话管理（超时、并发限制）
- [ ] 实现定期备份机制
- [ ] 添加定期权限审查功能

---

## 版本 1.0.0 - 初始版本

**发布日期**: 2026-03-15

### 功能特性

- 技能管理（创建、编辑、版本控制）
- 提示词管理
- 企业资源管理
- 用户认证和授权
- 基础管理功能

### 技术栈

- 后端：Node.js + Express + TypeScript + MongoDB
- 前端：React + TypeScript + Vite + Tailwind CSS
- 认证：JWT

---

## 版本规范

### 版本号格式
`主版本号.次版本号.修订号`

- **主版本号**: 重大功能变更或不兼容的API修改
- **次版本号**: 新增功能（向后兼容）
- **修订号**: 问题修复（向后兼容）

### 更新日志格式

每个版本包含以下部分：
- 发布日期
- 新增功能
- 技术改进
- 文档更新
- 安全特性
- 部署说明
- 兼容性
- 已知问题
- 后续计划
