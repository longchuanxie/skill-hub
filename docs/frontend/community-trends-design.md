# SkillHub 前端 - 社区趋势功能设计文档

## 1. 功能概述

### 1.1 功能信息
- **功能名称**: 社区趋势
- **组件名称**: `CommunityTrends`
- **文件位置**: `frontend/src/components/CommunityTrends.tsx`
- **集成位置**: 首页、技能市场页面、提示词市场页面
- **访问权限**: 公开

### 1.2 功能目标
- 展示平台热门和趋势性的内容
- 帮助用户发现高质量和受欢迎的技能与提示词
- 提供多维度排序和筛选功能
- 增强用户参与度和内容发现体验

## 2. 设计原则

### 2.1 视觉设计
- **主色调**: 黑色（#000000）用于主要操作和重要信息
- **辅助色**: 灰色系（gray-50, gray-200, gray-600, gray-800）
- **趋势标识**: 使用上升箭头和颜色变化表示趋势
- **卡片设计**: 与现有Card组件保持一致
- **响应式**: 支持移动端和桌面端布局

### 2.2 交互设计
- **标签切换**: 平滑的标签切换动画
- **悬停效果**: 卡片边框变黑（hover:border-black）
- **过渡动画**: transition-all和duration-300
- **加载状态**: 骨架屏或加载指示器
- **空状态**: 友好的空状态提示

### 2.3 内容组织
1. **趋势标签**: 技能趋势、提示词趋势、综合趋势
2. **排序选项**: 热门、最新、评分最高
3. **趋势卡片**: 展示排名、标题、描述、趋势指标
4. **查看更多**: 链接到完整列表

## 3. 组件结构

### 3.1 主组件结构
```tsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
  {/* 标题和标签 */}
  <div className="flex items-center justify-between mb-8">
    <h2 className="text-2xl font-bold text-black">社区趋势</h2>
    <div className="flex gap-2">
      <button className="trend-tab">技能</button>
      <button className="trend-tab">提示词</button>
      <button className="trend-tab">综合</button>
    </div>
  </div>

  {/* 排序选项 */}
  <div className="flex gap-4 mb-6">
    <button className="sort-option">热门</button>
    <button className="sort-option">最新</button>
    <button className="sort-option">评分最高</button>
  </div>

  {/* 趋势列表 */}
  <div className="space-y-4">
    {/* 趋势卡片 */}
  </div>

  {/* 查看更多 */}
  <div className="text-center mt-8">
    <Link to="/trends">
      <Button variant="outline">查看更多趋势</Button>
    </Link>
  </div>
</div>
```

### 3.2 趋势卡片设计
```tsx
<div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
  {/* 排名标识 */}
  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
    {rank}
  </div>

  {/* 内容信息 */}
  <div className="flex-1">
    <div className="flex items-center gap-2 mb-1">
      <h3 className="font-semibold text-black">{title}</h3>
      {/* 趋势指标 */}
      <div className="flex items-center gap-1 text-green-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        <span className="text-sm font-medium">{trendPercentage}%</span>
      </div>
    </div>
    <p className="text-sm text-gray-600 line-clamp-1">{description}</p>
  </div>

  {/* 统计信息 */}
  <div className="flex items-center gap-6 text-sm text-gray-600">
    <div className="flex items-center gap-1">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      <span>{downloads}</span>
    </div>
    <div className="flex items-center gap-1">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <span>{rating}</span>
    </div>
  </div>
</div>
```

### 3.3 标签按钮样式
```tsx
<button className={`
  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
  ${isActive 
    ? 'bg-black text-white' 
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }
`}>
  {label}
</button>
```

### 3.4 排序选项样式
```tsx
<button className={`
  px-3 py-1.5 rounded-md text-sm transition-all duration-300
  ${isActive 
    ? 'bg-black text-white' 
    : 'text-gray-600 hover:text-black hover:bg-gray-100'
  }
`}>
  {label}
</button>
```

## 4. 组件依赖

### 4.1 外部依赖
```typescript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trendsApi, TrendItem, TrendType, SortOption } from '../api/market';
```

### 4.2 内部状态
```typescript
const [activeTab, setActiveTab] = useState<TrendType>('skills');
const [sortOption, setSortOption] = useState<SortOption>('popular');
const [trends, setTrends] = useState<TrendItem[]>([]);
const [loading, setLoading] = useState(true);
```

## 5. API集成

### 5.1 API接口
```typescript
interface TrendItem {
  id: string;
  type: 'skill' | 'prompt';
  title: string;
  description: string;
  downloads: number;
  rating: number;
  trendPercentage: number;
  rank: number;
  createdAt: string;
}

interface TrendsResponse {
  success: boolean;
  data: {
    skills: TrendItem[];
    prompts: TrendItem[];
    combined: TrendItem[];
  };
}
```

### 5.2 API调用
```typescript
const fetchTrends = async () => {
  try {
    setLoading(true);
    const response = await trendsApi.getTrends(activeTab, sortOption);
    setTrends(response.data[activeTab]);
  } catch (error) {
    console.error('Failed to fetch trends:', error);
  } finally {
    setLoading(false);
  }
};
```

## 6. 响应式设计

### 6.1 移动端适配
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 趋势卡片 */}
</div>
```

### 6.2 断点设计
- **移动端**: 单列布局，简化标签显示
- **平板**: 双列布局，完整标签显示
- **桌面**: 三列布局，完整功能

## 7. 性能优化

### 7.1 数据缓存
```typescript
const [cache, setCache] = useState<Record<string, TrendItem[]>>({});

const fetchTrends = async () => {
  const cacheKey = `${activeTab}-${sortOption}`;
  if (cache[cacheKey]) {
    setTrends(cache[cacheKey]);
    return;
  }
  // ... fetch logic
};
```

### 7.2 防抖处理
```typescript
const debouncedFetch = useMemo(
  () => debounce(fetchTrends, 300),
  [activeTab, sortOption]
);
```

## 8. 错误处理

### 8.1 加载状态
```tsx
{loading && (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
  </div>
)}
```

### 8.2 错误状态
```tsx
{error && (
  <div className="text-center py-12">
    <p className="text-red-600 mb-4">加载趋势数据失败</p>
    <Button onClick={fetchTrends}>重试</Button>
  </div>
)}
```

### 8.3 空状态
```tsx
{!loading && trends.length === 0 && (
  <div className="text-center py-12">
    <p className="text-gray-500">暂无趋势数据</p>
  </div>
)}
```

## 9. 可访问性

### 9.1 键盘导航
```tsx
<button
  className="trend-tab"
  onClick={() => setActiveTab('skills')}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setActiveTab('skills');
    }
  }}
  aria-pressed={activeTab === 'skills'}
>
  技能
</button>
```

### 9.2 屏幕阅读器
```tsx
<div role="region" aria-label="社区趋势">
  {/* 趋势内容 */}
</div>
```

## 10. 测试要点

### 10.1 功能测试
- 标签切换功能
- 排序选项切换
- 趋势数据加载
- 链接跳转功能
- 响应式布局

### 10.2 性能测试
- 数据加载速度
- 组件渲染性能
- 内存使用情况
- 网络请求优化

### 10.3 用户体验测试
- 交互流畅性
- 视觉反馈
- 错误处理
- 空状态处理

## 11. 未来扩展

### 11.1 功能增强
- 时间范围选择（周、月、年）
- 自定义筛选条件
- 趋势图表展示
- 用户个性化推荐

### 11.2 数据分析
- 趋势分析报告
- 用户行为分析
- 内容质量评估
- 社区活跃度指标