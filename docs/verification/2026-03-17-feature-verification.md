# Phase 1 新功能验证指南

## 验证日期
2026-03-17

## 环境要求

### 必需服务
- **MongoDB**: 应该可以直接运行（位于 `mongodb-win32-x86_64-windows-7.0.14\bin`）
- **Node.js**: v18+ （已安装）

### 可选服务
- **Redis**: 可选，不启动时缓存功能会自动跳过

---

## 功能验证清单

### 模块 2: 用户体验优化

#### ✅ Task 2.1: 新手引导系统

**验证步骤**：

1. **启动应用**
   ```bash
   cd backend
   npm start
   ```

2. **启动前端**
   ```bash
   cd frontend
   npm run dev
   ```

3. **注册新用户**
   - 访问 http://localhost:5173/register
   - 填写注册表单
   - 提交注册

4. **验证引导触发**
   - 登录后应该自动显示引导浮层
   - 引导应该有 4 个步骤
   - 第一步应该高亮页面标题或 Logo 区域

5. **验证引导功能**
   - 点击"下一步"按钮，应该进入第二步
   - 第二步应该高亮"浏览技能"链接
   - 点击"跳过"按钮，引导应该消失
   - 刷新页面，引导不应该再次出现（已持久化）

6. **验证持久化**
   - 打开浏览器开发者工具 → Application → Local Storage
   - 应该看到 `onboarding-storage` 键
   - `completed` 应该为 `true`

**预期结果**:
- ✅ 新用户首次登录时自动显示引导
- ✅ 引导步骤正确高亮目标元素
- ✅ 可以跳过和完成引导
- ✅ 引导状态持久化到 localStorage

---

#### ✅ Task 2.2: 错误处理优化

**验证步骤**：

1. **测试错误边界**
   - 打开浏览器控制台
   - 在控制台执行：
     ```javascript
     throw new Error('Test error')
     ```
   - 应该显示错误页面，而不是白屏

2. **测试错误消息组件**
   - 访问 http://localhost:5173
   - 打开开发者工具，找到错误消息组件
   - 验证 3 种变体样式（inline、card、toast）

3. **测试网络错误**
   - 停止后端服务
   ```bash
   # Ctrl+C 停止 backend npm start
   ```
   - 尝试登录或刷新页面
   - 应该显示"网络错误"提示

4. **测试权限错误**
   - 访问需要权限的页面（如 /my/resources）
   - 应该显示"未授权"或"权限不足"提示

5. **验证错误消息映射**
   - 打开浏览器控制台
   - 执行：
     ```javascript
     fetch('/api/test-error')
       .then(res => res.json())
       .then(data => console.log(data))
     ```
   - 验证错误代码对应正确的中文消息

**预期结果**:
- ✅ 错误边界捕获并显示友好的错误页面
- ✅ 网络错误显示"无法连接到服务器"提示
- ✅ 权限错误显示"未授权"或"权限不足"
- ✅ 错误消息有重试按钮（如适用）

---

### 模块 3: 性能优化

#### ✅ Task 3.1: Redis 缓存集成（可选）

**验证步骤**：

**场景 A: Redis 未启动（当前状态）**

1. **验证应用正常启动**
   ```bash
   cd backend
   npm start
   ```
   - 应用应该正常启动，不报 Redis 连接错误
   - 日志应该显示 "Redis not available, skipping cache tests"

2. **验证缓存跳过**
   - 访问 http://localhost:3001/api/health
   - 响应头不应该有 `X-Cache`
   - 多次访问，响应时间应该相似

3. **验证 API 正常工作**
   - 访问 http://localhost:5173
   - 技能列表应该正常加载
   - 所有 CRUD 操作应该正常

**场景 B: Redis 已启动（可选验证）**

1. **启动 Redis**
   ```bash
   # 使用 Docker（推荐）
   docker run -d -p 6379:6379 redis:alpine

   # 或使用本地安装的 Redis
   redis-server
   ```

2. **验证缓存功能**
   - 设置环境变量：
     ```bash
     # Windows PowerShell
     $env:REDIS_URL="redis://localhost:6379"
     npm start
     ```
   - 访问 http://localhost:3001/api/skills
   - 第一次请求：响应头 `X-Cache: MISS`
   - 第二次请求：响应头 `X-Cache: HIT`
   - 响应时间应该显著降低

3. **验证缓存清除**
   - 创建或更新一个技能
   - 再次访问技能列表
   - 应该看到 `X-Cache: MISS`（缓存已清除）

**预期结果**:
- ✅ 无 Redis 时应用正常启动和运行
- ✅ 缓存中间件优雅降级
- ✅ 有 Redis 时缓存功能正常工作
- ✅ 缓存命中/未命中正确标记

---

#### ✅ Task 3.2: 数据库索引优化

**验证步骤**：

1. **验证索引创建**
   - 后端启动日志应该没有索引相关错误
   - MongoDB 应该自动创建新索引

