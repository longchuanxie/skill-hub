---
title: SkillHub 推荐系统设计
document-type: architecture-design
version: 1.0.0
created-date: 2026-03-22
---

# SkillHub 推荐系统设计

## 一、概述

推荐系统是 SkillHub 平台的核心功能之一，旨在帮助用户发现高质量的 AI 技能（Skills）和提示词（Prompts）。系统通过多维度算法评估资源质量，为用户提供个性化推荐。

## 二、推荐类型

系统支持四种推荐类型：

| 类型 | 说明 |
|------|------|
| `popular` | 热门推荐，基于质量分数排序 |
| `new` | 最新推荐，按创建时间倒序 |
| `similar` | 相似推荐，基于内容特征匹配 |
| `personalized` | 个性化推荐，基于用户行为 |

## 三、质量分数算法

### 3.1 计算公式

资源质量分数由以下四个维度加权计算：

```
QualityScore = LikeScore × 0.35 + DownloadScore × 0.35 + RatingScore × 0.2 + UsageScore × 0.1
```

### 3.2 各维度计算

| 维度 | 权重 | 计算方式 |
|------|------|----------|
| LikeScore | 0.35 | min(likeCount, 100) / 100 |
| DownloadScore | 0.35 | min(downloads, 500) / 500 |
| RatingScore | 0.20 | averageRating / 5 |
| UsageScore | 0.10 | min(usageCount, 200) / 200 |

### 3.3 归一化处理

各维度指标先进行归一化处理，确保值在 [0, 1] 范围内：
- likeCount 上限：100
- downloads 上限：500
- usageCount 上限：200
- rating 满分：5

## 四、热门推荐

### 4.1 逻辑说明

热门推荐基于质量分数降序排列，同时考虑资源的：
- 点赞数（likeCount）
- 下载数（downloads）
- 平均评分（averageRating）

### 4.2 查询条件

```
status = 'approved'
visibility IN ['public', 'enterprise', 'shared']
```

可选过滤：
- `category`：按分类筛选
- `enterpriseId`：企业场景下包含企业内资源

## 五、最新推荐

### 5.1 逻辑说明

最新推荐按资源的 `createdAt` 字段降序排列，返回最近创建的资源。

### 5.2 查询条件

```
status = 'approved'
visibility IN ['public', 'enterprise', 'shared']
createdAt >= (当前时间 - 30天)
```

可选过滤：
- `resourceType`：资源类型（skill/prompt）
- `category`：按分类筛选
- `enterpriseId`：企业场景下包含企业内资源

## 六、相似推荐

### 6.1 逻辑说明

相似推荐基于目标资源的特征，计算与候选资源的相似度。相似度考虑：
- 分类匹配
- 标签重叠
- 兼容性匹配（仅 Skills）

### 6.2 相似度计算

```
SimilarityScore = CategoryMatch × 0.4 + TagOverlap × 0.4 + CompatibilityMatch × 0.2
```

| 匹配维度 | 权重 | 说明 |
|----------|------|------|
| CategoryMatch | 0.4 | 分类相同为 1，否则为 0 |
| TagOverlap | 0.4 | 标签重叠比例 |
| CompatibilityMatch | 0.2 | 兼容性重叠比例（仅 Skill） |

### 6.3 查询条件

```
status = 'approved'
visibility IN ['public', 'enterprise', 'shared']
_id != {resourceId}
category = {目标资源category}
```

## 七、个性化推荐

### 7.1 逻辑说明

个性化推荐基于用户历史行为数据，追踪用户对资源的：
- 浏览行为
- 点赞行为
- 收藏行为
- 使用行为

### 7.2 用户行为追踪

系统通过 `UserBehavior` 模型记录用户行为：

| 行为类型 | 说明 |
|----------|------|
| view | 浏览资源 |
| like | 点赞资源 |
| favorite | 收藏资源 |
| use | 使用资源 |
| download | 下载资源 |

### 7.3 推荐生成逻辑

1. 分析用户历史行为，提取偏好特征（分类、标签）
2. 基于偏好特征匹配高质量资源
3. 排除用户已浏览/点赞/收藏的资源
4. 按质量分数排序返回

## 八、API 接口

### 8.1 推荐接口

```
GET /api/recommendations
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 推荐类型：popular/new/similar/personalized |
| resourceType | string | 否 | 资源类型：skill/prompt（默认两者都返回） |
| resourceId | string | 否 | 目标资源 ID（similar 类型必填） |
| limit | number | 否 | 返回数量（默认 10） |
| category | string | 否 | 分类筛选 |
| enterpriseId | string | 否 | 企业 ID |

**响应示例：**

```json
{
  "skills": [
    {
      "_id": "resource_id",
      "name": "Skill Name",
      "description": "Description",
      "category": "general",
      "tags": ["tag1", "tag2"],
      "version": "1.0.0",
      "averageRating": 4.5,
      "likeCount": 50,
      "downloads": 100,
      "usageCount": 200,
      "createdAt": "2026-03-01T00:00:00Z",
      "qualityScore": 0.85
    }
  ],
  "prompts": [
    {
      "_id": "resource_id",
      "name": "Prompt Name",
      "description": "Description",
      "category": "general",
      "tags": ["tag1"],
      "version": "1.0.0",
      "averageRating": 4.2,
      "likeCount": 30,
      "usageCount": 150,
      "createdAt": "2026-03-01T00:00:00Z",
      "qualityScore": 0.72
    }
  ]
}
```

## 九、数据模型

### 9.1 Skill 模型推荐相关字段

| 字段 | 类型 | 说明 |
|------|------|------|
| likeCount | number | 点赞数 |
| favoriteCount | number | 收藏数 |
| downloads | number | 下载数 |
| usageCount | number | 使用次数 |
| averageRating | number | 平均评分 |
| status | string | 状态：draft/pending/approved/rejected |
| visibility | string | 可见性：public/private/enterprise/shared |

### 9.2 Prompt 模型推荐相关字段

| 字段 | 类型 | 说明 |
|------|------|------|
| likeCount | number | 点赞数 |
| favoriteCount | number | 收藏数 |
| usageCount | number | 使用次数 |
| averageRating | number | 平均评分 |
| status | string | 状态：draft/pending/approved/rejected |
| visibility | string | 可见性：public/private/enterprise/shared |

### 9.3 UserBehavior 模型

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | ObjectId | 用户 ID |
| resourceType | string | 资源类型：skill/prompt |
| resourceId | ObjectId | 资源 ID |
| behaviorType | string | 行为类型：view/like/favorite/use/download |
| createdAt | Date | 行为时间 |

## 十、缓存策略

为提升推荐接口响应速度，系统采用以下缓存策略：

| 策略 | 说明 |
|------|------|
| 热门推荐缓存 | 热门资源列表缓存 5 分钟 |
| 最新推荐缓存 | 最新资源列表缓存 1 分钟 |
| 分类缓存 | 按分类的推荐结果独立缓存 |

## 十一、计分权重调整

质量分数的权重可根据业务需求调整。当前默认权重：

| 维度 | 权重 | 原因 |
|------|------|------|
| 点赞数 | 0.35 | 社区认可度的重要指标 |
| 下载数 | 0.35 | 实际使用量的直接体现 |
| 评分 | 0.20 | 质量主观评价 |
| 使用次数 | 0.10 | 活跃度指标 |

调整建议：
- 如需强调社区活跃度：提高 LikeScore 和 UsageScore 权重
- 如需强调商业价值：提高 DownloadScore 权重
- 如需强调内容质量：提高 RatingScore 权重
