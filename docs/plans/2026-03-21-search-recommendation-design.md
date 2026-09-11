# 搜索增强与推荐系统需求设计

**文档版本**: v1.0
**创建日期**: 2026-03-21
**功能模块**: 搜索增强 + 推荐系统
**技术方案**: MongoDB 增强搜索 + 轻量级推荐

---

## 一、现有能力分析

### 1.1 当前搜索实现

| 组件 | 现状 | 说明 |
|------|------|------|
| Skill 全文索引 | ✅ 已存在 | `name`, `description`, `tags` 字段建立 text index |
| Prompt 全文索引 | ✅ 已存在 | `name`, `content`, `tags` 字段建立 text index |
| 索引权重 | ❌ 未设置 | 三个字段权重相同，未区分重要性 |
| 搜索相关性排序 | ❌ 未实现 | 结果按时间或评分排序，非相关性 |
| 模糊匹配 | ❌ 未实现 | 不支持拼写错误容错 |
| 搜索建议 | ❌ 未实现 | 无自动补全功能 |
| 搜索历史 | ❌ 未实现 | 未记录用户搜索行为 |
| 高亮显示 | ❌ 未实现 | 结果中未突出关键词 |

### 1.2 当前推荐实现

| 组件 | 现状 | 说明 |
|------|------|------|
| 热门推荐 | ✅ 简单实现 | 按 `stats.downloadCount` 或 `stats.avgRating` 排序 |
| 相似推荐 | ❌ 未实现 | 详情页无相似资源推荐 |
| 个性化推荐 | ❌ 未实现 | 无基于用户行为的推荐 |
| 新资源推荐 | ❌ 未实现 | 无时间维度的推荐 |

---

## 二、搜索增强功能设计

### 2.1 功能概述

#### 2.1.1 目标

基于现有 MongoDB $text 索引，实现**增强型全文搜索**，提升搜索结果相关性和用户体验。

#### 2.1.2 核心功能

| 功能 | 优先级 | 描述 |
|------|--------|------|
| 搜索权重优化 | P0 | 优化字段权重，name > tags > description |
| 相关性排序 | P0 | 按 MongoDB textScore 排序 |
| 多字段组合搜索 | P0 | 支持同时搜索多个资源类型 |
| 搜索高亮 | P1 | 在结果中突出匹配关键词 |
| 搜索建议 | P2 | 搜索框自动补全 |
| 搜索历史 | P2 | 记录和展示用户搜索历史 |
| 热门搜索 | P2 | 展示热门搜索词 |

### 2.2 技术方案

#### 2.2.1 索引权重优化

**当前问题**: `name`, `description`, `tags` 三个字段权重相同，导致搜索结果不理想。

**优化方案**: 为不同字段设置不同权重

```javascript
// Skill 模型索引优化
skillSchema.index(
  { name: 'text', tags: 'text', description: 'text' },
  {
    weights: {
      name: 10,        // 名称最重要
      tags: 5,         // 标签次之
      description: 2   // 描述权重最低
    },
    name: 'skill_text_search_index'
  }
);

// Prompt 模型索引优化
promptSchema.index(
  { name: 'text', tags: 'text', content: 'text' },
  {
    weights: {
      name: 10,
      tags: 5,
      content: 2
    },
    name: 'prompt_text_search_index'
  }
);
```

#### 2.2.2 搜索 API 设计

