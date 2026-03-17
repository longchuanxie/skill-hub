# SkillHub 后端详细设计文档

## 1. 系统架构概述

### 1.1 技术栈
| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 运行时 | Node.js | JavaScript运行环境 |
| 框架 | Express.js | Web应用框架 |
| 数据库 | MongoDB | 文档型数据库 |
| ODM | Mongoose | MongoDB对象建模 |
| 认证 | JWT | JSON Web Token |
| 密码加密 | bcryptjs | 密码哈希 |
| 文件存储 | MinIO / 本地存储 | Skill文件存储 |
| 内容检测 | 自定义检测服务 | 提示词安全检测 |

### 1.2 服务端口配置
- **API服务**: 3001
- **MongoDB**: 27017
- **MinIO**: 9000 (API) / 9001 (Console)

---

## 2. 权限系统设计

### 2.1 市场类型定义

```typescript
type MarketType = 'public' | 'enterprise';

interface MarketConfig {
  type: MarketType;
  name: string;
  description: string;
  accessControl: 'open' | 'restricted';
}
```

| 市场类型 | 访问权限 | 说明 |
|----------|----------|------|
| `public` | 公开 | 所有人可访问，Skill和提示词默认公开 |
| `enterprise` | 企业内部 | 仅企业成员可访问，严格的权限控制 |

### 2.2 用户角色定义

```typescript
type UserRole = 'admin' | 'enterprise_admin' | 'developer' | 'user';

interface RolePermissions {
  role: UserRole;
  permissions: string[];
  description: string;
}
```

| 角色 | 权限范围 | 说明 |
|------|----------|------|
| `admin` | 全部权限 | 系统管理员，管理所有用户和内容 |
| `enterprise_admin` | 企业管理权限 | 企业管理员，管理企业成员和企业市场内容 |
| `developer` | 开发者权限 | 可上传、管理自己的Skill和提示词 |
| `user` | 基础用户权限 | 可浏览公开市场、下载、评分 |

### 2.3 权限矩阵

#### 2.3.1 公开市场权限

| 操作 | admin | enterprise_admin | developer | user | 匿名用户 |
|------|-------|------------------|-----------|------|----------|
| 浏览Skill列表 | YES | YES | YES | YES | YES |
| 查看Skill详情 | YES | YES | YES | YES | YES |
| 下载Skill | YES | YES | YES | YES | YES |
| 评分Skill | YES | YES | YES | YES | NO |
| 上传Skill | YES | YES | YES | NO | NO |
| 编辑自己的Skill | YES | YES | YES | NO | NO |
| 删除自己的Skill | YES | YES | YES | NO | NO |
| 编辑他人Skill | YES | NO | NO | NO | NO |
| 删除他人Skill | YES | NO | NO | NO | NO |
| 浏览提示词列表 | YES | YES | YES | YES | YES |
| 查看提示词详情 | YES | YES | YES | YES | YES |
| 下载提示词 | YES | YES | YES | YES | YES |
| 评分提示词 | YES | YES | YES | YES | NO |
| 上传提示词 | YES | YES | YES | NO | NO |
| 编辑自己的提示词 | YES | YES | YES | NO | NO |
| 删除自己的提示词 | YES | YES | YES | NO | NO |
| 编辑他人提示词 | YES | NO | NO | NO | NO |
| 删除他人提示词 | YES | NO | NO | NO | NO |

#### 2.3.2 企业市场权限

| 操作 | admin | enterprise_admin | developer | user | 匿名用户 |
|------|-------|------------------|-----------|------|----------|
| 访问企业市场 | YES | YES | YES(同企业) | YES(同企业) | NO |
| 浏览企业Skill | YES | YES | YES(同企业) | YES(同企业) | NO |
| 下载企业Skill | YES | YES | YES(同企业) | YES(同企业) | NO |
| 上传企业Skill | YES | YES | YES(同企业) | NO | NO |
| 管理企业成员 | YES | YES | NO | NO | NO |
| 管理企业内容 | YES | YES | NO | NO | NO |

### 2.4 资源权限类型

```typescript
type PermissionType = 'public' | 'private' | 'enterprise' | 'shared';

interface ResourcePermission {
  type: PermissionType;
  enterpriseId?: string;
  sharedWith?: string[];
}
```

| 权限类型 | 可见范围 | 说明 |
|----------|----------|------|
| `public` | 所有人 | 公开资源，在公开市场展示 |
| `private` | 仅作者 | 私有资源，仅作者可见 |
| `enterprise` | 企业成员 | 企业资源，仅企业内部可见 |
| `shared` | 指定用户 | 共享资源，仅指定用户可见 |

---

## 3. 数据模型设计

### 3.1 用户模型 (User)

```typescript
interface User {
  _id: ObjectId;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  enterpriseId?: ObjectId;
  avatar?: string;
  bio?: string;
  status: 'active' | 'inactive' | 'banned';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['admin', 'enterprise_admin', 'developer', 'user'],
    default: 'user'
  },
  enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' },
  avatar: { type: String },
  bio: { type: String, maxlength: 500 },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date }
});

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ enterpriseId: 1 });
```

### 3.2 企业模型 (Enterprise)

```typescript
interface Enterprise {
  _id: ObjectId;
  name: string;
  domain: string;
  logo?: string;
  description?: string;
  adminId: ObjectId;
  members: ObjectId[];
  settings: {
    maxMembers: number;
    maxStorage: number;
    allowedDomains: string[];
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const enterpriseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  domain: { type: String, required: true, unique: true },
  logo: { type: String },
  description: { type: String, maxlength: 1000 },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  settings: {
    maxMembers: { type: Number, default: 100 },
    maxStorage: { type: Number, default: 10737418240 },
    allowedDomains: [{ type: String }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### 3.3 Skill模型

```typescript
interface SkillVersion {
  version: string;
  url: string;
  changelog?: string;
  fileSize?: number;
  checksum?: string;
  createdAt: Date;
}

interface SkillStats {
  usageCount: number;
  downloadCount: number;
  avgRating: number;
  ratingCount: number;
}

