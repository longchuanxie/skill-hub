---
alwaysApply: false
description:  当需要创建错误码时，请按照以下规则进行命名和使用
---
# 错误码规则

## 一、错误码分类

| 前缀 | 分类 | HTTP状态码 |
|------|------|------------|
| `AUTH_` | 认证相关 | 401 |
| `AUTHZ_` | 授权相关 | 403 |
| `VAL_` | 验证相关 | 400 |
| `RES_` | 资源相关 | 404 |
| `BIZ_` | 业务逻辑 | 400 |
| `SRV_` | 服务器错误 | 500 |

## 二、命名规范

- 格式：`CATEGORY_SPECIFIC_ERROR`
- 风格：大写字母 + 下划线分隔
- 示例：`UNAUTHORIZED`、`SKILL_NOT_FOUND`、`INVALID_INPUT`

## 三、错误响应格式

```json
{
  "code": "UNAUTHORIZED",
  "message": "请先登录",
  "statusCode": 401,
  "details": null
}
```

## 四、后端使用

```typescript
import { ErrorCode, createErrorResponse } from '../utils/errors';

// 基础用法
const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
res.status(error.statusCode).json(error);

// 带详情
const error = createErrorResponse(ErrorCode.INVALID_INPUT, { field: 'email' });
```

## 五、前端使用

```typescript
import { useErrorHandler } from '../utils/errorHandler';

const { getErrorMessage, isUnauthorized, isForbidden } = useErrorHandler();

// 获取错误信息
const message = getErrorMessage(error);

// 类型检查
if (isUnauthorized(error)) navigate('/login');
```

## 六、添加新错误码

**后端** (`backend/src/utils/errors.ts`)：
1. `ErrorCode` 枚举添加错误码
2. `ERROR_MESSAGES` 添加中英文信息
3. `getStatusCode` 添加状态码映射

**前端** (`frontend/src/i18n/locales/`)：
1. `zh.json` 添加中文翻译
2. `en.json` 添加英文翻译

## 七、最佳实践

1. 始终使用 `ErrorCode` 枚举，禁止硬编码字符串
2. 验证错误提供 `details` 字段
3. 所有错误信息支持中英文国际化
4. 错误信息对用户友好，避免技术术语

