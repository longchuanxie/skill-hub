# SkillHub 后端 - 中间件设计

## 1. 中间件总览

本文档详细描述SkillHub后端的所有中间件设计，包括认证、角色权限、企业成员验证、资源所有权验证、速率限制和Agent认证中间件。

## 2. 认证中间件

### 2.1 JWT认证中间件

用户身份验证，基于JWT token。

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
```

### 2.2 必需认证中间件

```typescript
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ 
      message: '未提供认证令牌',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
    req.user = { ...decoded, _id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: '无效的认证令牌',
      code: 'TOKEN_INVALID'
    });
  }
};
```

### 2.3 可选认证中间件

```typescript
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

### 2.4 Token解析流程

```
请求进入
    │
    ▼
提取 Authorization 头
    │
    ▼
检查 Bearer token 格式
    │
    ├── 无token ──► 401 Unauthorized (必需认证)
    │
    ▼
验证 JWT 签名
    │
    ├── 无效签名 ──► 401 Unauthorized
    │
    ├── Token过期 ──► 401 Unauthorized (TOKEN_EXPIRED)
    │
    ▼
解析 payload
    │
    ▼
附加到 req.user
    │
    ▼
传递给下一个中间件
```

## 3. 角色权限中间件

### 3.1 角色检查中间件

```typescript
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: '未登录',
        code: 'UNAUTHORIZED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: '权限不足',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

// 预定义角色中间件
export const requireAdmin = requireRole('admin');
export const requireEnterpriseAdmin = requireRole('admin', 'enterprise_admin');
export const requireDeveloper = requireRole('admin', 'enterprise_admin', 'developer');
```

### 3.2 角色权限映射

| 中间件 | 允许角色 |
|--------|----------|
| requireAdmin | admin |
| requireEnterpriseAdmin | admin, enterprise_admin |
| requireDeveloper | admin, enterprise_admin, developer |
| requireRole('user') | user, developer, enterprise_admin, admin |

### 3.3 权限检查流程

```
请求进入
    │
    ▼
检查 req.user 是否存在
    │
    ├── 不存在 ──► 401 Unauthorized
    │
    ▼
检查用户角色是否在允许列表中
    │
    ├── 不在 ──► 403 Forbidden
    │
    ▼
通过检查
    │
    ▼
传递给下一个中间件
```

## 4. 企业成员验证中间件

### 4.1 企业成员检查

```typescript
export const requireEnterpriseMember = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const enterpriseId = req.params.enterpriseId || req.body.enterpriseId;
  
  if (!req.user) {
    return res.status(401).json({ 
      message: '未登录',
      code: 'UNAUTHORIZED'
    });
  }
  
  // 管理员可以访问所有企业
  if (req.user.role === 'admin') {
    return next();
  }
  
  // 检查用户是否属于目标企业
  if (req.user.enterpriseId !== enterpriseId) {
    return res.status(403).json({ 
      message: '无权访问该企业资源',
      code: 'ENTERPRISE_ACCESS_DENIED'
    });
  }
  
  next();
};
```

### 4.2 企业资源访问控制

```typescript
export const requireEnterpriseAccess = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: '未登录',
      code: 'UNAUTHORIZED'
    });
  }
  
  const resourceEnterpriseId = req.params.enterpriseId || req.body.enterpriseId;
  
  // 公开资源无需检查
  if (!resourceEnterpriseId) {
    return next();
  }
  
  // 管理员可以访问所有
  if (req.user.role === 'admin') {
    return next();
  }
  
  // 检查用户是否属于该企业
  if (req.user.enterpriseId !== resourceEnterpriseId) {
    return res.status(403).json({ 
      message: '无权访问该企业资源',
      code: 'ENTERPRISE_ACCESS_DENIED'
    });
  }
  
  next();
};
```

## 5. 资源所有权验证中间件

### 5.1 资源所有权检查

```typescript
import Skill from '../models/Skill';
import Prompt from '../models/Prompt';

export const requireResourceOwner = (resourceType: 'skill' | 'prompt') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params.id;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        message: '未登录',
        code: 'UNAUTHORIZED'
      });
    }
    
    const Model = resourceType === 'skill' ? Skill : Prompt;
    const resource = await Model.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({ 
        message: '资源不存在',
        code: 'NOT_FOUND'
      });
    }
    
    // 管理员可以操作所有资源
    if (user.role === 'admin') {
      return next();
    }
    
    // 作者可以操作自己的资源
    if (resource.author.toString() === user._id) {
      return next();
    }
    
    // 企业管理员可以操作企业资源
    if (user.role === 'enterprise_admin' && 
        resource.enterpriseId?.toString() === user.enterpriseId) {
      return next();
    }
    
    return res.status(403).json({ 
      message: '无权操作该资源',
      code: 'RESOURCE_ACCESS_DENIED'
    });
  };
};
```

### 5.2 权限检查逻辑

| 用户角色 | 作者本人 | 同企业成员 | 其他用户 |
|----------|----------|------------|----------|
| admin | YES | YES | YES |
| enterprise_admin | YES | YES | NO |
| developer | YES | NO | NO |
| user | YES | NO | NO |

## 6. 速率限制中间件

### 6.1 API通用限流

```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 100,                    // 最多100次请求
  message: { 
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 管理员跳过限流
    return req.user?.role === 'admin';
  }
});
```

### 6.2 上传限流

```typescript
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1小时
  max: 10,                    // 最多10次上传
  message: { 
    message: '上传次数过多，请稍后再试',
    code: 'UPLOAD_LIMIT_EXCEEDED'
  }
});
```

### 6.3 认证限流

