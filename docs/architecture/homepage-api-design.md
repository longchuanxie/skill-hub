# SkillHub 后端 - 首页数据API设计文档

## 1. API概述

### 1.1 接口信息
- **接口名称**: 首页统计数据API
- **接口路径**: `/api/home/stats`
- **请求方法**: `GET`
- **访问权限**: 公开
- **响应格式**: JSON

### 1.2 接口目标
- 提供首页展示的统计数据
- 包括技能数量、提示词数量、用户数量、下载次数
- 支持实时数据更新
- 为首页提供动态内容支持

## 2. 数据模型

### 2.1 统计数据结构
```typescript
interface HomeStats {
  skills: number;        // AI技能总数
  prompts: number;      // 提示词总数
  users: number;         // 活跃用户数
  downloads: number;     // 下载总次数
}
```

### 2.2 数据来源
- **skills**: 从Skill集合统计visibility='public'且status='approved'的技能数量
- **prompts**: 从Prompt集合统计visibility='public'且status='approved'的提示词数量
- **users**: 从User集合统计活跃用户数量（最近30天有登录记录）
- **downloads**: 从Skill和Prompt集合累加downloads字段

## 3. API接口设计

### 3.1 请求规范

#### 3.1.1 请求头
```http
GET /api/home/stats HTTP/1.1
Host: localhost:3002
Content-Type: application/json
```

#### 3.1.2 请求参数
无请求参数

#### 3.1.3 请求示例
```bash
curl -X GET http://localhost:3002/api/home/stats
```

### 3.2 响应规范

#### 3.2.1 成功响应
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "data": {
    "skills": 1234,
    "prompts": 5678,
    "users": 12345,
    "downloads": 54321
  }
}
```

#### 3.2.2 错误响应
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
```

```json
{
  "success": false,
  "error": "Failed to fetch home statistics"
}
```

## 4. 控制器实现

### 4.1 HomeController
```typescript
import { Request, Response } from 'express';
import Skill from '../models/Skill';
import Prompt from '../models/Prompt';
import User from '../models/User';

export const getHomeStats = async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [skillsCount, promptsCount, usersCount, skillsDownloads, promptsDownloads] = await Promise.all([
      Skill.countDocuments({ visibility: 'public', status: 'approved' }),
      Prompt.countDocuments({ visibility: 'public', status: 'approved' }),
      User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } }),
      Skill.aggregate([
        { $match: { visibility: 'public', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$downloads' } } }
      ]),
      Prompt.aggregate([
        { $match: { visibility: 'public', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$downloads' } } }
      ])
    ]);

    const totalDownloads = (skillsDownloads[0]?.total || 0) + (promptsDownloads[0]?.total || 0);

    res.json({
      success: true,
      data: {
        skills: skillsCount,
        prompts: promptsCount,
        users: usersCount,
        downloads: totalDownloads
      }
    });
  } catch (error) {
    console.error('Error fetching home stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch home statistics'
    });
  }
};
```

## 5. 路由配置

### 5.1 路由文件
```typescript
import express from 'express';
import { getHomeStats } from '../controllers/homeController';

const router = express.Router();

router.get('/stats', getHomeStats);

export default router;
```

### 5.2 应用配置
```typescript
import homeRoutes from './routes/home';

app.use('/api/home', homeRoutes);
```

## 6. 性能优化

### 6.1 缓存策略
- **Redis缓存**: 缓存统计数据，TTL设置为5分钟
- **内存缓存**: 使用Node.js内存缓存减少数据库查询
- **CDN缓存**: 对静态资源进行CDN缓存

### 6.2 数据库优化
- **索引优化**: 为常用查询字段创建索引
- **聚合查询**: 使用MongoDB聚合操作提高查询效率
- **并行查询**: 使用Promise.all并行执行多个查询

### 6.3 查询优化
```typescript
// 优化后的查询
const stats = await Promise.all([
  Skill.countDocuments({ visibility: 'public', status: 'approved' }).cache(),
  Prompt.countDocuments({ visibility: 'public', status: 'approved' }).cache(),
  User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } }).cache(),
  Skill.aggregate([
    { $match: { visibility: 'public', status: 'approved' } },
    { $group: { _id: null, total: { $sum: '$downloads' } } }
  ]).cache(),
  Prompt.aggregate([
    { $match: { visibility: 'public', status: 'approved' } },
    { $group: { _id: null, total: { $sum: '$downloads' } } }
  ]).cache()
]);
```

