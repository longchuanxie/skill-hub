# SkillHub 后端 - 社区趋势API设计文档

## 1. API概述

### 1.1 接口信息
- **接口名称**: 社区趋势数据API
- **接口路径**: `/api/trends`
- **请求方法**: `GET`
- **访问权限**: 公开
- **响应格式**: JSON

### 1.2 接口目标
- 提供社区热门和趋势性内容数据
- 支持多维度排序和筛选
- 实时计算趋势指标
- 为前端提供动态趋势展示支持

## 2. 数据模型

### 2.1 趋势项数据结构
```typescript
interface TrendItem {
  id: string;              // 资源ID
  type: 'skill' | 'prompt'; // 资源类型
  title: string;           // 资源标题
  description: string;      // 资源描述
  downloads: number;        // 下载次数
  rating: number;          // 评分
  averageRating: number;    // 平均评分
  ratingsCount: number;    // 评分数量
  trendPercentage: number;  // 趋势百分比
  rank: number;            // 排名
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
```

### 2.2 趋势响应数据结构
```typescript
interface TrendsResponse {
  success: boolean;
  data: {
    skills: TrendItem[];      // 技能趋势
    prompts: TrendItem[];     // 提示词趋势
    combined: TrendItem[];    // 综合趋势
  };
  meta: {
    total: number;            // 总数量
    lastUpdated: Date;        // 最后更新时间
    cacheDuration: number;    // 缓存时长（秒）
  };
}
```

### 2.3 请求参数
```typescript
interface TrendsRequest {
  type?: 'skills' | 'prompts' | 'combined'; // 资源类型
  sort?: 'popular' | 'latest' | 'rating';   // 排序方式
  limit?: number;                             // 返回数量限制
  timeRange?: 'week' | 'month' | 'year';     // 时间范围
}
```

## 3. API接口设计

### 3.1 请求规范

#### 3.1.1 请求头
```http
GET /api/trends?type=skills&sort=popular&limit=10 HTTP/1.1
Host: localhost:3002
Content-Type: application/json
```

#### 3.1.2 请求参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| type | string | 否 | 资源类型：skills/prompts/combined | combined |
| sort | string | 否 | 排序方式：popular/latest/rating | popular |
| limit | number | 否 | 返回数量限制 | 10 |
| timeRange | string | 否 | 时间范围：week/month/year | week |

#### 3.1.3 请求示例
```bash
# 获取技能趋势
GET /api/trends?type=skills&sort=popular&limit=10

# 获取提示词趋势
GET /api/trends?type=prompts&sort=latest&limit=10

# 获取综合趋势
GET /api/trends?type=combined&sort=rating&limit=15
```

### 3.2 响应规范

#### 3.2.1 成功响应
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "id": "507f1f77bcf86cd799439011",
        "type": "skill",
        "title": "AI代码生成助手",
        "description": "智能代码生成工具，支持多种编程语言",
        "downloads": 1250,
        "rating": 4.8,
        "averageRating": 4.8,
        "ratingsCount": 42,
        "trendPercentage": 15.5,
        "rank": 1,
        "createdAt": "2026-01-15T08:30:00.000Z",
        "updatedAt": "2026-03-10T14:20:00.000Z"
      }
    ],
    "prompts": [],
    "combined": []
  },
  "meta": {
    "total": 1,
    "lastUpdated": "2026-03-15T06:00:00.000Z",
    "cacheDuration": 300
  }
}
```

#### 3.2.2 错误响应
```json
{
  "success": false,
  "error": "Invalid sort parameter",
  "code": "INVALID_PARAMETER"
}
```

#### 3.2.3 HTTP状态码
| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |

## 4. Controller实现

### 4.1 控制器代码
```typescript
import { Request, Response } from 'express';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';

interface TrendsRequest {
  type?: 'skills' | 'prompts' | 'combined';
  sort?: 'popular' | 'latest' | 'rating';
  limit?: number;
  timeRange?: 'week' | 'month' | 'year';
}

