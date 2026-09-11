# SkillHub 后端 - 环境变量配置

## 1. 环境变量总览

本文档详细描述SkillHub后端的所有环境变量配置。

## 2. 环境变量文件

### 2.1 .env 文件结构

```env
# ===========================================
# 服务配置
# ===========================================
PORT=3001
NODE_ENV=development

# ===========================================
# 数据库配置
# ===========================================
MONGO_URI=mongodb://localhost:27017/skillhub

# ===========================================
# JWT 配置
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret-change-in-production
JWT_REFRESH_EXPIRES_IN=30d

# ===========================================
# 存储配置
# ===========================================
STORAGE_TYPE=local
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=skillhub
MINIO_USE_SSL=false

# ===========================================
# 安全配置
# ===========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
UPLOAD_RATE_LIMIT_MAX=10

# ===========================================
# 企业配置
# ===========================================
ENTERPRISE_DEFAULT_MAX_MEMBERS=100
ENTERPRISE_DEFAULT_MAX_STORAGE=10737418240
ENTERPRISE_ALLOW_REGISTER=true

# ===========================================
# 邮件配置
# ===========================================
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM=SkillHub <noreply@example.com>

# ===========================================
# 日志配置
# ===========================================
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# ===========================================
# CORS 配置
# ===========================================
CORS_ORIGIN=http://localhost:5173

# ===========================================
# Redis 配置 (可选)
# ===========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## 3. 配置说明

### 3.1 服务配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3001 | API服务端口 |
| NODE_ENV | development | 运行环境 |

### 3.2 数据库配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| MONGO_URI | - | MongoDB连接字符串 |

### 3.3 JWT配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| JWT_SECRET | - | JWT签名密钥(必须修改) |
| JWT_EXPIRES_IN | 7d | Access Token过期时间 |
| JWT_REFRESH_SECRET | - | Refresh Token签名密钥 |
| JWT_REFRESH_EXPIRES_IN | 30d | Refresh Token过期时间 |

### 3.4 存储配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| STORAGE_TYPE | local | 存储类型: local/minio/s3 |
| MINIO_ENDPOINT | localhost | MinIO服务地址 |
| MINIO_PORT | 9000 | MinIO服务端口 |
| MINIO_ACCESS_KEY | - | MinIO访问密钥 |
| MINIO_SECRET_KEY | - | MinIO密钥 |
| MINIO_BUCKET | skillhub | 存储桶名称 |
| MINIO_USE_SSL | false | 是否使用SSL |

### 3.5 安全配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| RATE_LIMIT_WINDOW_MS | 900000 | 限流时间窗口(毫秒) |
| RATE_LIMIT_MAX | 100 | 每窗口最大请求数 |
| UPLOAD_RATE_LIMIT_MAX | 10 | 每小时最大上传次数 |

### 3.6 企业配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| ENTERPRISE_DEFAULT_MAX_MEMBERS | 100 | 默认最大成员数 |
| ENTERPRISE_DEFAULT_MAX_STORAGE | 10737418240 | 默认最大存储(10GB) |
| ENTERPRISE_ALLOW_REGISTER | true | 是否允许创建企业 |

### 3.7 邮件配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| SMTP_HOST | - | SMTP服务器地址 |
| SMTP_PORT | 587 | SMTP服务器端口 |
| SMTP_USER | - | SMTP用户名 |
| SMTP_PASS | - | SMTP密码 |
| SMTP_FROM | - | 发件人地址 |

### 3.8 日志配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| LOG_LEVEL | info | 日志级别: debug/info/warn/error |
| LOG_FILE_PATH | ./logs | 日志文件目录 |

### 3.9 CORS配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| CORS_ORIGIN | - | 允许的跨域来源 |

### 3.10 Redis配置(可选)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| REDIS_HOST | localhost | Redis服务地址 |
| REDIS_PORT | 6379 | Redis服务端口 |
| REDIS_PASSWORD | - | Redis密码 |
| REDIS_DB | 0 | Redis数据库编号 |

## 4. 配置文件

### 4.1 基础配置 (config/index.ts)

```typescript
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/skillhub',
  },
  
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    minio: {
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
      bucket: process.env.MINIO_BUCKET || 'skillhub',
      useSSL: process.env.MINIO_USE_SSL === 'true',
    },
  },
  
  security: {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      uploadMax: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '10', 10),
    },
  },
  
  enterprise: {
    defaultMaxMembers: parseInt(process.env.ENTERPRISE_DEFAULT_MAX_MEMBERS || '100', 10),
    defaultMaxStorage: parseInt(process.env.ENTERPRISE_DEFAULT_MAX_STORAGE || '10737418240', 10),
    allowRegister: process.env.ENTERPRISE_ALLOW_REGISTER === 'true',
  },
  
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
  
  log: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};
