# SkillHub 后端 - 权限系统设计

## 1. 权限系统设计

### 1.1 市场类型定义

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

### 1.2 用户角色定义

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

### 1.3 权限矩阵

#### 1.3.1 公开市场权限

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
| 编辑他人Skill | YES | NO | NO | NO | NO |
| 删除他人Skill | YES | NO | NO | NO | NO |
| 浏览提示词列表 | YES | YES | YES | YES | YES |
| 查看提示词详情 | YES | YES | YES | YES | YES |
| 下载提示词 | YES | YES | YES | YES | YES |
| 收藏提示词 | YES | YES | YES | YES | NO |
| 点赞提示词 | YES | YES | YES | YES | NO |
| 评分提示词 | YES | YES | YES | YES | NO |
| 评论提示词 | YES | YES | YES | YES | NO |
| 上传提示词 | YES | YES | YES | NO | NO |
| 编辑自己的提示词 | YES | YES | YES | NO | NO |
| 删除自己的提示词 | YES | YES | YES | NO | NO |
| 编辑他人提示词 | YES | NO | NO | NO | NO |
| 删除他人提示词 | YES | NO | NO | NO | NO |

**说明**: 
- 匿名用户可以浏览、查看详情和下载公开资源
- 收藏、点赞、评分、评论需要登录
- 企业私有资源仅对同企业成员可见

#### 1.3.2 企业市场权限

| 操作 | admin | enterprise_admin | developer | user | 匿名用户 |
|------|-------|------------------|-----------|------|----------|
| 访问企业市场 | YES | YES | YES(同企业) | YES(同企业) | NO |
| 浏览企业Skill | YES | YES | YES(同企业) | YES(同企业) | NO |
| 下载企业Skill | YES | YES | YES(同企业) | YES(同企业) | NO |
| 上传企业Skill | YES | YES | YES(同企业) | NO | NO |
| 管理企业成员 | YES | YES | NO | NO | NO |
| 管理企业内容 | YES | YES | NO | NO | NO |

### 1.4 资源权限类型

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

### 1.5 Agent智能体权限

为外部智能体提供API访问凭证，支持企业资源隔离。

```typescript
interface AgentPermissions {
  canReadPublic: boolean;      // 读取公开资源
  canReadEnterprise: boolean;  // 读取企业资源
  canDownload: boolean;        // 下载资源
  canUpload: boolean;          // 上传资源
}

interface AgentRateLimit {
  requestsPerMinute: number;   // 每分钟请求数
  requestsPerHour: number;     // 每小时请求数
}
```

| 权限 | 说明 |
|------|------|
| canReadPublic | 是否可以读取公开的Skill和Prompt |
| canReadEnterprise | 是否可以读取企业内部资源(需绑定企业) |
| canDownload | 是否可以下载Skill文件 |
| canUpload | 是否可以上传Skill和Prompt(需单独授权) |

### 1.6 权限验证流程

```
请求进入
    │
    ▼
┌─────────────────┐
│  认证检查       │ ──► 无token/无效token ──► 401 Unauthorized
└────────┬────────┘
         │ 有效token
         ▼
┌─────────────────┐
│  角色检查       │ ──► 角色不匹配 ──► 403 Forbidden
└────────┬────────┘
         │ 角色匹配
         ▼
┌─────────────────┐
│  市场/资源检查  │ ──► 资源不可访问 ──► 403 Forbidden
└────────┬────────┘
         │ 通过
         ▼
    业务逻辑处理
```

### 1.7 权限中间件示例

```typescript
// 角色权限检查
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: '未登录' });
    }
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: '权限不足' });
    }
    
    next();
  };
};

// 企业成员检查
export const requireEnterpriseMember = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ message: '未登录' });
  }
  
  if (user.enterpriseId) {
    return next();
  }
  
  return res.status(403).json({ message: '非企业成员' });
};

// Agent权限检查
export const requireAgentPermission = (
  permission: keyof AgentPermissions
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const agent = (req as AgentAuthRequest).agent;
    
    if (!agent) {
      return res.status(401).json({ message: 'Agent认证失败' });
    }
    
    if (!agent.permissions[permission]) {
      return res.status(403).json({ 
        message: `缺少${permission}权限` 
      });
    }
    
    next();
  };
};
```