**统一搜索接口**
```
GET /api/search
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |
| type | string | 否 | 资源类型：`skill`, `prompt`, `all` (默认 `all`) |
| category | string | 否 | 分类筛选 |
| tags | string[] | 否 | 标签筛选 |
| page | number | 否 | 页码 (默认 1) |
| limit | number | 否 | 每页数量 (默认 20) |
| sort | string | 否 | 排序方式：`relevance`, `latest`, `popular` (默认 `relevance`) |
| enterpriseId | string | 否 | 企业筛选 (仅管理员) |

**响应格式**:
```json
{
  "success": true,
  "data": {
    "skills": {
      "items": [
        {
          "_id": "skill_id",
          "name": "Python 爬虫技能",
          "description": "...",
          "tags": ["python", "爬虫", "数据采集"],
          "category": "数据处理",
          "stats": { "downloadCount": 100, "avgRating": 4.5 },
          "author": { "username": "张三", "avatar": "..." },
          "highlight": {
            "name": "Python <em>爬虫</em>技能",
            "description": "快速<em>爬取</em>网页数据..."
          },
          "score": 15.5
        }
      ],
      "total": 50,
      "page": 1,
      "totalPages": 3
    },
    "prompts": {
      "items": [...],
      "total": 30,
      "page": 1,
      "totalPages": 2
    }
  },
  "meta": {
    "query": "爬虫",
    "type": "all",
    "took": 25
  }
}
```

**搜索高亮实现**:
```javascript
// 后端搜索实现
const searchSkills = async (query, options) => {
  const searchQuery = {
    $text: { $search: query },
    status: 'approved',
    $or: [
      { marketType: 'public' },
      { enterpriseId: currentUser.enterpriseId }
    ]
  };

  const projection = {
    score: { $meta: 'textScore' }
  };

  const results = await Skill.find(searchQuery, projection)
    .select('name description tags category stats author')
    .sort({ score: { $meta: 'textScore' } })
    .skip((page - 1) * limit)
    .limit(limit);

  // 高亮处理
  const highlightedResults = results.map(item => ({
    ...item.toObject(),
    highlight: {
      name: item.name.replace(
        new RegExp(query, 'gi'),
        '<em>$&</em>'
      ),
      description: item.description.replace(
        new RegExp(query, 'gi'),
        '<em>$&</em>'
      )
    }
  }));

  return highlightedResults;
};
```

### 2.3 搜索建议功能 (P2)

#### 2.3.1 数据模型

```typescript
interface SearchSuggestion {
  _id: ObjectId;
  keyword: string;           // 搜索关键词
  count: number;             // 搜索次数
  type: 'popular' | 'recent'; // 类型
  lastSearchedAt: Date;
  enterpriseId?: ObjectId;   // 企业维度（可选）
}
```

#### 2.3.2 索引

```javascript
searchSuggestionSchema.index({ keyword: 1 });
searchSuggestionSchema.index({ count: -1 });
searchSuggestionSchema.index({ lastSearchedAt: -1 });
searchSuggestionSchema.index({ enterpriseId: 1, keyword: 1 }, { unique: true });
```

#### 2.3.3 API 设计

**获取搜索建议**
```
GET /api/search/suggestions
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索前缀 |
| limit | number | 否 | 返回数量 (默认 10) |

**响应**:
```json
{
  "success": true,
  "data": [
    { "keyword": "python爬虫", "count": 1520 },
    { "keyword": "python入门", "count": 980 },
    { "keyword": "python数据分析", "count": 756 }
  ]
}
```

**记录搜索词**
```
POST /api/search/log
```

**请求体**:
```json
{
  "keyword": "python爬虫",
  "type": "search" | "click" | "suggestion"
}
```

### 2.4 搜索历史功能 (P2)

#### 2.4.1 数据模型

```typescript
interface SearchHistory {
  _id: ObjectId;
  userId: ObjectId;
  keyword: string;
  searchedAt: Date;
  resultCount: number;
  clickedResultId?: ObjectId;
}
```

#### 2.4.2 API 设计

**获取搜索历史**
```
GET /api/search/history
```

**响应**:
```json
{
  "success": true,
  "data": [
    { "keyword": "python爬虫", "searchedAt": "2026-03-21T10:00:00Z", "resultCount": 50 },
    { "keyword": "前端模板", "searchedAt": "2026-03-20T15:30:00Z", "resultCount": 30 }
  ]
}
```

**清除搜索历史**
```
DELETE /api/search/history
```

### 2.5 前端实现

#### 2.5.1 搜索组件设计