interface Skill {
  _id: ObjectId;
  name: string;
  description: string;
  author: ObjectId;
  version: string;
  versions: SkillVersion[];
  marketType: MarketType;
  enterpriseId?: ObjectId;
  permissions: {
    type: PermissionType;
    sharedWith?: ObjectId[];
  };
  tags: string[];
  category: string;
  stats: SkillStats;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, maxlength: 2000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  version: { type: String, required: true },
  versions: [{
    version: { type: String, required: true },
    url: { type: String, required: true },
    changelog: { type: String },
    fileSize: { type: Number },
    checksum: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  marketType: { 
    type: String, 
    enum: ['public', 'enterprise'],
    default: 'public'
  },
  enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' },
  permissions: {
    type: { 
      type: String, 
      enum: ['public', 'private', 'enterprise', 'shared'],
      default: 'public'
    },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  tags: [{ type: String }],
  category: { type: String, required: true },
  stats: {
    usageCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  reviewNote: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

skillSchema.index({ name: 'text', description: 'text', tags: 'text' });
skillSchema.index({ author: 1 });
skillSchema.index({ marketType: 1, status: 1 });
skillSchema.index({ enterpriseId: 1 });
```

### 3.4 提示词模型 (Prompt)

```typescript
interface PromptVersion {
  version: string;
  content: string;
  changelog?: string;
  createdAt: Date;
}

interface PerformanceMetrics {
  responseTime: number;
  relevanceScore: number;
  accuracyScore: number;
  sampleSize: number;
}

interface PromptStats {
  usageCount: number;
  avgRating: number;
  ratingCount: number;
  performanceMetrics: PerformanceMetrics;
}

interface Prompt {
  _id: ObjectId;
  name: string;
  content: string;
  author: ObjectId;
  version: string;
  versions: PromptVersion[];
  marketType: MarketType;
  enterpriseId?: ObjectId;
  category: string;
  tags: string[];
  permissions: {
    type: PermissionType;
    sharedWith?: ObjectId[];
  };
  stats: PromptStats;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  securityCheck: {
    passed: boolean;
    checkedAt: Date;
    issues: string[];
  };
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const promptSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  content: { type: String, required: true, maxlength: 50000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  version: { type: String, required: true },
  versions: [{
    version: { type: String, required: true },
    content: { type: String, required: true },
    changelog: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  marketType: { 
    type: String, 
    enum: ['public', 'enterprise'],
    default: 'public'
  },
  enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' },
  category: { type: String, required: true },
  tags: [{ type: String }],
  permissions: {
    type: { 
      type: String, 
      enum: ['public', 'private', 'enterprise', 'shared'],
      default: 'public'
    },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  stats: {
    usageCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    performanceMetrics: {
      responseTime: { type: Number, default: 0 },
      relevanceScore: { type: Number, default: 0 },
      accuracyScore: { type: Number, default: 0 },
      sampleSize: { type: Number, default: 0 }
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  securityCheck: {
    passed: { type: Boolean, default: false },
    checkedAt: { type: Date },
    issues: [{ type: String }]
  },
  reviewNote: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

promptSchema.index({ name: 'text', content: 'text', tags: 'text' });
promptSchema.index({ author: 1 });
promptSchema.index({ marketType: 1, status: 1 });
promptSchema.index({ enterpriseId: 1 });
```

### 3.5 评分模型 (Rating)

```typescript
interface Rating {
  _id: ObjectId;
  userId: ObjectId;
  resourceType: 'skill' | 'prompt';
  resourceId: ObjectId;
  score: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resourceType: { type: String, enum: ['skill', 'prompt'], required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ratingSchema.index({ userId: 1, resourceType: 1, resourceId: 1 }, { unique: true });
```

### 3.6 智能体模型 (Agent)

为外部智能体提供API访问凭证，支持企业资源隔离。

```typescript
interface Agent {
  _id: ObjectId;
  name: string;
  description?: string;
  enterpriseId?: ObjectId;
  agentId: string;
  agentToken: string;
  tokenExpiresAt: Date;
  permissions: {
    canReadPublic: boolean;
    canReadEnterprise: boolean;
    canDownload: boolean;
    canUpload: boolean;
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  status: 'active' | 'inactive' | 'suspended';
  lastAccessAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  enterpriseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enterprise',
    default: null 
  },
  agentId: { type: String, required: true, unique: true },
  agentToken: { type: String, required: true },
  tokenExpiresAt: { type: Date, required: true },
  permissions: {
    canReadPublic: { type: Boolean, default: true },
    canReadEnterprise: { type: Boolean, default: false },
    canDownload: { type: Boolean, default: true },
    canUpload: { type: Boolean, default: false },
  },
  rateLimit: {
    requestsPerMinute: { type: Number, default: 60 },
    requestsPerHour: { type: Number, default: 1000 },
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  lastAccessAt: { type: Date },
});

agentSchema.index({ agentId: 1 });
agentSchema.index({ enterpriseId: 1 });
agentSchema.index({ status: 1 });
```

---

## 4. API接口设计

### 4.1 认证模块 `/api/auth`

#### 4.1.1 用户注册
```
POST /api/auth/register
权限: 公开
```

**请求体**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "enterpriseCode": "string?"
}
```

**响应**:
```json
{
  "message": "注册成功",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string",
    "role": "user",
    "enterpriseId": "enterprise_id?"
  }
}
```

#### 4.1.2 用户登录
```
POST /api/auth/login
权限: 公开
```

**请求体**:
```json
{
  "account": "string",
  "password": "string"
}
```

#### 4.1.3 刷新Token
```
POST /api/auth/refresh
权限: 需要认证
```

#### 4.1.4 登出
```
POST /api/auth/logout
权限: 需要认证
```

#### 4.1.5 发送密码重置邮件
```
POST /api/auth/forgot-password
权限: 公开
```

**请求体**:
```json
{
  "email": "string"
}
```

**响应**:
```json
{
  "message": "如果该邮箱存在，已发送密码重置链接"
}
```

**说明**: 为防止邮箱枚举攻击，无论邮箱是否存在都返回相同消息

#### 4.1.6 重置密码
```
POST /api/auth/reset-password
权限: 公开
```

**请求体**:
```json
{
  "token": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "message": "密码重置成功",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string"
  }
}
```

#### 4.1.7 验证密码重置Token
```
GET /api/auth/verify-reset-token
权限: 公开
```

**查询参数**:
```
?token=string
```

**响应**:
```json
{
  "valid": true,
  "userId": "user_id"
}
```

#### 4.1.8 发送邮箱验证邮件
```
POST /api/auth/send-verification-email
权限: 需要认证(未验证邮箱的用户)
```

**响应**:
```json
{
  "message": "验证邮件已发送"
}
```

#### 4.1.9 验证邮箱
```
POST /api/auth/verify-email
权限: 公开
```

**请求体**:
```json
{
  "token": "string"
}
```

**响应**:
```json
{
  "message": "邮箱验证成功",
  "user": {
    "id": "user_id",
    "email": "string",
    "emailVerified": true
  }
}
```

#### 4.1.10 检查邮箱验证状态
```
GET /api/auth/email-verification-status
权限: 需要认证
```

**响应**:
```json
{
  "emailVerified": true,
  "email": "user@example.com"
}
```

### 4.2 用户模块 `/api/users`

#### 4.2.1 获取当前用户信息
```
GET /api/users/me
权限: 需要认证
```

#### 4.2.2 更新用户信息
```
PUT /api/users/me
权限: 需要认证
```

#### 4.2.3 获取用户公开资料
```
GET /api/users/:id/profile
权限: 公开
```

#### 4.2.4 修改密码
```
PUT /api/users/me/password
权限: 需要认证
```

### 4.3 Skill模块 `/api/skills`

#### 4.3.1 获取Skill列表
```
GET /api/skills
权限: 公开(公开市场) / 需要认证(企业市场)
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `market` | string | 市场类型: public/enterprise |
| `category` | string | 分类筛选 |
| `tags` | string | 标签筛选(逗号分隔) |
| `search` | string | 搜索关键词 |
| `sort` | string | 排序字段 |
| `order` | string | 排序方向 asc/desc |
| `page` | number | 页码 |
| `limit` | number | 每页数量 |

#### 4.3.2 获取Skill详情
```
GET /api/skills/:id
权限: 根据资源权限判断
```

**权限检查逻辑**:
```typescript
async function canAccessSkill(skill: Skill, user: User | null): Promise<boolean> {
  if (skill.permissions.type === 'public') {
    return true;
  }
  
  if (!user) return false;
  
  if (user.role === 'admin') return true;
  
  if (skill.permissions.type === 'private') {
    return skill.author.toString() === user._id.toString();
  }
  
  if (skill.permissions.type === 'enterprise') {
    return user.enterpriseId?.toString() === skill.enterpriseId?.toString();
  }
  
  if (skill.permissions.type === 'shared') {
    return skill.permissions.sharedWith?.includes(user._id);
  }
  
  return false;
}
```

#### 4.3.3 创建Skill
```
POST /api/skills
权限: 需要认证 (developer及以上)
```

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "version": "string",
  "fileUrl": "string",
  "category": "string",
  "tags": ["string"],
  "marketType": "public|enterprise",
  "permissions": {
    "type": "public|private|enterprise|shared",
    "sharedWith": ["user_id"]
  }
}
```

**权限检查中间件**:
```typescript
const canCreateSkill = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ message: '未登录' });
  }
  
  if (user.status !== 'active') {
    return res.status(403).json({ message: '账户状态异常' });
  }
  
  const allowedRoles = ['admin', 'enterprise_admin', 'developer'];
  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({ message: '无上传权限' });
  }
  
  if (req.body.marketType === 'enterprise' && !user.enterpriseId) {
    return res.status(403).json({ message: '无企业市场上传权限' });
  }
  
  next();
};
```

#### 4.3.4 更新Skill
```
PUT /api/skills/:id
权限: 需要认证 + 资源所有权验证
```

**权限检查逻辑**:
```typescript
async function canUpdateSkill(skill: Skill, user: User): Promise<boolean> {
  if (user.role === 'admin') return true;
  
  if (skill.author.toString() === user._id.toString()) return true;
  
  if (user.role === 'enterprise_admin' && 
      skill.enterpriseId?.toString() === user.enterpriseId?.toString()) {
    return true;
  }
  
  return false;
}
```

#### 4.3.5 删除Skill
```
DELETE /api/skills/:id
权限: 需要认证 + 资源所有权验证
```

#### 4.3.6 下载Skill
```
GET /api/skills/:id/download
权限: 根据资源权限判断
```

#### 4.3.7 评分Skill
```
POST /api/skills/:id/ratings
权限: 需要认证
```

**请求体**:
```json
{
  "score": 5,
  "comment": "string?"
}
```

### 4.4 提示词模块 `/api/prompts`

#### 4.4.1 获取提示词列表
```
GET /api/prompts
权限: 公开(公开市场) / 需要认证(企业市场)
```

#### 4.4.2 获取提示词详情
```
GET /api/prompts/:id
权限: 根据资源权限判断
```

#### 4.4.3 创建提示词
```
POST /api/prompts
权限: 需要认证 (developer及以上) + 安全检测
```

**安全检测中间件**:
```typescript
const promptSecurityCheck = async (req: Request, res: Response, next: NextFunction) => {
  const { content } = req.body;
  
  const securityIssues = await detectSecurityIssues(content);
  
  if (securityIssues.length > 0) {
    return res.status(400).json({
      message: '提示词存在安全问题',
      issues: securityIssues
    });
  }
  
  req.securityCheckResult = { passed: true, checkedAt: new Date(), issues: [] };
  next();
};

async function detectSecurityIssues(content: string): Promise<string[]> {
  const issues: string[] = [];
  
  const dangerousPatterns = [
    // 代码执行类
    { pattern: /eval\s*\(/gi, message: '禁止使用eval函数' },
    { pattern: /Function\s*\(/gi, message: '禁止使用Function构造函数' },
    { pattern: /setTimeout\s*\(\s*['"`]/gi, message: '禁止使用setTimeout动态执行代码' },
    { pattern: /setInterval\s*\(\s*['"`]/gi, message: '禁止使用setInterval动态执行代码' },
    { pattern: /new\s+Function\s*\(/gi, message: '禁止使用Function构造函数' },
    
    // 进程/系统操作类
    { pattern: /process\.exit/gi, message: '禁止调用process.exit' },
    { pattern: /process\.binding/gi, message: '禁止使用process.binding' },
    { pattern: /process\.dlopen/gi, message: '禁止使用process.dlopen' },
    { pattern: /exec\s*\(/gi, message: '禁止使用exec函数' },
    { pattern: /execSync/gi, message: '禁止使用execSync' },
    { pattern: /execFile/gi, message: '禁止使用execFile' },
    { pattern: /spawn\s*\(/gi, message: '禁止使用spawn函数' },
    { pattern: /spawnSync/gi, message: '禁止使用spawnSync' },
    { pattern: /fork\s*\(/gi, message: '禁止使用fork函数' },
    
    // 模块导入类
    { pattern: /require\s*\(\s*['"]child_process['"]\s*\)/gi, message: '禁止导入child_process模块' },
    { pattern: /require\s*\(\s*['"]fs['"]\s*\)/gi, message: '禁止导入fs模块' },
    { pattern: /require\s*\(\s*['"]net['"]\s*\)/gi, message: '禁止导入net模块' },
    { pattern: /require\s*\(\s*['"]http['"]\s*\)/gi, message: '禁止导入http模块' },
    { pattern: /require\s*\(\s*['"]https['"]\s*\)/gi, message: '禁止导入https模块' },
    { pattern: /require\s*\(\s*['"]tls['"]\s*\)/gi, message: '禁止导入tls模块' },
    { pattern: /require\s*\(\s*['"]crypto['"]\s*\)/gi, message: '禁止导入crypto模块' },
    { pattern: /import\s+.*from\s+['"]child_process['"]/gi, message: '禁止导入child_process模块' },
    { pattern: /import\s+.*from\s+['"]fs['"]/gi, message: '禁止导入fs模块' },
    { pattern: /import\s+.*from\s+['"]net['"]/gi, message: '禁止导入net模块' },
    { pattern: /import\s+.*from\s+['"]http['"]/gi, message: '禁止导入http模块' },
    
    // 原型链操作类
    { pattern: /__proto__/gi, message: '禁止访问__proto__' },
    { pattern: /prototype\s*\[/gi, message: '禁止动态访问prototype' },
    { pattern: /\[\s*['"]__proto__['"]\s*\]/gi, message: '禁止访问__proto__' },
    { pattern: /constructor\s*\[/gi, message: '禁止动态访问constructor' },
    
    // 环境变量访问类
    { pattern: /process\.env/gi, message: '禁止访问环境变量' },
    { pattern: /dotenv/gi, message: '禁止使用dotenv访问环境变量' },
    { pattern: /Bun\.env/gi, message: '禁止访问Bun环境变量' },
    { pattern: /global\[['"]/gi, message: '禁止访问全局对象' },
    
    // 文件操作类
    { pattern: /fetch\s*\(\s*['"]file:/gi, message: '禁止访问本地文件' },
    { pattern: /XMLHttpRequest/gi, message: '禁止使用XMLHttpRequest' },
    
    // 提示词注入类
    { pattern: /ignore\s+previous\s+instructions/gi, message: '检测到潜在的提示词注入' },
    { pattern: /ignore\s+all\s+previous\s+instructions/gi, message: '检测到潜在的提示词注入' },
    { pattern: /system\s*:\s*/gi, message: '检测到潜在的角色劫持' },
    { pattern: /you\s+are\s+now/gi, message: '检测到潜在的角色扮演' },
    { pattern: /previous\s+system\s+message/gi, message: '检测到提示词覆盖尝试' },
    { pattern: /disregard\s+previous\s+instructions/gi, message: '检测到提示词注入' },
    { pattern: /forget\s+all\s+instructions/gi, message: '检测到提示词注入' },
    { pattern: /new\s+system\s+prompt/gi, message: '检测到系统提示覆盖尝试' },
    { pattern: /override\s+your\s+programming/gi, message: '检测到编程限制绕过尝试' },
    
    // 命令注入类
    { pattern: /\|\s*sh/gi, message: '检测到管道命令注入' },
    { pattern: /&&\s*\w+/gi, message: '检测到命令链注入' },
    { pattern: /;\s*\w+/gi, message: '检测到命令分隔符注入' },
    { pattern: /\`\s*\$\(/gi, message: '检测到命令替换注入' },
    { pattern: /\$\(\s*\w+/gi, message: '检测到命令替换注入' },
  ];
  
  for (const { pattern, message } of dangerousPatterns) {
    if (pattern.test(content)) {
      issues.push(message);
    }
  }
  
  return issues;
}
```

#### 4.4.4 更新提示词
```
PUT /api/prompts/:id
权限: 需要认证 + 资源所有权验证 + 安全检测
```

#### 4.4.5 删除提示词
```
DELETE /api/prompts/:id
权限: 需要认证 + 资源所有权验证
```

#### 4.4.6 评分提示词
```
POST /api/prompts/:id/ratings
权限: 需要认证
```

### 4.5 企业模块 `/api/enterprises`

#### 4.5.1 创建企业
```
POST /api/enterprises
权限: 需要认证 (admin)
```

#### 4.5.2 获取企业信息
```
GET /api/enterprises/:id
权限: 需要认证 (企业成员)
```

#### 4.5.3 更新企业信息
```
PUT /api/enterprises/:id
权限: 需要认证 (enterprise_admin)
```

#### 4.5.4 添加企业成员
```
POST /api/enterprises/:id/members
权限: 需要认证 (enterprise_admin)
```

#### 4.5.5 移除企业成员
```
DELETE /api/enterprises/:id/members/:userId
权限: 需要认证 (enterprise_admin)
```

### 4.6 文件上传模块 `/api/upload`

#### 4.6.1 上传文件
```
POST /api/upload
权限: 需要认证 (developer及以上)
```

**文件限制**:
| 限制项 | 配置 |
|--------|------|
| 最大大小 | 50MB |
| 允许类型 | .js, .ts, .json, .zip, .md |
| 病毒扫描 | 启用 |

**安全检测中间件**:
```typescript
const fileSecurityCheck = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ message: '未上传文件' });
  }
  
  const filePath = req.file.path;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const maliciousPatterns = [
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /require\s*\(\s*['"]child_process['"]\s*\)/gi,
    /require\s*\(\s*['"]fs['"]\s*\)/gi,
    /process\.binding/gi,
    /process\.dlopen/gi,
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(content)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: '文件包含潜在恶意代码' });
    }
  }
  
  next();
};
```

### 4.7 智能体API模块 `/api/agent`

为外部智能体提供查询和下载平台资源的API，支持企业资源隔离。

#### 4.7.1 获取Agent配置
```
GET /api/agent/config
权限: 需要Agent认证
```

**请求头**:
```
X-Agent-Id: agent_unique_id
X-Agent-Token: agent_access_token
```

**响应**:
```json
{
  "agentId": "agent_123",
  "name": "企业智能助手",
  "enterpriseId": "ent_456",
  "permissions": {
    "canReadPublic": true,
    "canReadEnterprise": true,
    "canDownload": true,
    "canUpload": false
  },
  "rateLimit": {
    "requestsPerMinute": 60,
    "requestsPerHour": 1000
  }
}
```

#### 4.7.2 获取公开Skill列表
```
GET /api/agent/skills
权限: 需要Agent认证
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认1 |
| limit | number | 每页数量，默认20 |
| search | string | 搜索关键词 |
| tags | string[] | 标签筛选 |

**响应**:
```json
{
  "items": [
    {
      "id": "skill_123",
      "name": "代码审查助手",
      "description": "自动审查代码质量问题",
      "version": "1.2.0",
      "tags": ["code", "review"],
      "author": {
        "id": "user_456",
        "username": "developer1"
      },
      "stats": {
        "downloadCount": 1234,
        "avgRating": 4.5,
        "ratingCount": 89
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20
}
```

#### 4.7.3 获取公开Prompt列表
```
GET /api/agent/prompts
权限: 需要Agent认证
```

**查询参数**: 同Skill列表

**响应**:
```json
{
  "items": [
    {
      "id": "prompt_123",
      "name": "技术文档生成",
      "content": "请根据以下代码生成技术文档...",
      "category": "documentation",
      "tags": ["doc", "technical"],
      "author": {
        "id": "user_456",
        "username": "developer1"
      },
      "stats": {
        "usageCount": 567,
        "avgRating": 4.2,
        "ratingCount": 34
      },
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ],
  "total": 89,
  "page": 1,
  "limit": 20
}
```

#### 4.7.4 获取企业Skill列表
```
GET /api/agent/enterprise/skills
权限: 需要Agent认证 + 企业成员
```

**说明**: 返回当前Agent所属企业的内部Skill

**响应**: 同公开Skill列表，但只包含企业资源

#### 4.7.5 获取企业Prompt列表
```
GET /api/agent/enterprise/prompts
权限: 需要Agent认证 + 企业成员
```

**说明**: 返回当前Agent所属企业的内部Prompt

#### 4.7.6 下载Skill
```
GET /api/agent/skills/:id/download
权限: 需要Agent认证
```

**权限说明**:
- 公开Skill: 任何Agent可下载
- 企业Skill: 仅同企业Agent可下载

**响应**: 返回Skill文件内容(压缩包)

#### 4.7.7 获取Prompt详情
```
GET /api/agent/prompts/:id
权限: 需要Agent认证
```

**权限说明**:
- 公开Prompt: 任何Agent可查看
- 企业Prompt: 仅同企业Agent可查看

**响应**:
```json
{
  "id": "prompt_123",
  "name": "技术文档生成",
  "content": "请根据以下代码生成技术文档...",
  "category": "documentation",
  "tags": ["doc", "technical"],
  "marketType": "public",
  "permissions": "public",
  "author": {
    "id": "user_456",
    "username": "developer1"
  },
  "stats": {
    "usageCount": 567,
    "avgRating": 4.2,
    "ratingCount": 34
  },
  "createdAt": "2024-01-10T08:00:00Z"
}
```

#### 4.7.8 上传Skill(可选)
```
POST /api/agent/skills
权限: 需要Agent认证 + 上传权限
```

**请求体**:
```json
{
  "name": "新Skill名称",
  "description": "Skill描述",
  "content": "base64编码的Skill文件内容",
  "tags": ["ai", "assistant"],
  "marketType": "enterprise"
}
```

#### 4.7.9 上传Prompt(可选)
```
POST /api/agent/prompts
权限: 需要Agent认证 + 上传权限
```

**请求体**:
```json
{
  "name": "新Prompt名称",
  "content": "Prompt内容",
  "category": "conversation",
  "tags": ["chat", "customer-service"],
  "marketType": "enterprise"
}
```

#### 4.7.10 Agent注册
```
POST /api/agent/register
权限: 需要管理员授权码
```

**请求体**:
```json
{
  "name": "智能助手名称",
  "description": "Agent用途描述",
  "enterpriseId": "ent_456",
  "authorizationCode": "admin_provided_code"
}
```

**响应**:
```json
{
  "agentId": "agent_123",
  "agentToken": "sk-agent-xxxxx",
  "name": "智能助手名称",
  "enterpriseId": "ent_456",
  "permissions": {
    "canReadPublic": true,
    "canReadEnterprise": true,
    "canDownload": true,
    "canUpload": false
  }
}
```

#### 4.7.11 刷新Agent Token
```
POST /api/agent/refresh
权限: 需要Agent认证
```

**响应**:
```json
{
  "agentToken": "sk-agent-yyyyy",
  "expiresAt": "2024-02-01T00:00:00Z"
}
```

---

## 5. 中间件设计

### 5.1 认证中间件

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  role: string;
  enterpriseId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { _id: string };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
    req.user = { ...decoded, _id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: '无效的认证令牌' });
  }
};

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
      req.user = { ...decoded, _id: decoded.userId };
    } catch (error) {
      // Token无效，但继续处理请求
    }
  }
  
  next();
};
```

### 5.2 角色权限中间件

```typescript
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: '未登录' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足' });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireEnterpriseAdmin = requireRole('admin', 'enterprise_admin');
export const requireDeveloper = requireRole('admin', 'enterprise_admin', 'developer');
```

### 5.3 企业成员验证中间件

```typescript
export const requireEnterpriseMember = async (req: Request, res: Response, next: NextFunction) => {
  const enterpriseId = req.params.enterpriseId || req.body.enterpriseId;
  
  if (!req.user) {
    return res.status(401).json({ message: '未登录' });
  }
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  if (req.user.enterpriseId !== enterpriseId) {
    return res.status(403).json({ message: '无权访问该企业资源' });
  }
  
  next();
};
```

### 5.4 资源所有权验证中间件

```typescript
import Skill from '../models/Skill';
import Prompt from '../models/Prompt';

export const requireResourceOwner = (resourceType: 'skill' | 'prompt') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params.id;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: '未登录' });
    }
    
    const Model = resourceType === 'skill' ? Skill : Prompt;
    const resource = await Model.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({ message: '资源不存在' });
    }
    
    if (user.role === 'admin') {
      return next();
    }
    
    if (resource.author.toString() === user._id) {
      return next();
    }
    
    if (user.role === 'enterprise_admin' && 
        resource.enterpriseId?.toString() === user.enterpriseId) {
      return next();
    }
    
    return res.status(403).json({ message: '无权操作该资源' });
  };
};
```

### 5.5 速率限制中间件

```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: '请求过于频繁，请稍后再试' }
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: '上传次数过多，请稍后再试' }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: '登录尝试次数过多，请稍后再试' }
});

### 5.6 Agent认证中间件

为智能体API提供认证和权限验证，支持企业资源隔离。

```typescript
import Agent from '../models/Agent';

interface AgentAuthRequest extends Request {
  agent?: {
    _id: string;
    agentId: string;
    name: string;
    enterpriseId?: string;
    permissions: {
      canReadPublic: boolean;
      canReadEnterprise: boolean;
      canDownload: boolean;
      canUpload: boolean;
    };
    rateLimit: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
  };
}

export const requireAgentAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const agentId = req.headers['x-agent-id'] as string;
  const agentToken = req.headers['x-agent-token'] as string;
  
  if (!agentId || !agentToken) {
    return res.status(401).json({ 
      message: '缺少Agent认证信息',
      code: 'AGENT_AUTH_REQUIRED'
    });
  }
  
  const agent = await Agent.findOne({ 
    agentId, 
    status: 'active' 
  });
  
  if (!agent) {
    return res.status(401).json({ 
      message: 'Agent不存在或已禁用',
      code: 'AGENT_NOT_FOUND'
    });
  }
  
  if (agent.tokenExpiresAt < new Date()) {
    return res.status(401).json({ 
      message: 'Agent Token已过期',
      code: 'AGENT_TOKEN_EXPIRED'
    });
  }
  
  const isValidToken = await bcrypt.compare(agentToken, agent.agentToken);
  if (!isValidToken) {
    return res.status(401).json({ 
      message: 'Agent Token无效',
      code: 'AGENT_TOKEN_INVALID'
    });
  }
  
  (req as AgentAuthRequest).agent = {
    _id: agent._id.toString(),
    agentId: agent.agentId,
    name: agent.name,
    enterpriseId: agent.enterpriseId?.toString(),
    permissions: agent.permissions,
    rateLimit: agent.rateLimit,
  };
  
  agent.lastAccessAt = new Date();
  await agent.save();
  
  next();
};

export const requireEnterpriseAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const agent = (req as AgentAuthRequest).agent;
  
  if (!agent) {
    return res.status(401).json({ 
      message: '未通过Agent认证',
      code: 'AGENT_AUTH_REQUIRED'
    });
  }
  
  if (!agent.permissions.canReadEnterprise) {
    return res.status(403).json({ 
      message: '该Agent没有访问企业资源的权限',
      code: 'AGENT_NO_ENTERPRISE_PERMISSION'
    });
  }
  
  next();
};
```

---

## 5.2 标准化错误码体系

### 5.2.1 错误码定义

```typescript
enum ErrorCode {
  // 通用错误 0xxx
  SUCCESS = 0,
  UNKNOWN_ERROR = 1,
  INVALID_PARAMETER = 2,
  MISSING_PARAMETER = 3,
  
  // 认证相关 1xxx
  UNAUTHORIZED = 1001,
  TOKEN_EXPIRED = 1002,
  TOKEN_INVALID = 1003,
  TOKEN_MISSING = 1004,
  ACCOUNT_DISABLED = 1005,
  ACCOUNT_LOCKED = 1006,
  INVALID_CREDENTIALS = 1007,
  
  // 权限相关 2xxx
  FORBIDDEN = 2001,
  INSUFFICIENT_PERMISSIONS = 2002,
  RESOURCE_ACCESS_DENIED = 2003,
  ENTERPRISE_ACCESS_DENIED = 2004,
  ROLE_NOT_ALLOWED = 2005,
  
  // 资源相关 3xxx
  RESOURCE_NOT_FOUND = 3001,
  RESOURCE_ALREADY_EXISTS = 3002,
  RESOURCE_CONFLICT = 3003,
  RESOURCE_DELETED = 3004,
  RESOURCE_EXPIRED = 3005,
  
  // 业务相关 4xxx
  SECURITY_CHECK_FAILED = 4001,
  FILE_TYPE_NOT_ALLOWED = 4002,
  FILE_SIZE_EXCEEDED = 4003,
  FILE_UPLOAD_FAILED = 4004,
  VIRUS_DETECTED = 4005,
  CONTENT_VIOLATION = 4006,
  RATE_LIMIT_EXCEEDED = 4007,
  OPERATION_NOT_ALLOWED = 4008,
  
  // 用户相关 5xxx
  USERNAME_EXISTS = 5001,
  EMAIL_EXISTS = 5002,
  EMAIL_NOT_VERIFIED = 5003,
  WEAK_PASSWORD = 5004,
  PASSWORD_MISMATCH = 5005,
  ENTERPRISE_NOT_FOUND = 5006,
  ENTERPRISE_FULL = 5007,
  
  // 验证相关 6xxx
  VALIDATION_ERROR = 6001,
  INVALID_EMAIL_FORMAT = 6002,
  INVALID_USERNAME_FORMAT = 6003,
  INVALID_PASSWORD_FORMAT = 6004,
}
```

### 5.2.2 错误响应格式

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
}

interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 5.2.3 统一错误处理中间件

```typescript
import { Request, Response, NextFunction } from 'express';

class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req as any).requestId || crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp,
        requestId,
      },
    });
  }
  
  console.error('Unexpected Error:', err);
  
  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.UNKNOWN_ERROR,
      message: '服务器内部错误',
      timestamp,
      requestId,
    },
  });
};

const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### 5.2.4 错误码对应HTTP状态码

| 错误码范围 | HTTP状态码 | 说明 |
|------------|------------|------|
| 0xxx | 200 | 成功 |
| 1xxx | 401 | 认证错误 |
| 2xxx | 403 | 权限错误 |
| 3xxx | 404 | 资源不存在 |
| 4xxx | 400 | 业务错误 |
| 5xxx | 400 | 用户相关错误 |
| 6xxx | 422 | 验证错误 |
| 其他 | 500 | 服务器错误 |

---

## 5.3 API版本控制

采用URL路径版本控制方案，支持API的平滑迭代和向后兼容。

```typescript
// 路由版本控制示例
import { Router } from 'express';

const router = Router();

// v1路由组
router.use('/v1', v1Router);
// v2路由组(未来扩展)
router.use('/v2', v2Router);

// 默认重定向到最新版本
router.get('/', (req, res) => {
  res.redirect('/api/v1');
});
```

### 5.3.1 版本控制策略

| 策略 | 实现方式 | 适用场景 |
|------|----------|----------|
| URL路径 | /api/v1/skills | 推荐，简单直观 |
| Header | Accept: application/vnd.skillhub.v1+json | 适合复杂场景 |
| Query | /api/skills?version=1 | 不推荐，URL不够清洁 |

### 5.3.2 版本迁移规则

```typescript
// 版本迁移中间件
const versionMigration = (req: Request, res: Response, next: NextFunction) => {
  const version = req.path.split('/')[1]; // v1, v2
  
  // v1到v2的字段映射
  if (version === 'v1') {
    req.body.authorId = req.body.authorId || req.body.author;
    delete req.body.author;
  }
  
  next();
};
```

---

## 5.4 日志系统设计

### 5.4.1 日志级别

```typescript
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: {
    userId?: string;
    requestId?: string;
    ip?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    responseTime?: number;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}
```

### 5.4.2 日志模块

```typescript
// utils/logger.ts
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...context }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${
      Object.keys(context).length ? JSON.stringify(context) : ''
    } ${stack || ''}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// HTTP请求日志中间件
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http({
      message: 'HTTP Request',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  
  next();
};
```

### 5.4.3 日志存储策略

| 日志类型 | 存储位置 | 保留时间 | 说明 |
|----------|----------|----------|------|
| 错误日志 | logs/error.log | 30天 | 所有error级别日志 |
| 访问日志 | logs/access.log | 7天 | HTTP请求详情 |
| 业务日志 | logs/business.log | 14天 | 业务操作记录 |
| 调试日志 | logs/debug.log | 3天 | debug级别日志(生产环境关闭) |

### 5.4.4 结构化日志示例

```typescript
// 业务日志记录
logger.info('User created skill', {
  userId: user._id,
  skillId: skill._id,
  skillName: skill.name,
  marketType: skill.marketType,
  action: 'skill_create',
});

logger.error('Security check failed', {
  userId: user._id,
  contentId: content._id,
  issues: securityIssues,
  action: 'security_check_failed',
});
```

---

## 5.5 缓存策略设计

### 5.5.1 缓存架构

采用内存缓存+Redis分布式缓存的二级缓存架构。

```typescript
// config/cache.ts
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

class CacheService {
  private localCache = new Map<string, { value: any; expireAt: number }>();
  private defaultTTL = 300; // 5分钟

  async get<T>(key: string): Promise<T | null> {
    // 先查本地缓存
    const local = this.localCache.get(key);
    if (local && local.expireAt > Date.now()) {
      return local.value;
    }

    // 查Redis
    const value = await redis.get(key);
    if (value) {
      const parsed = JSON.parse(value);
      // 回填本地缓存
      this.localCache.set(key, {
        value: parsed,
        expireAt: Date.now() + (this.defaultTTL * 1000),
      });
      return parsed;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    // 写Redis
    await redis.setex(key, ttl, JSON.stringify(value));
    // 写本地缓存
    this.localCache.set(key, {
      value,
      expireAt: Date.now() + (ttl * 1000),
    });
  }

  async delete(key: string): Promise<void> {
    await redis.del(key);
    this.localCache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    // 清理本地缓存
    for (const key of this.localCache.keys()) {
      if (key.match(pattern.replace('*', '.*'))) {
        this.localCache.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();
```

### 5.5.2 缓存策略配置

| 缓存数据 | 缓存键 | TTL | 失效策略 |
|----------|--------|-----|----------|
| 公开Skill列表 | `skills:public:list:{page}:{limit}` | 5分钟 | 发布/更新时失效 |
| 公开Prompt列表 | `prompts:public:list:{page}:{limit}` | 5分钟 | 发布/更新时失效 |
| Skill详情 | `skill:{id}` | 10分钟 | 更新时失效 |
| Prompt详情 | `prompt:{id}` | 10分钟 | 更新时失效 |
| 用户信息 | `user:{id}` | 30分钟 | 更新时失效 |
| 企业信息 | `enterprise:{id}` | 30分钟 | 更新时失效 |
| 分类列表 | `categories:all` | 1小时 | 新增分类时失效 |
| 热门搜索 | `search:hot` | 15分钟 | 定时刷新 |

### 5.5.3 缓存中间件

```typescript
// middleware/cache.ts
import { Request, Response, NextFunction } from 'express';
import { cacheService } from '@/config/cache';

export const cacheMiddleware = (keyGenerator: (req: Request) => string, ttl?: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // GET请求才缓存
    if (req.method !== 'GET') {
      return next();
    }

    const key = keyGenerator(req);

    try {
      const cached = await cacheService.get(key);
      if (cached) {
        return res.json(cached);
      }

      // 拦截响应，手动缓存
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // 只缓存成功响应
        if (res.statusCode === 200) {
          cacheService.set(key, body, ttl).catch(console.error);
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

// 使用示例
router.get('/skills', 
  cacheMiddleware((req) => `skills:public:list:${req.query.page}:${req.query.limit}`, 300),
  skillController.list
);
```

---

## 6. 项目结构

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── storage.ts
│   ├── controllers/
│   │   ├── AuthController.ts
│   │   ├── UserController.ts
│   │   ├── SkillController.ts
│   │   ├── PromptController.ts
│   │   ├── EnterpriseController.ts
│   │   ├── RatingController.ts
│   │   └── UploadController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── roleCheck.ts
│   │   ├── resourceOwner.ts
│   │   ├── securityCheck.ts
│   │   ├── rateLimiter.ts
│   │   └── upload.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Enterprise.ts
│   │   ├── Skill.ts
│   │   ├── Prompt.ts
│   │   └── Rating.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── skillRoutes.ts
│   │   ├── promptRoutes.ts
│   │   ├── enterpriseRoutes.ts
│   │   └── uploadRoutes.ts
│   ├── services/
│   │   ├── AuthService.ts
│   │   ├── SkillService.ts
│   │   ├── PromptService.ts
│   │   ├── EnterpriseService.ts
│   │   ├── StorageService.ts
│   │   └── SecurityService.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── responseFormatter.ts
│   │   └── logger.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── uploads/
├── tests/
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 7. 环境变量配置

```env
# 服务配置
PORT=3001
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/skillhub

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# MinIO / 存储
STORAGE_TYPE=local
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=skillhub

# 安全配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
UPLOAD_RATE_LIMIT_MAX=10

# 企业配置
ENTERPRISE_DEFAULT_MAX_MEMBERS=100
ENTERPRISE_DEFAULT_MAX_STORAGE=10737418240
```

---

## 8. 安全设计总结

### 8.1 已实现的安全措施

| 安全措施 | 说明 |
|----------|------|
| JWT认证 | 基于Token的无状态认证 |
| 密码加密 | bcryptjs加盐哈希 |
| 角色权限控制 | 基于角色的访问控制(RBAC) |
| 资源所有权验证 | 验证操作者是否为资源所有者 |
| 速率限制 | 防止接口滥用 |
| 文件类型限制 | 仅允许特定类型文件上传 |
| 内容安全检测 | 检测提示词和文件中的恶意代码 |

### 8.2 待实现的安全措施

| 安全措施 | 说明 |
|----------|------|
| 病毒扫描 | 上传文件病毒扫描 |
| 审计日志 | 记录关键操作日志 |
| IP白名单 | 企业市场IP访问控制 |
| 双因素认证 | 敏感操作二次验证 |
| 数据加密 | 敏感数据加密存储 |

---

## 5. 公共市场访问控制设计

### 5.1 访问权限调整

**核心原则**: 公共市场（主页）不需要登录即可访问，但需要过滤企业私有资源。

```typescript
interface MarketAccessRule {
  marketType: 'public' | 'enterprise';
  requiresAuth: boolean;
  filterEnterprisePrivate: boolean;
}

const marketAccessRules: MarketAccessRule[] = [
  {
    marketType: 'public',
    requiresAuth: false,
    filterEnterprisePrivate: true,
  },
  {
    marketType: 'enterprise',
    requiresAuth: true,
    filterEnterprisePrivate: false,
  },
];
```

### 5.2 资源过滤逻辑

```typescript
async function filterResourcesForPublicMarket(
  resources: (Skill | Prompt)[],
  user: User | null
): Promise<(Skill | Prompt)[]> {
  return resources.filter(resource => {
    if (resource.visibility === 'public') {
      return true;
    }
    
    if (resource.visibility === 'enterprise') {
      if (!user || !user.enterpriseId) {
        return false;
      }
      return resource.enterpriseId?.toString() === user.enterpriseId.toString();
    }
    
    if (resource.visibility === 'private') {
      if (!user) {
        return false;
      }
      return resource.owner.toString() === user._id.toString();
    }
    
    return false;
  });
}
```

### 5.3 更新后的权限矩阵

#### 5.3.1 公开市场权限（更新版）

| 操作 | admin | enterprise_admin | developer | user | 匿名用户 |
|------|-------|------------------|-----------|------|----------|
| 浏览Skill列表 | YES | YES | YES | YES | YES |
| 查看Skill详情 | YES | YES | YES | YES | YES |
| 下载Skill | YES | YES | YES | YES | YES |
| 收藏Skill | YES | YES | YES | YES | NO |
| 点赞Skill | YES | YES | YES | YES | NO |
| 评分Skill | YES | YES | YES | YES | NO |
| 评论Skill | YES | YES | YES | YES | NO |
| 上传Skill | YES | YES | YES | NO | NO |
| 编辑自己的Skill | YES | YES | YES | NO | NO |
| 删除自己的Skill | YES | YES | YES | NO | NO |

**说明**: 
- 匿名用户可以浏览、查看详情和下载公开资源
- 收藏、点赞、评分、评论需要登录
- 企业私有资源仅对同企业成员可见

---

## 6. 收藏功能设计

### 6.1 收藏模型 (Favorite)

```typescript
interface Favorite {
  _id: ObjectId;
  userId: ObjectId;
  resourceType: 'skill' | 'prompt';
  resourceId: ObjectId;
  createdAt: Date;
}

const favoriteSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  resourceType: { 
    type: String, 
    enum: ['skill', 'prompt'], 
    required: true 
  },
  resourceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
});

favoriteSchema.index({ userId: 1, resourceType: 1, resourceId: 1 }, { unique: true });
favoriteSchema.index({ resourceType: 1, resourceId: 1 });
```

### 6.2 收藏API接口

#### 6.2.1 添加收藏
```
POST /api/favorites
权限: 需要认证
```

**请求体**:
```json
{
  "resourceType": "skill|prompt",
  "resourceId": "string"
}
```

**响应**:
```json
{
  "message": "收藏成功",
  "favorite": {
    "id": "favorite_id",
    "resourceType": "skill",
    "resourceId": "skill_id",
    "createdAt": "2026-03-15T00:00:00.000Z"
  }
}
```

#### 6.2.2 取消收藏
```
DELETE /api/favorites/:resourceType/:resourceId
权限: 需要认证
```

#### 6.2.3 获取我的收藏列表
```
GET /api/favorites
权限: 需要认证
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `type` | string | 资源类型: skill/prompt |
| `page` | number | 页码 |
| `limit` | number | 每页数量 |

#### 6.2.4 检查是否已收藏
```
GET /api/favorites/check/:resourceType/:resourceId
权限: 需要认证
```

**响应**:
```json
{
  "isFavorited": true,
  "favoriteId": "favorite_id"
}
```

---

## 7. 点赞功能设计

### 7.1 点赞模型 (Like)

```typescript
interface Like {
  _id: ObjectId;
  userId: ObjectId;
  resourceType: 'skill' | 'prompt';
  resourceId: ObjectId;
  createdAt: Date;
}

const likeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  resourceType: { 
    type: String, 
    enum: ['skill', 'prompt'], 
    required: true 
  },
  resourceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
});

likeSchema.index({ userId: 1, resourceType: 1, resourceId: 1 }, { unique: true });
likeSchema.index({ resourceType: 1, resourceId: 1 });
```

### 7.2 更新Skill/Prompt模型添加点赞计数

```typescript
interface SkillStats {
  usageCount: number;
  downloadCount: number;
  avgRating: number;
  ratingCount: number;
  likeCount: number;      // 新增
  favoriteCount: number;  // 新增
}
```

### 7.3 点赞API接口

#### 7.3.1 点赞/取消点赞
```
POST /api/likes/toggle
权限: 需要认证
```

**请求体**:
```json
{
  "resourceType": "skill|prompt",
  "resourceId": "string"
}
```

**响应**:
```json
{
  "liked": true,
  "likeCount": 42
}
```

#### 7.3.2 检查是否已点赞
```
GET /api/likes/check/:resourceType/:resourceId
权限: 需要认证
```

---

## 8. 评论功能设计

### 8.1 评论模型 (Comment)

```typescript
interface Comment {
  _id: ObjectId;
  userId: ObjectId;
  resourceType: 'skill' | 'prompt';
  resourceId: ObjectId;
  content: string;
  parentId?: ObjectId;
  replies?: ObjectId[];
  status: 'active' | 'hidden' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  resourceType: { 
    type: String, 
    enum: ['skill', 'prompt'], 
    required: true 
  },
  resourceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  content: { 
    type: String, 
    required: true, 
    maxlength: 1000 
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment',
    default: null 
  },
  replies: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment' 
  }],
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

commentSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ parentId: 1 });
```

### 8.2 评论API接口

#### 8.2.1 获取评论列表
```
GET /api/comments/:resourceType/:resourceId
权限: 公开
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | number | 页码 |
| `limit` | number | 每页数量 |
| `sort` | string | 排序: latest/popular |

**响应**:
```json
{
  "comments": [
    {
      "id": "comment_id",
      "content": "string",
      "user": {
        "id": "user_id",
        "username": "string",
        "avatar": "string"
      },
      "replies": [
        {
          "id": "reply_id",
          "content": "string",
          "user": { "id": "user_id", "username": "string" },
          "createdAt": "2026-03-15T00:00:00.000Z"
        }
      ],
      "replyCount": 5,
      "createdAt": "2026-03-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10
  }
}
```

#### 8.2.2 创建评论
```
POST /api/comments
权限: 需要认证
```

**请求体**:
```json
{
  "resourceType": "skill|prompt",
  "resourceId": "string",
  "content": "string",
  "parentId": "string?"
}
```

#### 8.2.3 删除评论
```
DELETE /api/comments/:id
权限: 需要认证 + 评论所有权验证
```

---

## 9. Skill上传结构校验设计

### 9.1 Skill结构规范定义

```typescript
interface SkillManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  category: string;
  tags?: string[];
  entry: string;
  dependencies?: Record<string, string>;
  config?: {
    timeout?: number;
    memory?: number;
    env?: Record<string, string>;
  };
  readme?: string;
  license?: string;
}

interface SkillStructure {
  manifest: SkillManifest;
  files: {
    path: string;
    content: Buffer;
    size: number;
  }[];
}
```

### 9.2 目录结构规范

```
skill-name/
├── skill.json          # 必需 - Skill清单文件
├── README.md           # 推荐 - 说明文档
├── src/                # 必需 - 源代码目录
│   ├── index.js        # 入口文件
│   └── ...
├── tests/              # 可选 - 测试文件
├── assets/             # 可选 - 资源文件
└── package.json        # 可选 - 依赖配置
```

### 9.3 skill.json 规范

```json
{
  "name": "skill-name",
  "version": "1.0.0",
  "description": "Skill description",
  "author": "author-name",
  "category": "coding",
  "tags": ["tag1", "tag2"],
  "entry": "src/index.js",
  "dependencies": {
    "lodash": "^4.17.0"
  },
  "config": {
    "timeout": 30000,
    "memory": 256,
    "env": {
      "API_KEY": ""
    }
  },
  "license": "MIT"
}
```

### 9.4 校验规则

```typescript
const skillValidationRules = {
  name: {
    required: true,
    pattern: /^[a-z0-9-_]+$/,
    minLength: 2,
    maxLength: 50,
  },
  version: {
    required: true,
    pattern: /^\d+\.\d+\.\d+$/,
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 500,
  },
  category: {
    required: true,
    enum: ['coding', 'writing', 'design', 'marketing', 'data-analysis', 'general'],
  },
  entry: {
    required: true,
    pattern: /^src\/.+\.js$/,
  },
  tags: {
    maxItems: 10,
    itemPattern: /^[a-z0-9-]+$/,
  },
};

async function validateSkillStructure(skillPath: string): Promise<{
  valid: boolean;
  errors: string[];
  manifest?: SkillManifest;
}> {
  const errors: string[] = [];
  
  const manifestPath = path.join(skillPath, 'skill.json');
  if (!fs.existsSync(manifestPath)) {
    errors.push('缺少 skill.json 清单文件');
    return { valid: false, errors };
  }
  
  let manifest: SkillManifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (e) {
    errors.push('skill.json 格式无效');
    return { valid: false, errors };
  }
  
  if (!manifest.name || !skillValidationRules.name.pattern.test(manifest.name)) {
    errors.push('name 必须是小写字母、数字、中划线或下划线');
  }
  
  if (!manifest.version || !skillValidationRules.version.pattern.test(manifest.version)) {
    errors.push('version 必须符合语义化版本规范 (x.x.x)');
  }
  
  if (!manifest.description || manifest.description.length < 10) {
    errors.push('description 至少需要10个字符');
  }
  
  if (!manifest.category) {
    errors.push('category 是必需字段');
  }
  
  const entryPath = path.join(skillPath, manifest.entry || 'src/index.js');
  if (!fs.existsSync(entryPath)) {
    errors.push(`入口文件 ${manifest.entry} 不存在`);
  }
  
  const srcPath = path.join(skillPath, 'src');
  if (!fs.existsSync(srcPath)) {
    errors.push('缺少 src 源代码目录');
  }
  
  const dangerousPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /child_process/,
    /fs\.unlink/,
    /fs\.rmdir/,
    /process\.exit/,
  ];
  
  const files = await getAllFiles(skillPath);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const pattern of dangerousPatterns) {
        if (pattern.test(content)) {
          errors.push(`文件 ${file} 包含潜在危险代码: ${pattern}`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    manifest: errors.length === 0 ? manifest : undefined,
  };
}
```

### 9.5 上传API接口

#### 9.5.1 上传Skill（文件夹/ZIP）
```
POST /api/skills/upload
权限: 需要认证 (developer及以上)
Content-Type: multipart/form-data
```

**请求体**:
```
file: File (ZIP文件或文件夹压缩包)
marketType: "public" | "enterprise"
visibility: "public" | "private" | "enterprise"
```

**处理流程**:
1. 接收上传文件
2. 解压到临时目录
3. 执行结构校验
4. 安全检测
5. 存储文件
6. 创建Skill记录

**响应**:
```json
{
  "message": "Skill上传成功",
  "skill": {
    "id": "skill_id",
    "name": "skill-name",
    "version": "1.0.0",
    "status": "pending"
  },
  "validation": {
    "passed": true,
    "warnings": []
  }
}
```

**错误响应**:
```json
{
  "error": "Skill结构校验失败",
  "details": [
    "缺少 skill.json 清单文件",
    "入口文件 src/index.js 不存在"
  ]
}
```