```typescript
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 5,                     // 最多5次登录尝试
  message: { 
    message: '登录尝试次数过多，请稍后再试',
    code: 'AUTH_LIMIT_EXCEEDED'
  }
});
```

### 6.4 限流配置说明

| 限流器 | 窗口时间 | 最大请求 | 用途 |
|--------|----------|----------|------|
| apiLimiter | 15分钟 | 100 | 通用API |
| uploadLimiter | 1小时 | 10 | 文件上传 |
| authLimiter | 15分钟 | 5 | 登录注册 |

## 7. Agent认证中间件

### 7.1 Agent认证接口定义

```typescript
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
```

### 7.2 Agent身份验证

```typescript
import Agent from '../models/Agent';

export const requireAgentAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const agentId = req.headers['x-agent-id'] as string;
  const agentToken = req.headers['x-agent-token'] as string;
  
  // 检查必需的头信息
  if (!agentId || !agentToken) {
    return res.status(401).json({ 
      message: '缺少Agent认证信息',
      code: 'AGENT_AUTH_REQUIRED'
    });
  }
  
  // 查找Agent
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
  
  // 检查Token过期
  if (agent.tokenExpiresAt < new Date()) {
    return res.status(401).json({ 
      message: 'Agent Token已过期',
      code: 'AGENT_TOKEN_EXPIRED'
    });
  }
  
  // 验证Token
  const isValidToken = await bcrypt.compare(agentToken, agent.agentToken);
  if (!isValidToken) {
    return res.status(401).json({ 
      message: 'Agent Token无效',
      code: 'AGENT_TOKEN_INVALID'
    });
  }
  
  // 附加Agent信息到请求
  (req as AgentAuthRequest).agent = {
    _id: agent._id.toString(),
    agentId: agent.agentId,
    name: agent.name,
    enterpriseId: agent.enterpriseId?.toString(),
    permissions: agent.permissions,
    rateLimit: agent.rateLimit,
  };
  
  // 更新最后访问时间
  agent.lastAccessAt = new Date();
  await agent.save();
  
  next();
};
```

### 7.3 企业资源访问权限检查

```typescript
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

### 7.4 Agent权限检查

```typescript
export const requireAgentPermission = (
  permission: keyof AgentAuthRequest['agent']['permissions']
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const agent = (req as AgentAuthRequest).agent;
    
    if (!agent) {
      return res.status(401).json({ 
        message: 'Agent认证失败',
        code: 'AGENT_AUTH_REQUIRED'
      });
    }
    
    if (!agent.permissions[permission]) {
      return res.status(403).json({ 
        message: `缺少${permission}权限`,
        code: 'AGENT_PERMISSION_DENIED'
      });
    }
    
    next();
  };
};

// 预定义权限中间件
export const requireAgentDownload = requireAgentPermission('canDownload');
export const requireAgentUpload = requireAgentPermission('canUpload');
```

### 7.5 Agent认证流程

```
Agent请求进入
    │
    ▼
提取 X-Agent-Id 和 X-Agent-Token 头
    │
    ├── 任一缺失 ──► 401 AGENT_AUTH_REQUIRED
    │
    ▼
查找Agent记录
    │
    ├── 不存在/已禁用 ──► 401 AGENT_NOT_FOUND
    │
    ▼
检查Token有效期
    │
    ├── 已过期 ──► 401 AGENT_TOKEN_EXPIRED
    │
    ▼
验证Token
    │
    ├── 无效 ──► 401 AGENT_TOKEN_INVALID
    │
    ▼
附加Agent信息到请求
    │
    ▼
传递给下一个中间件
```

## 8. 中间件使用示例

### 8.1 Skill路由中间件配置

```typescript
import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { requireDeveloper } from '../middleware/role';
import { requireResourceOwner } from '../middleware/resource';
import { apiLimiter, uploadLimiter } from '../middleware/rateLimit';
import * as skillController from '../controllers/skill.controller';

const router = Router();

// 获取Skill列表 - 公开访问
router.get('/', 
  optionalAuthMiddleware, 
  apiLimiter, 
  skillController.list
);

// 获取Skill详情 - 根据权限
router.get('/:id', 
  optionalAuthMiddleware, 
  skillController.get
);

// 创建Skill - 需要开发者权限
router.post('/', 
  authMiddleware, 
  requireDeveloper, 
  uploadLimiter, 
  skillController.create
);

// 更新Skill - 需要所有权
router.put('/:id', 
  authMiddleware, 
  requireResourceOwner('skill'), 
  skillController.update
);

// 删除Skill - 需要所有权
router.delete('/:id', 
  authMiddleware, 
  requireResourceOwner('skill'), 
  skillController.delete
);

export default router;
```

### 8.2 Agent路由中间件配置

```typescript
import { Router } from 'express';
import { requireAgentAuth, requireEnterpriseAccess, requireAgentPermission } from '../middleware/agent';
import * as agentController from '../controllers/agent.controller';

const router = Router();

// 获取Agent配置
router.get('/config', 
  requireAgentAuth, 
  agentController.getConfig
);

// 获取公开Skill列表
router.get('/skills', 
  requireAgentAuth, 
  agentController.listPublicSkills
);

// 获取企业Skill列表
router.get('/enterprise/skills', 
  requireAgentAuth, 
  requireEnterpriseAccess, 
  agentController.listEnterpriseSkills
);

// 下载Skill
router.get('/skills/:id/download', 
  requireAgentAuth, 
  requireAgentPermission('canDownload'), 
  agentController.downloadSkill
);

// 上传Skill
router.post('/skills', 
  requireAgentAuth, 
  requireAgentPermission('canUpload'), 
  agentController.uploadSkill
);

export default router;
```
