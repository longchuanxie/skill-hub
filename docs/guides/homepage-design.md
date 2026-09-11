# SkillHub 前端 - 首页设计文档

## 1. 页面概述

### 1.1 页面信息
- **页面名称**: 首页
- **路由路径**: `/`
- **访问权限**: 公开
- **组件名称**: `HomePage`
- **文件位置**: `frontend/src/pages/HomePage.tsx`

### 1.2 页面目标
- 向用户介绍SkillHub平台的价值主张
- 引导用户浏览技能和提示词资源
- 展示平台的核心功能和优势
- 鼓励用户注册和使用平台

## 2. 设计原则

### 2.1 视觉设计
- **主色调**: 黑色（#000000）
- **辅助色**: 灰色系（gray-50, gray-200, gray-600, gray-800）
- **背景色**: 渐变背景（from-gray-50 via-white to-gray-100）
- **强调色**: 黑色用于主要操作和重要信息
- **圆角**: 使用rounded-xl和rounded-2xl增加现代感
- **阴影**: hover:shadow-lg增加交互反馈

### 2.2 交互设计
- **悬停效果**: 卡片边框变黑（hover:border-black）
- **过渡动画**: transition-colors和transition-all
- **按钮状态**: 使用Button组件的size="lg"变体
- **响应式**: 支持移动端和桌面端布局

### 2.3 内容组织
1. **Hero区域**: 品牌展示和价值主张
2. **功能介绍**: 三个核心功能卡片
3. **优势展示**: 深色背景的优势列表
4. **行动号召**: 引导用户注册和浏览
5. **统计数据**: 展示平台规模

## 3. 页面结构

### 3.1 Hero区域
```tsx
<div className="text-center mb-16">
  <div className="flex items-center justify-center gap-3 mb-6">
    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center">
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    </div>
    <h1 className="text-5xl font-bold text-black">SkillHub</h1>
  </div>
  <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
    发现、分享和使用高质量的AI技能与提示词，提升你的工作效率
  </p>
  <div className="flex items-center justify-center gap-4">
    <Link to="/skills">
      <Button size="lg" className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        浏览技能
      </Button>
    </Link>
    <Link to="/prompts">
      <Button size="lg" variant="outline" className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        浏览提示词
      </Button>
    </Link>
  </div>
</div>
```

### 3.2 功能介绍区域
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
  <Card className="hover:border-black transition-colors hover:shadow-lg">
    <CardContent className="p-8">
      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-black mb-3">发现资源</h3>
      <p className="text-gray-600 leading-relaxed">
        浏览我们丰富的技能和提示词库，找到适合你需求的AI工具，提升工作效率
      </p>
    </CardContent>
  </Card>
  
  <Card className="hover:border-black transition-colors hover:shadow-lg">
    <CardContent className="p-8">
      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-black mb-3">分享知识</h3>
      <p className="text-gray-600 leading-relaxed">
        上传你创建的技能和提示词，与社区分享你的创意和经验
      </p>
    </CardContent>
  </Card>
  
  <Card className="hover:border-black transition-colors hover:shadow-lg">
    <CardContent className="p-8">
      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7m0 0v7l9-11h-7" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-black mb-3">协作创新</h3>
      <p className="text-gray-600 leading-relaxed">
        与其他开发者协作，共同改进和创新AI工具，推动技术发展
      </p>
    </CardContent>
  </Card>
</div>
```

### 3.3 优势展示区域
```tsx
<div className="bg-gradient-to-r from-black to-gray-800 rounded-2xl p-12 mb-16">
  <div className="max-w-4xl mx-auto">
    <h2 className="text-3xl font-bold text-white mb-6 text-center">
      为什么选择 SkillHub？
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">高质量内容</h4>
          <p className="text-gray-300">
            所有资源都经过严格审核，确保质量和可用性
          </p>
        </div>
      </div>
      
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">活跃社区</h4>
          <p className="text-gray-300">
            拥有活跃的开发者社区，持续更新和维护资源
          </p>
        </div>
      </div>
      
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">简单易用</h4>
          <p className="text-gray-300">
            直观的界面设计，让查找和使用资源变得简单快捷
          </p>
        </div>
      </div>
      
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">免费开放</h4>
          <p className="text-gray-300">
            大部分资源免费使用，降低AI工具的使用门槛
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 3.4 行动号召区域
```tsx
<div className="text-center mb-12">
  <h2 className="text-3xl font-bold text-black mb-4">
    立即开始使用
  </h2>
  <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
    加入我们的社区，发现更多AI技能和提示词，提升你的工作效率
  </p>
  <div className="flex items-center justify-center gap-4">
    <Link to="/register">
      <Button size="lg" className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        免费注册
      </Button>
    </Link>
    <Link to="/skills">
      <Button size="lg" variant="outline" className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7m0 0v7l9-11h-7" />
        </svg>
        浏览资源
      </Button>
    </Link>
  </div>
</div>
```

