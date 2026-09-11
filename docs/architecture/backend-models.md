# SkillHub 后端 - 数据模型设计

## 1. 数据模型总览

本文档详细描述SkillHub后端的所有数据模型设计，包括用户、企业、Skill、提示词、评分和智能体模型。

## 2. 用户模型 (User)

### 2.1 接口定义

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
```

### 2.2 Schema定义

```typescript
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true, 
    select: false,
    minlength: 8
  },
  role: { 
    type: String, 
    enum: ['admin', 'enterprise_admin', 'developer', 'user'],
    default: 'user'
  },
  enterpriseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enterprise' 
  },
  avatar: { 
    type: String,
    default: null
  },
  bio: { 
    type: String, 
    maxlength: 500 
  },
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

### 2.3 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | ObjectId | 是 | MongoDB主键 |
| username | string | 是 | 用户名，唯一 |
| email | string | 是 | 邮箱，唯一 |
| password | string | 是 | 加密后的密码 |
| role | UserRole | 是 | 用户角色 |
| enterpriseId | ObjectId | 否 | 所属企业ID |
| avatar | string | 否 | 头像URL |
| bio | string | 否 | 个人简介 |
| status | string | 是 | 账户状态 |
| createdAt | Date | 是 | 创建时间 |
| updatedAt | Date | 是 | 更新时间 |
| lastLoginAt | Date | 否 | 最后登录时间 |

## 3. 企业模型 (Enterprise)