2. **测试查询性能**
   - 访问 http://localhost:5173
   - 搜索技能（使用搜索框）
   - 筛选技能（按分类、状态）
   - 加载速度应该明显快于优化前

3. **验证复合索引**
   - 访问个人资源页面
   - 查询应该同时使用 `owner` 和 `visibility` 条件
   - 响应时间应该 < 200ms

4. **测试全文搜索**
   - 在搜索框输入关键词
   - 应该能够搜索技能名称、描述、标签
   - 搜索结果应该相关且快速

**预期结果**:
- ✅ 索引自动创建，无错误
- ✅ 列表查询速度提升 30%+
- ✅ 搜索功能快速响应
- ✅ 复合查询性能优化

---

### 模块 4: 监控告警

#### ✅ Task 4.1: 应用性能监控

**验证步骤**：

1. **验证监控中间件**
   - 后端启动后，访问任何 API 端点
   - 控制台应该记录请求指标

2. **测试慢请求告警**
   - 访问 http://localhost:3001/api/health
   - 如果响应时间 > 1000ms，应该看到警告日志：
     ```
     Slow request: GET /api/health took XXXXms
     ```

3. **验证监控 API（需要管理员权限）**
   - 使用管理员账号登录
   - 访问以下端点：
     - `GET /api/monitoring/metrics` - 获取原始指标
     - `GET /api/monitoring/metrics/summary` - 获取汇总统计
     - `GET /api/monitoring/metrics/endpoints` - 获取端点统计

4. **验证指标收集**
   - 访问多个页面（首页、技能页、提示词页）
   - 访问监控 API
   - 验证：
     - `total` 请求总数正确
     - `avgResponseTime` 平均响应时间合理
     - `p95ResponseTime` P95 响应时间
     - `errorRate` 错误率计算正确
     - `slowRequests` 慢请求数正确

5. **验证端点统计**
   - 访问 `/api/monitoring/metrics/endpoints`
   - 验证每个端点的：
     - `count` 请求次数
     - `avgTime` 平均响应时间
     - `errorRate` 错误率

**预期结果**:
- ✅ 每个请求都被记录指标
- ✅ 慢请求（>1000ms）触发警告
- ✅ 监控 API 返回正确的统计数据
- ✅ 端点统计准确反映实际使用情况

---

## 手动功能验证脚本

### 测试新手引导

```javascript
// 在浏览器控制台执行

// 1. 测试引导状态管理
const { completeOnboarding, skipOnboarding, resetOnboarding } = window.useOnboardingStore?.getState?.() || {};

console.log('Testing onboarding store...');
console.log('Current state:', { completed, currentStep, skipped });

// 2. 测试完成引导
completeOnboarding();
console.log('After complete:', window.useOnboardingStore?.getState?.());

// 3. 测试重置引导
resetOnboarding();
console.log('After reset:', window.useOnboardingStore?.getState?.());
```

### 测试错误消息

```javascript
// 在浏览器控制台执行

// 1. 测试错误消息映射
const { getErrorMessage } = window.getErrorMessage || {};

const errors = [
  'NETWORK_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'UNKNOWN_ERROR'
];

errors.forEach(code => {
  const error = getErrorMessage(code);
  console.log(`${code}:`, error);
  console.log(`  Title: ${error.title}`);
  console.log(`  Description: ${error.description}`);
  console.log(`  Action: ${error.action || 'N/A'}`);
});
```

### 测试缓存功能

```javascript
// 在浏览器控制台执行

// 1. 测试缓存响应头
fetch('http://localhost:3001/api/skills')
  .then(res => {
    console.log('Cache status:', res.headers.get('X-Cache'));
    return res.json();
  })
  .then(data => console.log('Skills data:', data));

// 2. 多次请求验证缓存
setTimeout(() => {
  fetch('http://localhost:3001/api/skills')
    .then(res => {
      console.log('Second request cache status:', res.headers.get('X-Cache'));
      return res.json();
    });
}, 1000);
```

### 测试性能监控

```javascript
// 在浏览器控制台执行

// 1. 测试慢请求检测
const startTime = Date.now();
fetch('http://localhost:3001/api/health')
  .then(res => {
    const responseTime = Date.now() - startTime;
    console.log('Response time:', responseTime, 'ms');
    if (responseTime > 1000) {
      console.warn('⚠️ This is a slow request!');
    }
    return res.json();
  });

// 2. 测试监控 API（需要管理员 token）
const adminToken = 'YOUR_ADMIN_TOKEN';
fetch('http://localhost:3001/api/monitoring/metrics/summary', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
})
  .then(res => res.json())
  .then(data => {
    console.log('Performance summary:', data);
    console.log('  Total requests:', data.data?.total);
    console.log('  Avg response time:', data.data?.avgResponseTime);
    console.log('  P95 response time:', data.data?.p95ResponseTime);
    console.log('  Error rate:', data.data?.errorRate);
  });
```

---

## 自动化测试命令

### 运行所有测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test

# E2E 测试（需要后端运行）
cd frontend
npm run test:e2e
```

### 运行特定测试

```bash
# 只测试新功能
cd backend
npm test -- --testPathPattern="middleware"