### 3.5 统计数据区域
```tsx
<div className="border-t-2 border-gray-200 pt-12">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
    <div>
      <div className="text-4xl font-bold text-black mb-2">1000+</div>
      <div className="text-gray-600">AI技能</div>
    </div>
    <div>
      <div className="text-4xl font-bold text-black mb-2">5000+</div>
      <div className="text-gray-600">提示词</div>
    </div>
    <div>
      <div className="text-4xl font-bold text-black mb-2">10000+</div>
      <div className="text-gray-600">活跃用户</div>
    </div>
    <div>
      <div className="text-4xl font-bold text-black mb-2">50000+</div>
      <div className="text-gray-600">下载次数</div>
    </div>
  </div>
</div>
```

## 4. 组件依赖

### 4.1 UI组件
- `Button`: 来自 `@/components/ui/button`
- `Card`, `CardContent`: 来自 `@/components/ui/card`

### 4.2 React组件
- `Link`: 来自 `react-router-dom`

### 4.3 图标
使用Heroicons SVG图标，保持与现有页面一致

## 5. 样式规范

### 5.1 颜色使用
- **主色**: 黑色（#000000）用于主要操作和重要信息
- **背景色**: gray-50用于页面背景
- **文字色**: black用于标题，gray-600用于描述文字
- **边框色**: gray-200用于卡片边框

### 5.2 间距规范
- **页面内边距**: py-12
- **区域间距**: mb-16, mb-12
- **卡片内边距**: p-8
- **元素间距**: gap-4, gap-8

### 5.3 字体规范
- **标题**: text-5xl, text-3xl, text-xl, text-lg
- **正文**: text-xl, text-base
- **字体粗细**: font-bold, font-semibold, font-medium

### 5.4 响应式设计
- **移动端**: grid-cols-1
- **桌面端**: grid-cols-3, grid-cols-4
- **断点**: md (768px)

## 6. 路由配置

### 6.1 App.tsx配置
```tsx
import HomePage from './pages/HomePage';

// 在Routes中添加
<Route path="/" element={<Layout><HomePage /></Layout>} />
```

## 7. 性能优化

### 7.1 图片优化
- 使用SVG图标，无需加载外部图片
- 图标使用内联SVG，减少HTTP请求

### 7.2 代码分割
- 首页作为独立组件，便于代码分割
- 使用React.lazy和Suspense进行懒加载（可选）

### 7.3 CSS优化
- 使用Tailwind CSS的utility classes
- 避免内联样式，使用className

## 8. 可访问性

### 8.1 语义化HTML
- 使用适当的HTML标签（div, h1, h2, h3, p）
- 确保标题层级正确

### 8.2 键盘导航
- 所有链接和按钮可通过键盘访问
- 使用tabindex确保正确的焦点顺序

### 8.3 屏幕阅读器
- 使用aria-label为交互元素提供描述
- 确保图标有相应的文字说明

## 9. 测试要点

### 9.1 功能测试
- 验证所有链接正确跳转
- 确认按钮点击响应正常
- 检查响应式布局在不同设备上的表现

### 9.2 视觉测试
- 确认样式与设计稿一致
- 检查悬停效果和过渡动画
- 验证颜色对比度符合标准

### 9.3 性能测试
- 测量页面加载时间
- 检查LCP、FID、CLS等Core Web Vitals指标
- 优化图片和资源加载

## 10. 未来扩展

### 10.1 动态内容
- 从后端API获取实际统计数据
- 显示最新上传的技能和提示词
- 展示用户评价和推荐

### 10.2 个性化
- 根据用户浏览历史推荐内容
- 显示相关技能和提示词
- 个性化欢迎信息

### 10.3 交互增强
- 添加动画效果
- 实现滚动触发动画
- 增加微交互反馈

## 11. 维护说明

### 11.1 内容更新
- 统计数据需要定期更新
- 功能描述可能需要根据产品迭代调整
- 优势列表可根据市场反馈优化

### 11.2 样式调整
- 遵循整体设计系统规范
- 保持与其他页面的视觉一致性
- 注意颜色和间距的统一性

### 11.3 性能监控
- 监控页面加载性能
- 收集用户交互数据
- 根据数据分析优化用户体验