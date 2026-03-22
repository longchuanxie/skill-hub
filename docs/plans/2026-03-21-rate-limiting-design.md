# API 防刷限流设计方案

## 1. 概述

### 1.1 设计目标
为后端API提供一套标准的防刷限流方案，有效防止恶意刷接口、暴力请求等行为，保障服务稳定性。

### 1.2 核心原则
- **分层限流**：外部API vs 页面API 差异化处理
- **自适应存储**：内存优先，Redis备选（支持分布式扩展）
- **滑动窗口**：使用滑动窗口算法替代固定窗口，减少边界突发问题
- **零侵入性**：通过装饰器/Middleware注解方式集成，不影响现有业务代码

---

## 2. 架构设计

### 2.1 限流策略矩阵

| API类型 | 限流Key | 限制窗口 | 推荐阈值 | 典型场景 |
|---------|--------|----------|----------|----------|
| 外部/开放API | API Key | 滑动窗口 | 100次/分钟 | 第三方集成、公开数据获取 |
| 登录/注册 | IP地址 | 滑动窗口 | 10次/分钟 | 用户登录、注册、验证码请求 |
| 页面API(已认证) | 用户ID | 滑动窗口 | 60次/分钟 | 业务数据读写 |
| 页面API(特殊) | 用户ID | 滑动窗口 | 20次/分钟 | 创建/删除/支付等敏感操作 |

### 2.2 存储策略

```
┌─────────────────────────────────────────────────────┐
│                   Rate Limiter                       │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐      ┌─────────────┐               │
│  │  InMemory   │ ──── │   Redis     │               │
│  │  Store      │      │   Store     │               │
│  └─────────────┘      └─────────────┘               │
│         │                   │                       │
│         └─────────┬─────────┘                       │
│                   ▼                                  │
│         ┌─────────────────┐                         │
│         │  Sliding Window │                         │
│         │  Rate Limiter   │                         │
│         └─────────────────┘                         │
└─────────────────────────────────────────────────────┘
```

**存储选择逻辑**：
1. 优先使用内存存储（低延迟、高性能）
2. 当检测到Redis可用时，自动切换到Redis（支持多实例共享）
3. Redis故障时，优雅降级回内存存储

### 2.3 滑动窗口算法

```
时间轴 ──────────────────────────────────────────────────►

        ◄───── windowSize(60s) ─────►
        ┌──────────────────────────────┐
        │    Historical Requests      │  Current
  ──────┼──────────────────────────────┼─────────►
  T-60s │ ████ ██ █████ ██ ████████ █ │ ████
        └──────────────────────────────┘
                                    ↑
                              Current Request

计算：窗口内所有请求的加权求和
优点：避免固定窗口的边界突变问题
```

---

## 3. 核心组件

### 3.1 目录结构

```
backend/src/
├── middleware/
│   └── rateLimit/
│       ├── index.ts                    # 主入口
│       ├── RateLimiter.ts              # 抽象基类
│       ├── InMemoryRateLimiter.ts      # 内存实现
│       ├── RedisRateLimiter.ts         # Redis实现
│       ├── RateLimitOptions.ts         # 配置类型
│       ├── RateLimitStrategy.ts        # 策略枚举
│       ├── RateLimitContext.ts         # 限流上下文
│       └── decorators/
│           ├── rateLimit.ts            # 限流装饰器
│           └── RateLimitType.ts        # API类型枚举
```

### 3.2 API类型定义

```typescript
enum ApiType {
  EXTERNAL = 'external',      // 外部API (API Key)
  PUBLIC = 'public',          // 公共API (IP限流): 登录/注册
  AUTHENTICATED = 'auth',    // 已认证API (User ID): 业务操作
  SENSITIVE = 'sensitive',   // 敏感API (User ID): 创建/删除
}
```

### 3.3 限流配置

```typescript
interface RateLimitConfig {
  windowSize: number;        // 窗口大小(毫秒)
  maxRequests: number;       // 最大请求数
  keyGenerator: KeyGenerator; // Key生成函数
  skipFailedRequests: boolean; // 失败请求是否计数
  skip: (req: Request) => boolean; // 跳过条件
}
```

---

## 4. API分类与路由映射

### 4.1 路由配置

```typescript
// 登录/注册类 - 按IP限流
POST   /api/auth/login       → ApiType.PUBLIC
POST   /api/auth/register    → ApiType.PUBLIC
POST   /api/auth/verify-code → ApiType.PUBLIC
POST   /api/auth/reset-pwd   → ApiType.PUBLIC

// 外部开放API - 按API Key限流
GET    /api/skills/public    → ApiType.EXTERNAL
GET    /api/agents/public    → ApiType.EXTERNAL
POST   /api/agents/invoke    → ApiType.EXTERNAL

// 已认证页面API - 按用户ID限流
GET    /api/skills           → ApiType.AUTHENTICATED
POST   /api/skills           → ApiType.SENSITIVE
DELETE /api/skills/:id       → ApiType.SENSITIVE
PUT    /api/skills/:id       → ApiType.AUTHENTICATED
```

### 4.2 限流响应头

```
X-RateLimit-Limit: 60           # 当前窗口最大请求数
X-RateLimit-Remaining: 45      # 剩余可用请求数
X-RateLimit-Reset: 1642089600  # 窗口重置时间戳(Unix)
Retry-After: 30                 # 限流后需等待秒数
```

---

## 5. 错误处理

### 5.1 限流触发响应

```json
{
  "error": "TOO_MANY_REQUESTS",
  "message": "请求过于频繁，请稍后再试",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 30,
  "limit": 60,
  "remaining": 0,
  "resetAt": "2026-03-21T12:01:00.000Z"
}
```

### 5.2 降级策略

1. **Redis不可用** → 自动降级到内存存储
2. **内存存储满** → 清理最老的窗口数据
3. **限流失败** → 记录日志，允许请求通过（fail-open）

---

## 6. 配置示例

### 6.1 环境变量

```env
# 限流开关
RATE_LIMIT_ENABLED=true

# Redis配置(可选)
REDIS_URI=mongodb://localhost:6379

# 各API类型默认限制
RATE_LIMIT_PUBLIC_WINDOW=60000
RATE_LIMIT_PUBLIC_MAX=10
RATE_LIMIT_AUTH_WINDOW=60000
RATE_LIMIT_AUTH_MAX=60
RATE_LIMIT_SENSITIVE_WINDOW=60000
RATE_LIMIT_SENSITIVE_MAX=20
RATE_LIMIT_EXTERNAL_WINDOW=60000
RATE_LIMIT_EXTERNAL_MAX=100
```

---

## 7. 实现优先级

1. **Phase 1**: 内存限流器 + 基础中间件
2. **Phase 2**: Redis限流器（备选）
3. **Phase 3**: 装饰器注解集成
4. **Phase 4**: 监控和日志增强

---

## 8. 关键指标

| 指标 | 目标值 |
|------|--------|
| 限流延迟 | < 5ms |
| 内存占用 | < 50MB（10万用户数据） |
| Redis降级 | < 100ms切换 |
| 准确率 | > 99.9% |