export const getTrends = async (req: Request, res: Response) => {
  try {
    const { type = 'combined', sort = 'popular', limit = 10, timeRange = 'week' } = req.query as TrendsRequest;

    const timeRangeMap = {
      week: 7,
      month: 30,
      year: 365
    };

    const daysAgo = timeRangeMap[timeRange] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const sortOptions = {
      popular: { downloads: -1 },
      latest: { createdAt: -1 },
      rating: { averageRating: -1 }
    };

    const baseQuery = {
      visibility: 'public',
      status: 'approved',
      createdAt: { $gte: startDate }
    };

    let skills: any[] = [];
    let prompts: any[] = [];

    if (type === 'skills' || type === 'combined') {
      skills = await Skill.find(baseQuery)
        .select('title description downloads averageRating ratingsCount createdAt updatedAt')
        .sort(sortOptions[sort])
        .limit(limit)
        .lean();

      skills = await Promise.all(skills.map(async (skill, index) => {
        const trendPercentage = await calculateTrendPercentage(skill.id, 'skill', daysAgo);
        return {
          id: skill._id,
          type: 'skill',
          title: skill.title,
          description: skill.description,
          downloads: skill.downloads || 0,
          rating: skill.averageRating || 0,
          averageRating: skill.averageRating || 0,
          ratingsCount: skill.ratingsCount || 0,
          trendPercentage,
          rank: index + 1,
          createdAt: skill.createdAt,
          updatedAt: skill.updatedAt
        };
      }));
    }

    if (type === 'prompts' || type === 'combined') {
      prompts = await Prompt.find(baseQuery)
        .select('title description usageCount averageRating ratingsCount createdAt updatedAt')
        .sort(sortOptions[sort])
        .limit(limit)
        .lean();

      prompts = await Promise.all(prompts.map(async (prompt, index) => {
        const trendPercentage = await calculateTrendPercentage(prompt.id, 'prompt', daysAgo);
        return {
          id: prompt._id,
          type: 'prompt',
          title: prompt.title,
          description: prompt.description,
          downloads: prompt.usageCount || 0,
          rating: prompt.averageRating || 0,
          averageRating: prompt.averageRating || 0,
          ratingsCount: prompt.ratingsCount || 0,
          trendPercentage,
          rank: index + 1,
          createdAt: prompt.createdAt,
          updatedAt: prompt.updatedAt
        };
      }));
    }

    let combined: any[] = [];
    if (type === 'combined') {
      combined = [...skills, ...prompts];
      combined.sort((a, b) => {
        if (sort === 'popular') return b.downloads - a.downloads;
        if (sort === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sort === 'rating') return b.rating - a.rating;
        return 0;
      });
      combined = combined.slice(0, limit).map((item, index) => ({
        ...item,
        rank: index + 1
      }));
    }

    res.json({
      success: true,
      data: {
        skills,
        prompts,
        combined
      },
      meta: {
        total: skills.length + prompts.length,
        lastUpdated: new Date(),
        cacheDuration: 300
      }
    });
  } catch (error) {
    console.error('获取趋势数据时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends data'
    });
  }
};

async function calculateTrendPercentage(id: string, type: string, daysAgo: number): Promise<number> {
  try {
    const currentDate = new Date();
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - daysAgo * 2);

    const midDate = new Date();
    midDate.setDate(midDate.getDate() - daysAgo);

    const Model = type === 'skill' ? Skill : Prompt;
    const downloadField = type === 'skill' ? 'downloads' : 'usageCount';

    const currentPeriod = await Model.findById(id).select(downloadField);
    const previousPeriod = await Model.findById(id).select(downloadField);

    if (!currentPeriod || !previousPeriod) {
      return 0;
    }

    const currentValue = currentPeriod[downloadField] || 0;
    const previousValue = previousPeriod[downloadField] || 0;

    if (previousValue === 0) {
      return currentValue > 0 ? 100 : 0;
    }

    const percentage = ((currentValue - previousValue) / previousValue) * 100;
    return Math.round(percentage * 10) / 10;
  } catch (error) {
    console.error('计算趋势百分比时出错:', error);
    return 0;
  }
}
```

## 5. 路由配置

### 5.1 路由文件
```typescript
import express from 'express';
import { getTrends } from '../controllers/trendsController';

const router = express.Router();

router.get('/', getTrends);

export default router;
```

### 5.2 应用集成
```typescript
import trendsRoutes from './routes/trends';

app.use('/api/trends', trendsRoutes);
```

## 6. 性能优化

### 6.1 数据库索引
```typescript
// Skill模型索引
skillSchema.index({ visibility: 1, status: 1, createdAt: -1 });
skillSchema.index({ downloads: -1 });
skillSchema.index({ averageRating: -1 });