```tsx
// SearchBar 组件
interface SearchBarProps {
  onSearch: (query: string) => void;
  onSuggestionClick: (suggestion: string) => void;
}

// 功能点:
// 1. 防抖输入 (300ms)
// 2. 显示搜索建议下拉
// 3. 搜索历史展示
// 4. 热门搜索展示
// 5. 按回车搜索
```

#### 2.5.2 搜索结果页面

```tsx
// SearchResultsPage
interface SearchResultsPageProps {
  query: string;
  type: 'skill' | 'prompt' | 'all';
}

// 功能点:
// 1. Tab 切换 (全部/技能/提示词)
// 2. 筛选面板 (分类、标签)
// 3. 排序选择 (相关性/最新/最热)
// 4. 高亮显示
// 5. 分页
```

---

## 三、推荐系统功能设计

### 3.1 功能概述

#### 3.1.1 目标

实现**轻量级推荐系统**，基于内容特征和用户行为提供个性化推荐。

#### 3.1.2 核心功能

| 功能 | 优先级 | 描述 |
|------|--------|------|
| 热门推荐 | P0 | 按下载/评分统计的热门资源 |
| 相似推荐 | P0 | 基于标签/分类的相似资源 |
| 新品推荐 | P1 | 最近上架的资源 |
| 猜你喜欢 | P2 | 基于用户收藏/下载历史的推荐 |

### 3.2 数据模型

#### 3.2.1 用户行为日志

```typescript
interface UserBehavior {
  _id: ObjectId;
  userId: ObjectId;
  resourceType: 'skill' | 'prompt';
  resourceId: ObjectId;
  action: 'view' | 'download' | 'favorite' | 'use';
  metadata?: {
    source?: string;          // 来源页面
    searchQuery?: string;     // 搜索关键词
   停留时间?: number;        // 页面停留时间
  };
  createdAt: Date;
}
```

#### 3.2.2 资源特征向量

