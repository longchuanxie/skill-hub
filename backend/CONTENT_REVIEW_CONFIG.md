# 内容审核配置说明

## 概述

系统支持灵活的内容审核配置，适用于私有部署场景。管理员可以通过配置文件控制审核行为，包括完全禁用审核、启用自定义审核插件等。

## 配置选项

### 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# 内容审核配置（私有部署）
CONTENT_REVIEW_ENABLED=true              # 是否启用内容审核 (true/false)
CONTENT_REVIEW_STRICT_MODE=false         # 严格模式：插件失败时拒绝上传 (true/false)
CUSTOM_REVIEW_PLUGIN_PATH=              # 自定义审核插件路径
CONTENT_REVIEW_TIMEOUT=30000            # 审核超时时间（毫秒）

# 可选：跳过特定检查项
SKIP_MALICIOUS_CODE_CHECK=false         # 跳过恶意代码检查
SKIP_SENSITIVE_INFO_CHECK=false          # 跳过敏感信息检查
SKIP_FORMAT_VALIDATION=false             # 跳过格式验证
```

## 使用场景

### 1. 完全禁用审核（私有部署）

适用于完全信任内部环境的私有部署：

```env
CONTENT_REVIEW_ENABLED=false
```

**效果：**
- 所有资源自动通过审核
- 状态直接设置为 `approved`
- 不进行任何安全检查

### 2. 启用基础审核（默认）

适用于需要基本安全检查的场景：

```env
CONTENT_REVIEW_ENABLED=true
CONTENT_REVIEW_STRICT_MODE=false
```

**效果：**
- 执行内置的安全检查
- 包括恶意代码检测、敏感信息扫描、格式验证
- 非严重问题只作为警告

### 3. 使用自定义审核插件

适用于需要特定审核逻辑的企业：

```env
CONTENT_REVIEW_ENABLED=true
CUSTOM_REVIEW_PLUGIN_PATH=./customReviewPlugin.js
CONTENT_REVIEW_STRICT_MODE=true
```

**效果：**
- 使用自定义插件进行审核
- 插件失败时拒绝上传（严格模式）
- 支持企业特定的审核规则

## 自定义审核插件开发

### 插件接口

自定义审核插件必须实现以下接口：

```typescript
import { ReviewPlugin, ReviewContext, ReviewResult } from './types/reviewPlugin';

const customPlugin: ReviewPlugin = {
  name: 'my-custom-review',
  version: '1.0.0',
  description: '自定义审核插件描述',

  async review(context: ReviewContext): Promise<ReviewResult> {
    const { resourceType, resourceData, filePath } = context;
    
    // 实现审核逻辑
    const reasons: string[] = [];
    const warnings: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // 检查规则...
    
    return {
      passed: severity !== 'high',
      reasons,
      severity,
      warnings,
      customData: {
        // 自定义数据
      }
    };
  },

  async validate(): Promise<boolean> {
    // 插件初始化验证
    return true;
  },

  async cleanup(): Promise<void> {
    // 插件清理
  }
};

export default customPlugin;
```

### 审核上下文

```typescript
interface ReviewContext {
  resourceType: 'skill' | 'prompt';    // 资源类型
  resourceData: any;                      // 资源数据
  filePath?: string;                      // 文件路径（如果有）
  userId?: string;                        // 用户ID
  enterpriseId?: string;                   // 企业ID
  metadata?: Record<string, any>;         // 元数据
}
```

### 审核结果

```typescript
interface ReviewResult {
  passed: boolean;                        // 是否通过
  reasons: string[];                      // 拒绝原因
  severity: 'low' | 'medium' | 'high';    // 严重程度
  warnings: string[];                     // 警告信息
  customData?: any;                      // 自定义数据
}
```

### 示例插件

参考 `examples/customReviewPlugin.ts` 获取完整示例。

## 配置检查

运行以下命令检查当前配置：

```bash
node check-review-config.js
```

## 测试

### 测试禁用审核

```bash
# 设置 .env
CONTENT_REVIEW_ENABLED=false

# 重启服务器
npm run dev

# 运行测试
node test-disabled-review.js
```

### 测试自定义插件

```bash
# 设置 .env
CUSTOM_REVIEW_PLUGIN_PATH=./examples/customReviewPlugin.js

# 重启服务器
npm run dev

# 上传资源测试
node test-skill-md-upload-manual.js
```

## 注意事项

1. **安全性**：禁用审核会降低安全性，仅在完全信任的环境中使用
2. **性能**：自定义插件可能影响上传性能，注意设置合理的超时时间
3. **兼容性**：自定义插件必须符合接口规范，否则会回退到内置审核
4. **日志**：审核结果会记录到日志中，便于审计和调试

## 故障排查

### 插件加载失败

检查：
1. 插件路径是否正确
2. 插件是否实现所有必需方法
3. 插件验证函数是否返回 true

### 审核超时

调整：
```env
CONTENT_REVIEW_TIMEOUT=60000  # 增加到60秒
```

### 严格模式问题

如果严格模式下插件失败导致上传被拒绝：
```env
CONTENT_REVIEW_STRICT_MODE=false  # 关闭严格模式
```

## 支持的配置项总结

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|---------|------|
| CONTENT_REVIEW_ENABLED | boolean | true | 是否启用审核 |
| CONTENT_REVIEW_STRICT_MODE | boolean | false | 严格模式 |
| CUSTOM_REVIEW_PLUGIN_PATH | string | undefined | 自定义插件路径 |
| CONTENT_REVIEW_TIMEOUT | number | 30000 | 超时时间(ms) |
| SKIP_MALICIOUS_CODE_CHECK | boolean | false | 跳过恶意代码检查 |
| SKIP_SENSITIVE_INFO_CHECK | boolean | false | 跳过敏感信息检查 |
| SKIP_FORMAT_VALIDATION | boolean | false | 跳过格式验证 |