// Prompt模型索引
promptSchema.index({ visibility: 1, status: 1, createdAt: -1 });
promptSchema.index({ usageCount: -1 });
promptSchema.index({ averageRating: -1 });
```

### 6.2 查询优化
```typescript
// 使用投影减少数据传输
.select('title description downloads averageRating ratingsCount createdAt updatedAt')

// 使用lean()提高查询性能
.lean()

// 限制返回字段数量
.limit(limit)
```

### 6.3 缓存策略
```typescript
// Redis缓存示例
import redis from 'redis';
const client = redis.createClient();

const cacheKey = `trends:${type}:${sort}:${limit}:${timeRange}`;
const cachedData = await client.get(cacheKey);

if (cachedData) {
  return JSON.parse(cachedData);
}

// ... 查询逻辑

await client.setex(cacheKey, 300, JSON.stringify(result));
```

## 7. 错误处理

### 7.1 参数验证
```typescript
const validTypes = ['skills', 'prompts', 'combined'];
const validSorts = ['popular', 'latest', 'rating'];
const validTimeRanges = ['week', 'month', 'year'];

if (type && !validTypes.includes(type)) {
  return res.status(400).json({
    success: false,
    error: 'Invalid type parameter'
  });
}

if (sort && !validSorts.includes(sort)) {
  return res.status(400).json({
    success: false,
    error: 'Invalid sort parameter'
  });
}
```

### 7.2 异常处理
```typescript
try {
  // 业务逻辑
} catch (error) {
  console.error('获取趋势数据时出错:', error);
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Failed to fetch trends data'
  });
}
```

## 8. 安全考虑

### 8.1 输入验证
```typescript
const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
const timeRange = ['week', 'month', 'year'].includes(req.query.timeRange as string) 
  ? req.query.timeRange as string 
  : 'week';
```

### 8.2 数据过滤
```typescript
const baseQuery = {
  visibility: 'public',    // 只返回公开内容
  status: 'approved'      // 只返回已审核内容
};
```

### 8.3 速率限制
```typescript
import rateLimit from 'express-rate-limit';

const trendsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制100次请求
});

app.use('/api/trends', trendsLimiter);
```

## 9. 监控和日志

### 9.1 请求日志
```typescript
console.log(`[Trends API] Request: type=${type}, sort=${sort}, limit=${limit}`);
console.log(`[Trends API] Response: skills=${skills.length}, prompts=${prompts.length}`);
```

### 9.2 性能监控
```typescript
const startTime = Date.now();
// ... 业务逻辑
const duration = Date.now() - startTime;
console.log(`[Trends API] Execution time: ${duration}ms`);
```

### 9.3 错误追踪
```typescript
// 使用Sentry等错误追踪工具
import * as Sentry from '@sentry/node';

try {
  // 业务逻辑
} catch (error) {
  Sentry.captureException(error);
  // ... 错误处理
}
```

## 10. 测试计划

### 10.1 单元测试
```typescript
describe('Trends Controller', () => {
  it('should return skills trends', async () => {
    const req = { query: { type: 'skills', sort: 'popular', limit: 10 } };
    const res = { json: jest.fn() };
    
    await getTrends(req, res);
    
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.any(Object)
    });
  });
});
```

### 10.2 集成测试
```typescript
describe('Trends API Integration', () => {
  it('should return valid trends data', async () => {
    const response = await request(app)
      .get('/api/trends?type=skills&sort=popular&limit=10')
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.skills).toBeInstanceOf(Array);
  });
});
```

### 10.3 性能测试
```typescript
describe('Trends API Performance', () => {
  it('should respond within 500ms', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/trends')
      .expect(200);
      
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500);
  });
});
```

## 11. 部署配置

### 11.1 环境变量
```env
# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 缓存配置
TRENDS_CACHE_DURATION=300

# 速率限制配置
TRENDS_RATE_LIMIT_WINDOW=900000
TRENDS_RATE_LIMIT_MAX=100
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

### 12.1 功能增强
- 实时趋势更新
- 个性化趋势推荐
- 趋势预测分析
- 跨平台趋势对比

### 12.2 数据分析
- 趋势变化图表
- 用户行为分析
- 内容质量评估
- 社区活跃度指标

### 12.3 API扩展
- WebSocket实时推送
- 批量数据导出
- 自定义筛选条件
- 高级搜索功能