```typescript
interface ResourceFeature {
  _id: ObjectId;
  resourceType: 'skill' | 'prompt';
  resourceId: ObjectId;
  tags: string[];
  category: string;
  authorId: ObjectId;
  enterpriseId?: ObjectId;
  qualityScore: number;       // 质量分 = avgRating * log(ratingCount + 1)
  popularityScore: number;    // 热门分 = log(downloadCount + 1)
  freshnessScore: number;     // 新鲜分 = 1 / (daysSinceCreated + 1)
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.3 推荐算法

#### 3.3.1 热门推荐

```javascript
// 基于质量和热度的加权推荐
const getPopularRecommendations = async (resourceType, options) => {
  const { limit = 10, category, enterpriseId } = options;

  const match = {
    status: 'approved',
    marketType: 'public',
    ...(category && { category }),
    ...(enterpriseId && { enterpriseId })
  };

  const skills = await Skill.aggregate([
    { $match: match },
    {
      $addFields: {
        qualityScore: {
          $multiply: [
            { $ifNull: ['$stats.avgRating', 0] },
            { $ln: { $add: [{ $ifNull: ['$stats.ratingCount', 0] }, 1] } }
          ]
        },
        popularityScore: {
          $ln: { $add: [{ $ifNull: ['$stats.downloadCount', 0] }, 1] }
        }
      }
    },
    {
      $addFields: {
        finalScore: {
          $add: [
            { $multiply: ['$qualityScore', 0.4] },
            { $multiply: ['$popularityScore', 0.6] }
          ]
        }
      }
    },
    { $sort: { finalScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorInfo'
      }
    },
    { $unwind: '$authorInfo' },
    {
      $project: {
        name: 1,
        description: 1,
        tags: 1,
        category: 1,
        stats: 1,
        'authorInfo.username': 1,
        'authorInfo.avatar': 1
      }
    }
  ]);

  return skills;
};
```

#### 3.3.2 相似推荐

```javascript
// 基于标签交集的相似度计算
const getSimilarResources = async (resourceType, resourceId, limit = 10) => {
  // 1. 获取目标资源
  const target = await Skill.findById(resourceId);
  if (!target) return [];

  // 2. 查找同分类资源
  const candidates = await Skill.find({
    _id: { $ne: resourceId },
    status: 'approved',
    category: target.category
  }).limit(50);

  // 3. 计算标签交集相似度
  const targetTags = new Set(target.tags);
  const scored = candidates.map(candidate => {
    const candidateTags = new Set(candidate.tags);
    const intersection = [...targetTags].filter(t => candidateTags.has(t));
    const union = new Set([...targetTags, ...candidateTags]);
    const similarity = intersection.length / union.size;

    return {
      ...candidate.toObject(),
      similarity
    };
  });

  // 4. 排序返回
  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
};
```

#### 3.3.3 新品推荐

```javascript
// 基于创建时间的推荐
const getNewRecommendations = async (resourceType, options) => {
  const { limit = 10, category, days = 7 } = options;
  const since = new Date();
  since.setDate(since.getDate() - days);

  return Skill.find({
    status: 'approved',
    marketType: 'public',
    createdAt: { $gte: since },
    ...(category && { category })
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('author', 'username avatar');
};
```

#### 3.3.4 猜你喜欢 (轻量级)

```javascript
// 基于用户收藏/下载历史的标签匹配
const getPersonalizedRecommendations = async (userId, limit = 10) => {
  // 1. 获取用户历史行为
  const behaviors = await UserBehavior.find({
    userId,
    action: { $in: ['download', 'favorite'] }
  })
    .sort({ createdAt: -1 })
    .limit(50);

  if (behaviors.length === 0) {
    // 无历史行为，返回热门推荐
    return getPopularRecommendations('skill', { limit });
  }

  // 2. 提取用户偏好标签
  const resourceIds = behaviors.map(b => b.resourceId);
  const favoriteResources = await Skill.find({
    _id: { $in: resourceIds }
  });

  const tagCounts = {};
  favoriteResources.forEach(r => {
    r.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // 3. 获取用户偏好标签
  const preferredTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  // 4. 查找匹配资源
  const recommendations = await Skill.find({
    _id: { $nin: resourceIds },
    status: 'approved',
    marketType: 'public',
    tags: { $in: preferredTags }
  })
    .limit(limit * 2)
    .populate('author', 'username avatar');

  // 5. 按标签匹配度排序
  return recommendations.sort((a, b) => {
    const aMatch = a.tags.filter(t => preferredTags.includes(t)).length;
    const bMatch = b.tags.filter(t => preferredTags.includes(t)).length;
    return bMatch - aMatch;
  }).slice(0, limit);
};
```

### 3.4 API 设计

#### 3.4.1 获取推荐

```
GET /api/recommendations
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | `popular`, `similar`, `new`, `personalized` |
| resourceType | string | 否 | `skill`, `prompt` (默认 `skill`) |
| resourceId | string | 否 | 资源 ID (相似推荐时必填) |
| limit | number | 否 | 返回数量 (默认 10) |
| category | string | 否 | 分类筛选 |

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "skill_id",
      "name": "Python 数据分析技能",
      "description": "...",
      "tags": ["python", "数据分析", "pandas"],
      "category": "数据处理",
      "stats": { "downloadCount": 200, "avgRating": 4.8 },
      "author": { "username": "李四", "avatar": "..." },
      "similarity"?: 0.85,
      "reason"?: "因为你收藏了 Python 基础技能"
    }
  ],
  "meta": {
    "type": "personalized",
    "took": 45
  }
}
```

#### 3.4.2 记录用户行为

```
POST /api/recommendations/behavior
```

**请求体**:
```json
{
  "resourceType": "skill",
  "resourceId": "skill_id",
  "action": "view",
  "metadata": {
    "source": "search",
    "searchQuery": "python"
  }
}
```

### 3.5 前端实现

#### 3.5.1 推荐区域组件

```tsx
// RecommendationSection 组件
interface RecommendationSectionProps {
  type: 'popular' | 'new' | 'personalized';
  title: string;
  resourceType?: 'skill' | 'prompt';
}

// 功能点:
// 1. 标题和类型标签
// 2. 资源卡片列表
// 3. 换一批功能
// 4. 加载状态
```

#### 3.5.2 相似推荐组件

```tsx
// SimilarResources 组件
interface SimilarResourcesProps {
  resourceType: 'skill' | 'prompt';
  resourceId: string;
}

// 功能点:
// 1. 相似资源列表
// 2. 相似度标签
// 3. 查看更多链接
```

---

## 四、实施计划

### 4.1 分阶段实施

| 阶段 | 功能 | 优先级 | 工作量 |
|------|------|--------|--------|
| **Phase 1** | 搜索权重优化 + 相关性排序 | P0 | 1 天 |
| **Phase 1** | 统一搜索 API | P0 | 2 天 |
| **Phase 1** | 热门/新品推荐 API | P0 | 2 天 |
| **Phase 2** | 搜索高亮 | P1 | 1 天 |
| **Phase 2** | 相似推荐 API | P0 | 2 天 |
| **Phase 2** | 前端搜索组件 | P1 | 2 天 |
| **Phase 2** | 前端推荐区域 | P1 | 2 天 |
| **Phase 3** | 搜索建议 API | P2 | 2 天 |
| **Phase 3** | 搜索历史 | P2 | 1 天 |
| **Phase 3** | 个性化推荐 | P2 | 2 天 |

### 4.2 预估工期

| 功能模块 | 预估时间 |
|----------|----------|
| 搜索增强 | 1-2 周 |
| 推荐系统 | 1-2 周 |
| **合计** | **2-4 周** |

---

## 五、风险与注意事项

### 5.1 技术风险

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| MongoDB text search 性能问题 | 🟡 中 | 🟡 中 | 限制结果集大小，添加超时 |
| 搜索结果不准确 | 🟡 中 | 🟡 高 | A/B 测试，持续调优权重 |
| 推荐效果不佳 | 🟡 中 | 🟡 中 | 多算法对比，收集用户反馈 |

### 5.2 性能优化

1. **搜索缓存**: 使用 Redis 缓存热门搜索结果
2. **限流**: 搜索 API 添加请求限流
3. **索引**: 确保 text index 存在，避免全表扫描
4. **分页**: 最大返回 100 条，避免大结果集

### 5.3 数据积累

| 数据 | 用途 | 积累方式 |
|------|------|----------|
| 搜索日志 | 热门搜索、搜索建议 | 异步记录 |
| 用户行为 | 个性化推荐 | 页面埋点 |
| 资源特征 | 相似度计算 | 定时任务更新 |

---

## 六、相关文档

| 文档 | 路径 |
|------|------|
| 现有数据模型 | `docs/backend/backend-models.md` |
| 现有 API 设计 | `docs/backend/backend-api.md` |
| 产品功能扩展分析 | `docs/product-strategy/product-feature-extension-analysis-20260318.md` |
| 核心功能检视报告 | `docs/product-strategy/core-functionality-review-20260321-200203.md` |

---

## 七、附录

### 7.1 MongoDB Text Search 限制说明

MongoDB $text 搜索有以下限制：
- 不支持中文分词（需要预处理）
- 不支持复杂的查询语法
- 相关性评分基于词频，不支持 BM25

**针对中文的处理方案**:
```javascript
// 中文分词预处理（可选）
const tokenize = (text) => {
  // 简单分词：按标点和空格分割
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
};

// 搜索时使用处理后的词
const processedQuery = tokenize(rawQuery).join(' ');
```

### 7.2 替代方案（未来可选）

如果 MongoDB 搜索无法满足需求，可考虑升级到：
- **Elasticsearch**: 更强大的全文搜索能力
- **MeiliSearch**: 轻量级、易部署
- **Algolia**: SaaS 方案，无需运维