cd frontend
npm test -- --run src/stores/onboardingStore.test.ts src/utils/errorMessages.test.ts
```

### 测试覆盖率

```bash
# 后端覆盖率
cd backend
npm test -- --coverage

# 前端覆盖率
cd frontend
npm test -- --run --coverage
```

---

## 性能基准测试

### API 响应时间基准

| 端点 | 无缓存 | 有缓存 | 目标 |
|--------|--------|--------|------|
| GET /api/health | < 50ms | < 50ms | < 100ms |
| GET /api/skills | < 200ms | < 100ms | < 200ms |
| GET /api/prompts | < 200ms | < 100ms | < 200ms |
| POST /api/skills | < 300ms | N/A | < 500ms |

### 页面加载时间基准

| 页面 | 目标 | 验证方法 |
|------|------|----------|
| 首页 | < 2s | Chrome DevTools Performance |
| 技能列表 | < 2s | Chrome DevTools Performance |
| 提示词列表 | < 2s | Chrome DevTools Performance |
| 登录页 | < 2s | Chrome DevTools Performance |

---

## 故障排除

### 问题 1: 后端无法启动

**症状**: `npm start` 报错

**可能原因**:
- MongoDB 未运行
- 端口被占用
- 环境变量配置错误

**解决方案**:
```bash
# 1. 检查 MongoDB
# Windows
Get-Process mongodb

# 2. 检查端口占用
netstat -ano | findstr :3001

# 3. 检查环境变量
echo $env:MONGODB_URI
echo $env:REDIS_URL
```

### 问题 2: 前端无法连接后端

**症状**: 页面报错或无法加载数据

**可能原因**:
- 后端未启动
- CORS 配置错误
- API 地址错误

**解决方案**:
```bash
# 1. 检查后端状态
curl http://localhost:3001/api/health

# 2. 检查前端配置
# 查看 frontend/.env 或 vite.config.ts 中的 API 地址

# 3. 检查浏览器控制台
# 打开开发者工具查看网络请求和错误
```

### 问题 3: 缓存不工作

**症状**: 响应头没有 `X-Cache`

**可能原因**:
- Redis 未启动
- 环境变量未设置
- 请求方法不是 GET

**解决方案**:
```bash
# 1. 检查 Redis
redis-cli ping
# 应该返回 PONG

# 2. 检查环境变量
echo $env:REDIS_URL

# 3. 检查后端日志
# 应该看到 "Redis connection established"
```

### 问题 4: 监控 API 401 错误

**症状**: 访问 `/api/monitoring/*` 返回 401

**可能原因**:
- 未登录
- 不是管理员账号
- Token 无效

**解决方案**:
```bash
# 1. 确保使用管理员账号登录
# 2. 检查 Token 是否有效
# 3. 确认用户角色是 admin
```

---

## 验证报告模板

### 功能验证报告

```
# Phase 1 新功能验证报告

验证日期: 2026-03-17
验证人: [你的名字]

## 模块 2: 用户体验优化

### Task 2.1: 新手引导系统
- [ ] 新用户自动触发引导
- [ ] 引导步骤正确高亮元素
- [ ] 可以跳过和完成引导
- [ ] 引导状态持久化

**结果**: ✅ 通过 / ❌ 失败
**备注**: [可选备注]

### Task 2.2: 错误处理优化
- [ ] 错误边界正常工作
- [ ] 错误消息正确显示
- [ ] 网络错误友好提示
- [ ] 权限错误正确处理

**结果**: ✅ 通过 / ❌ 失败
**备注**: [可选备注]

## 模块 3: 性能优化

### Task 3.1: Redis 缓存集成
- [ ] 无 Redis 时应用正常
- [ ] 有 Redis 时缓存工作
- [ ] 缓存命中/未命中标记

**结果**: ✅ 通过 / ❌ 失败
**备注**: [可选备注]

### Task 3.2: 数据库索引优化
- [ ] 索引自动创建
- [ ] 查询性能提升
- [ ] 复合索引工作

**结果**: ✅ 通过 / ❌ 失败
**备注**: [可选备注]

## 模块 4: 监控告警

### Task 4.1: 应用性能监控
- [ ] 请求指标记录
- [ ] 慢请求告警
- [ ] 监控 API 可访问

**结果**: ✅ 通过 / ❌ 失败
**备注**: [可选备注]

## 总体评估

- [ ] 所有功能按预期工作
- [ ] 性能指标达标
- [ ] 无关键 Bug
- [ ] 代码质量符合标准

**建议**: [改进建议]
```

---

## 总结

本指南提供了 Phase 1 所有新增功能的详细验证步骤。请按照清单逐项验证，确保：

1. **功能完整性**: 所有新功能按预期工作
2. **性能达标**: API 响应时间和页面加载时间符合目标
3. **用户体验**: 新手引导和错误处理提升用户满意度
4. **稳定性**: 应用在各种情况下稳定运行

**验证完成后**，请填写验证报告模板并提交。