### 3.1 接口定义

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
```

### 3.2 Schema定义

```typescript
const enterpriseSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  domain: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true
  },
  logo: { 
    type: String 
  },
  description: { 
    type: String, 
    maxlength: 1000 
  },
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  settings: {
    maxMembers: { 
      type: Number, 
      default: 100 
    },
    maxStorage: { 
      type: Number, 
      default: 10737418240 // 10GB
    },
    allowedDomains: [{ 
      type: String 
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

enterpriseSchema.index({ name: 1 });
enterpriseSchema.index({ domain: 1 });
enterpriseSchema.index({ adminId: 1 });
```

### 3.3 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | ObjectId | 是 | MongoDB主键 |
| name | string | 是 | 企业名称 |
| domain | string | 是 | 企业域名 |
| logo | string | 否 | 企业Logo |
| description | string | 否 | 企业描述 |
| adminId | ObjectId | 是 | 管理员ID |
| members | ObjectId[] | 是 | 企业成员列表 |
| settings | object | 是 | 企业设置 |
| status | string | 是 | 企业状态 |
| createdAt | Date | 是 | 创建时间 |
| updatedAt | Date | 是 | 更新时间 |

## 4. Skill模型

### 4.1 接口定义

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
```

### 4.2 Schema定义

```typescript
const skillSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true, 
    maxlength: 2000 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  version: { 
    type: String, 
    required: true,
    default: '1.0.0'
  },
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
  enterpriseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enterprise' 
  },
  permissions: {
    type: { 
      type: String, 
      enum: ['public', 'private', 'enterprise', 'shared'],
      default: 'public'
    },
    sharedWith: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }]
  },
  tags: [{ 
    type: String 
  }],
  category: { 
    type: String, 
    required: true 
  },
  stats: {
    usageCount: { 
      type: Number, 
      default: 0 
    },
    downloadCount: { 
      type: Number, 
      default: 0 
    },
    avgRating: { 
      type: Number, 
      default: 0 
    },
    ratingCount: { 
      type: Number, 
      default: 0 
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  reviewNote: { 
    type: String 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

skillSchema.index({ name: 'text', description: 'text', tags: 'text' });
skillSchema.index({ author: 1 });
skillSchema.index({ marketType: 1, status: 1 });
skillSchema.index({ enterpriseId: 1 });
skillSchema.index({ category: 1 });
skillSchema.index({ tags: 1 });
```

### 4.3 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | ObjectId | 是 | MongoDB主键 |
| name | string | 是 | Skill名称 |
| description | string | 是 | Skill描述 |
| author | ObjectId | 是 | 作者ID |
| version | string | 是 | 当前版本号 |
| versions | SkillVersion[] | 是 | 版本历史 |
| marketType | MarketType | 是 | 市场类型 |
| enterpriseId | ObjectId | 否 | 企业ID |
| permissions | object | 是 | 权限设置 |
| tags | string[] | 是 | 标签 |
| category | string | 是 | 分类 |
| stats | SkillStats | 是 | 统计数据 |
| status | string | 是 | 审核状态 |
| reviewNote | string | 否 | 审核备注 |
| createdAt | Date | 是 | 创建时间 |
| updatedAt | Date | 是 | 更新时间 |

## 5. 提示词模型 (Prompt)

### 5.1 接口定义

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
```

### 5.2 Schema定义

```typescript
const promptSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  content: { 
    type: String, 
    required: true, 
    maxlength: 50000 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  version: { 
    type: String, 
    required: true,
    default: '1.0.0'
  },
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
  enterpriseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enterprise' 
  },
  category: { 
    type: String, 
    required: true 
  },
  tags: [{ 
    type: String 
  }],
  permissions: {
    type: { 
      type: String, 
      enum: ['public', 'private', 'enterprise', 'shared'],
      default: 'public'
    },
    sharedWith: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }]
  },
  stats: {
    usageCount: { 
      type: Number, 
      default: 0 
    },
    avgRating: { 
      type: Number, 
      default: 0 
    },
    ratingCount: { 
      type: Number, 
      default: 0 
    },
    performanceMetrics: {
      responseTime: { 
        type: Number, 
        default: 0 
      },
      relevanceScore: { 
        type: Number, 
        default: 0 
      },
      accuracyScore: { 
        type: Number, 
        default: 0 
      },
      sampleSize: { 
        type: Number, 
        default: 0 
      }
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  securityCheck: {
    passed: { 
      type: Boolean, 
      default: false 
    },
    checkedAt: { 
      type: Date 
    },
    issues: [{ 
      type: String 
    }]
  },
  reviewNote: { 
    type: String 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

promptSchema.index({ name: 'text', content: 'text', tags: 'text' });
promptSchema.index({ author: 1 });
promptSchema.index({ marketType: 1, status: 1 });
promptSchema.index({ enterpriseId: 1 });
promptSchema.index({ category: 1 });
promptSchema.index({ tags: 1 });
```

### 5.3 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | ObjectId | 是 | MongoDB主键 |
| name | string | 是 | 提示词名称 |
| content | string | 是 | 提示词内容 |
| author | ObjectId | 是 | 作者ID |
| version | string | 是 | 当前版本号 |
| versions | PromptVersion[] | 是 | 版本历史 |
| marketType | MarketType | 是 | 市场类型 |
| enterpriseId | ObjectId | 否 | 企业ID |
| category | string | 是 | 分类 |
| tags | string[] | 是 | 标签 |
| permissions | object | 是 | 权限设置 |
| stats | PromptStats | 是 | 统计数据 |
| status | string | 是 | 审核状态 |
| securityCheck | object | 是 | 安全检查结果 |
| reviewNote | string | 否 | 审核备注 |
| createdAt | Date | 是 | 创建时间 |
| updatedAt | Date | 是 | 更新时间 |

## 6. 评分模型 (Rating)

### 6.1 接口定义

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
```

### 6.2 Schema定义

```typescript
const ratingSchema = new mongoose.Schema({
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
  score: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    maxlength: 500 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ratingSchema.index({ userId: 1, resourceType: 1, resourceId: 1 }, { unique: true });
ratingSchema.index({ resourceType: 1, resourceId: 1 });
```

### 6.3 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | ObjectId | 是 | MongoDB主键 |
| userId | ObjectId | 是 | 评分用户ID |
| resourceType | string | 是 | 资源类型 |
| resourceId | ObjectId | 是 | 资源ID |
| score | number | 是 | 评分(1-5) |
| comment | string | 否 | 评语 |
| createdAt | Date | 是 | 创建时间 |
| updatedAt | Date | 是 | 更新时间 |

## 7. 智能体模型 (Agent)

### 7.1 接口定义

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
```

### 7.2 Schema定义

```typescript
const agentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    maxlength: 100,
    trim: true
  },
  description: { 
    type: String, 
    maxlength: 500 
  },
  enterpriseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enterprise',
    default: null 
  },
  agentId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  agentToken: { 
    type: String, 
    required: true,
    select: false
  },
  tokenExpiresAt: { 
    type: Date, 
    required: true 
  },
  permissions: {
    canReadPublic: { 
      type: Boolean, 
      default: true 
    },
    canReadEnterprise: { 
      type: Boolean, 
      default: false 
    },
    canDownload: { 
      type: Boolean, 
      default: true 
    },
    canUpload: { 
      type: Boolean, 
      default: false 
    },
  },
  rateLimit: {
    requestsPerMinute: { 
      type: Number, 
      default: 60 
    },
    requestsPerHour: { 
      type: Number, 
      default: 1000 
    },
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  lastAccessAt: { 
    type: Date 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

agentSchema.index({ agentId: 1 });
agentSchema.index({ enterpriseId: 1 });
agentSchema.index({ status: 1 });
```

### 7.3 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| _id | ObjectId | 是 | MongoDB主键 |
| name | string | 是 | Agent名称 |
| description | string | 否 | Agent描述 |
| enterpriseId | ObjectId | 否 | 所属企业ID |
| agentId | string | 是 | Agent唯一标识符 |
| agentToken | string | 是 | Agent访问令牌(加密存储) |
| tokenExpiresAt | Date | 是 | Token过期时间 |
| permissions | object | 是 | 权限配置 |
| rateLimit | object | 是 | 速率限制 |
| status | string | 是 | Agent状态 |
| lastAccessAt | Date | 否 | 最后访问时间 |
| createdAt | Date | 是 | 创建时间 |
| updatedAt | Date | 是 | 更新时间 |

## 8. 模型关系图

```
┌─────────────┐       ┌─────────────┐
│    User     │       │  Enterprise │
└──────┬──────┘       └──────┬──────┘
       │                      │
       │ 1                    │ 1
       ├──────────────────────┤
       │                      │
       │              ┌───────┴───────┐
       │              │               │
       ▼              ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│    Skill    │ │   Prompt    │ │    Agent    │
└──────┬──────┘ └──────┬──────┘ └─────────────┘
       │              │
       │              │
       └──────┬───────┘
              │
              ▼
       ┌─────────────┐
       │   Rating    │
       └─────────────┘
```

## 9. 索引设计总结

| 模型 | 索引字段 | 类型 | 用途 |
|------|----------|------|------|
| User | username, email | unique | 快速查找 |
| User | enterpriseId | normal | 企业成员查询 |
| Enterprise | name, domain | unique | 快速查找 |
| Skill | (name,description,tags) | text | 全文搜索 |
| Skill | author, marketType+status, enterpriseId | normal | 筛选查询 |
| Prompt | (name,content,tags) | text | 全文搜索 |
| Prompt | author, marketType+status, enterpriseId | normal | 筛选查询 |
| Rating | (userId,resourceType,resourceId) | unique | 防止重复评分 |
| Agent | agentId, enterpriseId, status | normal | 查询优化 |
