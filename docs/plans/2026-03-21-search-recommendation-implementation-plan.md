# 搜索增强与推荐系统 - 实施计划

**文档版本**: v1.0
**创建日期**: 2026-03-21
**基于设计**: `docs/plans/2026-03-21-search-recommendation-design.md`

---

## 一、实施范围

根据设计文档，本次实施包括：

| 模块 | 功能 | 优先级 | 工期 |
|------|------|--------|------|
| **搜索增强** | 索引权重优化 + 相关性排序 + 统一搜索 API | P0 | 3 天 |
| **搜索增强** | 搜索高亮 | P1 | 1 天 |
| **推荐系统** | 热门推荐 + 新品推荐 | P0 | 2 天 |
| **推荐系统** | 相似推荐 | P0 | 2 天 |
| **推荐系统** | 个性化推荐 (轻量级) | P2 | 2 天 |
| **前端** | 搜索组件 + 推荐区域 | P1 | 3 天 |

**总工期**: 约 2-3 周

---

## 二、分阶段实施

### Phase 1: 搜索增强后端 (P0)

#### 任务 1.1: 优化索引权重

**文件**: `backend/src/models/Skill.ts`, `backend/src/models/Prompt.ts`

**变更**:
```javascript
// Skill.ts - 当前
skillSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Skill.ts - 优化后
skillSchema.index(
  { name: 'text', tags: 'text', description: 'text' },
  {
    weights: {
      name: 10,
      tags: 5,
      description: 2
    },
    name: 'skill_text_search_index'
  }
);
```

#### 任务 1.2: 创建搜索服务

**新文件**: `backend/src/services/searchService.ts`

**功能**:
- `search(query, options)` - 统一搜索
- `searchSkills(query, options)` - 搜索技能
- `searchPrompts(query, options)` - 搜索提示词
- `highlightMatches(text, query)` - 高亮处理

#### 任务 1.3: 创建搜索控制器

**新文件**: `backend/src/controllers/searchController.ts`

**API**:
- `GET /api/search` - 统一搜索
- `GET /api/search/suggestions` - 搜索建议
- `POST /api/search/log` - 记录搜索

#### 任务 1.4: 创建搜索路由

**新文件**: `backend/src/routes/search.ts`

**路由**:
```typescript
router.get('/', searchResources);
router.get('/suggestions', getSearchSuggestions);
router.post('/log', logSearch);
router.get('/history', getSearchHistory);
router.delete('/history', clearSearchHistory);
```

---

### Phase 2: 推荐系统后端 (P0)

#### 任务 2.1: 创建用户行为模型

**新文件**: `backend/src/models/UserBehavior.ts`