```

### 4.2 密码重置配置 (config/auth.ts)

```typescript
export const authConfig = {
  passwordReset: {
    tokenExpiresIn: 3600000, // 1小时
    rateLimit: {
      windowMs: 3600000, // 1小时
      max: 3, // 每小时最多3次
    },
  },
  
  emailVerification: {
    tokenExpiresIn: 86400000, // 24小时
  },
  
  login: {
    rateLimit: {
      windowMs: 900000, // 15分钟
      max: 5, // 最多5次尝试
    },
  },
};
```

### 4.3 上传配置 (config/upload.ts)

```typescript
export const uploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  
  allowedExtensions: ['.js', '.ts', '.json', '.zip', '.md'],
  
  allowedMimeTypes: [
    'application/javascript',
    'application/typescript',
    'application/json',
    'application/zip',
    'text/markdown',
  ],
  
  virusScanEnabled: process.env.VIRUS_SCAN_ENABLED === 'true',
};
```

## 5. 开发环境配置

### 5.1 .env.development

```env
PORT=3001
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/skillhub

JWT_SECRET=dev-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=dev-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

STORAGE_TYPE=local

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
UPLOAD_RATE_LIMIT_MAX=10

LOG_LEVEL=debug

CORS_ORIGIN=http://localhost:5173
```

### 5.2 .env.production

```env
PORT=3001
NODE_ENV=production

MONGO_URI=mongodb://your-production-mongo-url

JWT_SECRET=<generate-random-secret>
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=<generate-random-secret>
JWT_REFRESH_EXPIRES_IN=7d

STORAGE_TYPE=minio
MINIO_ENDPOINT=minio.yourdomain.com
MINIO_PORT=9000
MINIO_ACCESS_KEY=<your-access-key>
MINIO_SECRET_KEY=<your-secret-key>
MINIO_BUCKET=skillhub
MINIO_USE_SSL=true

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=60
UPLOAD_RATE_LIMIT_MAX=5

LOG_LEVEL=warn
LOG_FILE_PATH=/var/log/skillhub

CORS_ORIGIN=https://yourdomain.com

REDIS_HOST=redis.yourdomain.com
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>
```

## 6. TypeScript类型定义

```typescript
// types/config.ts

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  
  database: {
    uri: string;
  };
  
  storage: {
    type: 'local' | 'minio' | 's3';
    minio?: {
      endpoint: string;
      port: number;
      accessKey: string;
      secretKey: string;
      bucket: string;
      useSSL: boolean;
    };
  };
  
  security: {
    rateLimit: {
      windowMs: number;
      max: number;
      uploadMax: number;
    };
  };
  
  enterprise: {
    defaultMaxMembers: number;
    defaultMaxStorage: number;
    allowRegister: boolean;
  };
  
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  
  log: {
    level: 'debug' | 'info' | 'warn' | 'error';
    filePath: string;
  };
  
  cors: {
    origin: string;
  };
  
  redis?: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
}
```
