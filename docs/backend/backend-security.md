# SkillHub 后端 - 安全设计

## 1. 安全设计总览

本文档详细描述SkillHub后端的安全设计，包括已实现的安全措施和安全建议。

## 2. 已实现的安全措施

### 2.1 认证安全

| 安全措施 | 说明 | 实现方式 |
|----------|------|----------|
| JWT认证 | 基于Token的无状态认证 | jsonwebtoken库 |
| 密码加密 | bcryptjs加盐哈希 | bcryptjs库 |
| Token刷新 | 刷新Token机制 | 分离access/refresh token |
| Token过期 | 自动过期机制 | JWT exp声明 |

### 2.2 授权安全

| 安全措施 | 说明 | 实现方式 |
|----------|------|----------|
| 角色权限控制 | 基于角色的访问控制 | RBAC中间件 |
| 资源所有权验证 | 验证操作者是否为资源所有者 | requireResourceOwner中间件 |
| 企业资源隔离 | 企业数据仅企业内部访问 | enterpriseId检查 |
| Agent权限控制 | Agent API权限细分 | Agent权限中间件 |

### 2.3 API安全

| 安全措施 | 说明 | 实现方式 |
|----------|------|----------|
| 速率限制 | 防止接口滥用 | express-rate-limit |
| 请求验证 | 参数格式验证 | Zod/Joi |
| 文件类型限制 | 仅允许特定类型文件上传 | multer配置 |
| 内容安全检测 | 检测恶意代码 | 正则模式匹配 |

### 2.4 数据安全

| 安全措施 | 说明 | 实现方式 |
|----------|------|----------|
| 参数化查询 | 防止SQL注入 | Mongoose ODM |
| 输入过滤 | XSS防护 | DOMPurify |
| CORS控制 | 跨域请求限制 | cors中间件 |
| 安全Headers | HTTP安全头 | helmet中间件 |

## 3. 安全中间件

### 3.1 Helmet中间件

```typescript
import helmet from 'helmet';

app.use(helmet());

// 具体配置
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
  },
}));

app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
}));
```

### 3.2 CORS中间件

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### 3.3 输入验证中间件

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(30, '用户名最多30个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  email: z.string()
    .email('邮箱格式不正确'),
  password: z.string()
    .min(8, '密码至少8个字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字'),
});

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: '参数验证失败',
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};
```

## 4. 安全检测

### 4.1 提示词安全检测

检测提示词中是否存在恶意代码或提示词注入攻击。

```typescript
const DANGEROUS_PATTERNS = [
  // 代码执行类
  { pattern: /eval\s*\(/gi, message: '禁止使用eval函数' },
  { pattern: /Function\s*\(/gi, message: '禁止使用Function构造函数' },
  
  // 进程/系统操作类
  { pattern: /process\.exit/gi, message: '禁止调用process.exit' },
  { pattern: /exec\s*\(/gi, message: '禁止使用exec函数' },
  
  // 模块导入类
  { pattern: /require\s*\(\s*['"]child_process['"]\s*\)/gi, message: '禁止导入child_process模块' },
  { pattern: /require\s*\(\s*['"]fs['"]\s*\)/gi, message: '禁止导入fs模块' },
  
  // 提示词注入类
  { pattern: /ignore\s+previous\s+instructions/gi, message: '检测到潜在的提示词注入' },
  { pattern: /system\s*:\s*/gi, message: '检测到潜在的角色劫持' },
];

export async function detectSecurityIssues(content: string): Promise<string[]> {
  const issues: string[] = [];
  
  for (const { pattern, message } of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      issues.push(message);
    }
  }
  
  return issues;
}
```

### 4.2 文件安全检测

```typescript
const MALICIOUS_PATTERNS = [
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /require\s*\(\s*['"]child_process['"]\s*\)/gi,
  /require\s*\(\s*['"]fs['"]\s*\)/gi,
  /process\.binding/gi,
  /process\.dlopen/gi,
];

export async function scanFile(filePath: string): Promise<boolean> {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      return true; // 发现恶意代码
    }
  }
  
  return false;
}
```

## 5. Agent安全

### 5.1 Agent认证流程

```typescript
// 1. Agent注册 - 需要管理员授权码
// 2. Token生成 - 使用bcrypt加密存储
// 3. Token验证 - 每次请求验证
// 4. 权限细分 - 读写下载上传权限分离
// 5. 速率限制 - 按Agent配置限流
```

### 5.2 Agent权限模型

```typescript
interface AgentSecurityConfig {
  permissions: {
    canReadPublic: boolean;      // 读取公开资源
    canReadEnterprise: boolean;  // 读取企业资源
    canDownload: boolean;       // 下载资源
    canUpload: boolean;         // 上传资源
  };
  
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  
  ipWhitelist?: string[];       // IP白名单
  allowedActions?: string[];    // 允许的操作列表
}
```

## 6. 待实现的安全措施

### 6.1 计划中的安全功能

| 安全措施 | 说明 | 优先级 |
|----------|------|--------|
| 病毒扫描 | 上传文件病毒扫描 | 高 |
| 审计日志 | 记录关键操作日志 | 高 |
| IP白名单 | 企业市场IP访问控制 | 中 |
| 双因素认证 | 敏感操作二次验证 | 中 |
| 数据加密 | 敏感数据加密存储 | 中 |
| API签名 | 请求签名验证 | 低 |

### 6.2 病毒扫描集成

```typescript
import clamd from 'clamd';

const scanner = clamd.createScanner('localhost', 3310);

export async function scanForVirus(filePath: string): Promise<boolean> {
  try {
    const result = await scanner.scanFile(filePath);
    return result.includes('OK');
  } catch (error) {
    console.error('Virus scan error:', error);
    return false;
  }
}
```

### 6.3 审计日志

```typescript
import winston from 'winston';

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'audit.log' }),
  ],
});

export function logAudit(action: string, userId: string, details: object) {
  auditLogger.info({
    action,
    userId,
    details,
    timestamp: new Date().toISOString(),
  });
}
```

## 7. 安全检查清单

### 7.1 开发安全检查

- [ ] 所有密码使用bcrypt加密
- [ ] JWT token设置过期时间
- [ ] API接口实现速率限制
- [ ] 文件上传验证文件类型
- [ ] 用户输入进行验证和过滤
- [ ] 使用参数化查询
- [ ] 错误信息不暴露敏感信息
- [ ] 生产环境关闭调试模式
- [ ] 使用HTTPS
- [ ] 配置安全HTTP头

### 7.2 部署安全检查

- [ ] 修改默认密码和密钥
- [ ] 配置CORS白名单
- [ ] 设置合适的文件上传限制
- [ ] 启用防火墙
- [ ] 配置日志监控
- [ ] 定期更新依赖
- [ ] 备份数据库
- [ ] 配置入侵检测

## 8. 响应安全

### 8.1 错误响应

```typescript
// 避免暴露敏感信息
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
    public isOperational: boolean = true
  ) {
    super(message);
    
    // 生产环境不暴露堆栈
    if (process.env.NODE_ENV === 'production') {
      Object.defineProperty(this, 'stack', { value: '' });
    }
  }
}
```

### 8.2 安全响应头

```typescript
// 安全响应头配置
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```