## 7. 错误处理

### 7.1 错误类型
- **数据库连接错误**: 返回500状态码
- **查询超时**: 返回504状态码
- **数据格式错误**: 返回400状态码

### 7.2 错误处理中间件
```typescript
export const homeErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Home API Error:', err);
  
  if (err.name === 'MongoTimeoutError') {
    return res.status(504).json({
      success: false,
      error: 'Database query timeout'
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid data format'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
```

## 8. 安全考虑

### 8.1 访问控制
- **公开访问**: 统计数据API允许公开访问
- **速率限制**: 实施API速率限制，防止滥用
- **IP白名单**: 可选的IP白名单机制

### 8.2 数据安全
- **敏感信息过滤**: 不返回用户敏感信息
- **数据脱敏**: 统计数据不包含个人身份信息
- **SQL注入防护**: 使用参数化查询防止注入攻击

### 8.3 速率限制
```typescript
import rateLimit from 'express-rate-limit';

const homeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100次请求
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/home', homeLimiter);
```

## 9. 测试计划

### 9.1 单元测试
```typescript
describe('HomeController', () => {
  it('should return home statistics', async () => {
    const req = {} as Request;
    const res = {
      json: jest.fn()
    } as unknown as Response;
    
    await getHomeStats(req, res);
    
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        skills: expect.any(Number),
        prompts: expect.any(Number),
        users: expect.any(Number),
        downloads: expect.any(Number)
      })
    });
  });
});
```

### 9.2 集成测试
```typescript
describe('Home API Integration', () => {
  it('GET /api/home/stats should return 200', async () => {
    const response = await request(app)
      .get('/api/home/stats')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('skills');
    expect(response.body.data).toHaveProperty('prompts');
    expect(response.body.data).toHaveProperty('users');
    expect(response.body.data).toHaveProperty('downloads');
  });
});
```

### 9.3 性能测试
```typescript
describe('Home API Performance', () => {
  it('should respond within 500ms', async () => {
    const start = Date.now();
    await request(app).get('/api/home/stats');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(500);
  });
});
```

## 10. 监控和日志

### 10.1 日志记录
```typescript
import logger from '../utils/logger';

export const getHomeStats = async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    logger.info('Fetching home statistics');
    
    const stats = await fetchStats();
    
    const duration = Date.now() - startTime;
    logger.info(`Home stats fetched successfully in ${duration}ms`);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Failed to fetch home stats in ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch home statistics'
    });
  }
};
```

### 10.2 性能监控
- **响应时间**: 监控API响应时间
- **错误率**: 监控API错误率
- **并发量**: 监控API并发请求数

### 10.3 告警机制
- **响应时间告警**: 超过1秒触发告警
- **错误率告警**: 错误率超过5%触发告警
- **可用性告警**: API不可用时触发告警

## 11. 部署配置

### 11.1 环境变量
```env
# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 缓存配置
CACHE_TTL=300000
```

### 11.2 Docker配置
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD ["npm", "start"]
```

## 12. 未来扩展

### 12.1 实时更新
- **WebSocket**: 实现实时数据推送
- **Server-Sent Events**: 使用SSE进行服务器推送
- **轮询机制**: 定期轮询获取最新数据

### 12.2 高级统计
- **趋势分析**: 添加数据趋势分析
- **用户行为**: 统计用户行为数据
- **资源热度**: 计算资源热度指数

### 12.3 个性化推荐
- **推荐算法**: 基于用户行为的推荐
- **内容分类**: 按类别展示统计数据
- **时间维度**: 支持不同时间维度的统计

## 13. 维护说明

### 13.1 数据更新
- **实时性**: 统计数据应保持实时更新
- **缓存策略**: 合理设置缓存过期时间
- **数据一致性**: 确保统计数据与实际数据一致

### 13.2 性能优化
- **索引维护**: 定期维护数据库索引
- **查询优化**: 持续优化查询性能
- **缓存优化**: 根据访问模式优化缓存策略

### 13.3 监控维护
- **日志分析**: 定期分析日志发现问题
- **性能监控**: 持续监控API性能
- **容量规划**: 根据数据增长进行容量规划