**字段**:
```typescript
interface IUserBehavior {
  userId: Schema.Types.ObjectId;
  resourceType: 'skill' | 'prompt';
  resourceId: Schema.Types.ObjectId;
  action: 'view' | 'download' | 'favorite' | 'use';
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

#### 任务 2.2: 创建推荐服务

**新文件**: `backend/src/services/recommendationService.ts`

**功能**:
- `getPopularResources(type, options)` - 热门推荐
- `getNewResources(type, options)` - 新品推荐
- `getSimilarResources(type, resourceId, limit)` - 相似推荐
- `getPersonalizedResources(userId, type, limit)` - 个性化推荐

#### 任务 2.3: 创建推荐控制器

**新文件**: `backend/src/controllers/recommendationController.ts`

**API**:
- `GET /api/recommendations` - 获取推荐
- `POST /api/recommendations/behavior` - 记录行为

#### 任务 2.4: 创建推荐路由

**新文件**: `backend/src/routes/recommendations.ts`

---

### Phase 3: 前端实现 (P1)

#### 任务 3.1: 创建搜索 API 客户端

**新文件**: `frontend/src/api/search.ts`

#### 任务 3.2: 创建推荐 API 客户端

**新文件**: `frontend/src/api/recommendations.ts`

#### 任务 3.3: 创建搜索组件

**新文件**:
- `frontend/src/components/search/SearchBar.tsx`
- `frontend/src/components/search/SearchResults.tsx`
- `frontend/src/components/search/SearchFilters.tsx`

#### 任务 3.4: 创建推荐组件

**新文件**:
- `frontend/src/components/recommendation/RecommendationSection.tsx`
- `frontend/src/components/recommendation/SimilarResources.tsx`

#### 任务 3.5: 集成到页面

**修改文件**:
- `frontend/src/pages/SkillsMarketPage.tsx`
- `frontend/src/pages/PromptsMarketPage.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/SkillDetailPage.tsx`
- `frontend/src/pages/PromptDetailPage.tsx`

---

## 三、文件清单

### 后端新增文件

| 文件路径 | 说明 |
|----------|------|
| `backend/src/models/UserBehavior.ts` | 用户行为模型 |
| `backend/src/services/searchService.ts` | 搜索服务 |
| `backend/src/services/recommendationService.ts` | 推荐服务 |
| `backend/src/controllers/searchController.ts` | 搜索控制器 |
| `backend/src/controllers/recommendationController.ts` | 推荐控制器 |
| `backend/src/routes/search.ts` | 搜索路由 |
| `backend/src/routes/recommendations.ts` | 推荐路由 |

### 后端修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `backend/src/models/Skill.ts` | 优化 text index 权重 |
| `backend/src/models/Prompt.ts` | 优化 text index 权重 |
| `backend/src/app.ts` | 注册新路由 |

### 前端新增文件

| 文件路径 | 说明 |
|----------|------|
| `frontend/src/api/search.ts` | 搜索 API 客户端 |
| `frontend/src/api/recommendations.ts` | 推荐 API 客户端 |
| `frontend/src/components/search/SearchBar.tsx` | 搜索框组件 |
| `frontend/src/components/search/SearchResults.tsx` | 搜索结果组件 |
| `frontend/src/components/search/SearchFilters.tsx` | 筛选组件 |
| `frontend/src/components/recommendation/RecommendationSection.tsx` | 推荐区域 |
| `frontend/src/components/recommendation/SimilarResources.tsx` | 相似资源 |

### 前端修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `frontend/src/App.tsx` | 添加路由 |
| `frontend/src/pages/SkillsMarketPage.tsx` | 集成搜索 |
| `frontend/src/pages/PromptsMarketPage.tsx` | 集成搜索 |
| `frontend/src/pages/HomePage.tsx` | 集成推荐 |
| `frontend/src/pages/SkillDetailPage.tsx` | 集成相似推荐 |
| `frontend/src/pages/PromptDetailPage.tsx` | 集成相似推荐 |

---

## 四、API 接口设计

### 搜索 API

#### GET /api/search

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |
| type | string | 否 | `skill`, `prompt`, `all` (默认 `all`) |
| category | string | 否 | 分类筛选 |
| page | number | 否 | 页码 (默认 1) |
| limit | number | 否 | 每页数量 (默认 20) |
| sort | string | 否 | `relevance`, `latest`, `popular` |

**响应**:
```json
{
  "success": true,
  "data": {
    "skills": {
      "items": [...],
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
    "query": "python",
    "took": 25
  }
}
```

#### GET /api/search/suggestions

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索前缀 |
| limit | number | 否 | 返回数量 (默认 10) |

#### POST /api/search/log

**请求体**:
```json
{
  "keyword": "python爬虫",
  "type": "search"
}
```

---

### 推荐 API

#### GET /api/recommendations

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | `popular`, `new`, `similar`, `personalized` |
| resourceType | string | 否 | `skill`, `prompt` (默认 `skill`) |
| resourceId | string | 否 | 资源 ID (相似推荐时必填) |
| limit | number | 否 | 返回数量 (默认 10) |

#### POST /api/recommendations/behavior

**请求体**:
```json
{
  "resourceType": "skill",
  "resourceId": "skill_id",
  "action": "view"
}
```

---

## 五、数据库索引设计

### UserBehavior 集合索引

```javascript
userBehaviorSchema.index({ userId: 1, createdAt: -1 });
userBehaviorSchema.index({ resourceType: 1, resourceId: 1 });
userBehaviorSchema.index({ action: 1 });
userBehaviorSchema.index({ createdAt: -1 });
```

---

## 六、实施顺序

### Day 1-2: 搜索增强后端

1. [ ] 优化 Skill/Prompt 模型 text index 权重
2. [ ] 创建 searchService.ts
3. [ ] 创建 searchController.ts
4. [ ] 创建 search.ts 路由
5. [ ] 在 app.ts 注册路由
6. [ ] 测试搜索 API

### Day 3-4: 推荐系统后端

1. [ ] 创建 UserBehavior 模型
2. [ ] 创建 recommendationService.ts
3. [ ] 创建 recommendationController.ts
4. [ ] 创建 recommendations.ts 路由
5. [ ] 在 app.ts 注册路由
6. [ ] 测试推荐 API

### Day 5-6: 搜索高亮

1. [ ] 实现 highlightMatches 函数
2. [ ] 在搜索结果中集成高亮
3. [ ] 前端搜索结果页面高亮展示

### Day 7-8: 前端搜索组件

1. [ ] 创建 search.ts API 客户端
2. [ ] 创建 SearchBar 组件
3. [ ] 创建 SearchResults 组件
4. [ ] 创建 SearchFilters 组件
5. [ ] 集成到市场页面

### Day 9-10: 前端推荐组件

1. [ ] 创建 recommendations.ts API 客户端
2. [ ] 创建 RecommendationSection 组件
3. [ ] 创建 SimilarResources 组件
4. [ ] 集成到首页和详情页

---

## 七、测试验证

### 功能测试

| 功能 | 测试用例 | 验证方式 |
|------|----------|----------|
| 搜索权重 | 搜索 "python" name 字段优先 | 检查结果顺序 |
| 相关性排序 | 搜索 "web" 多字段匹配 | textScore 排序 |
| 搜索高亮 | 搜索 "爬虫" | 结果中 `<em>` 标签 |
| 热门推荐 | 获取热门技能 | 按 qualityScore 排序 |
| 相似推荐 | 查看技能详情 | 相似技能推荐 |
| 新品推荐 | 获取新品 | 最近 7 天 |

### 性能测试

| 操作 | 目标 | 验证方式 |
|------|------|----------|
| 搜索响应 | < 200ms | 接口耗时 |
| 推荐响应 | < 100ms | 接口耗时 |
| 列表加载 | < 500ms | 页面加载 |

---

## 八、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| MongoDB text search 性能 | 中 | 添加超时限制，结果分页 |
| 中文分词效果差 | 高 | 简单预处理，定期优化词典 |
| 推荐效果不准确 | 中 | 多算法对比，用户反馈收集 |
| 缓存一致性 | 中 | 写入时更新缓存，设置 TTL |
