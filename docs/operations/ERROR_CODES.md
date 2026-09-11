# 错误码体系文档

---
title: 错误码体系文档
document-type: api-design
version: 2.0.0
status: approved
author: System
created-date: 2026-03-14
updated-date: 2026-03-22
related-docs:
  - docs/architecture/backend-api.md
tags:
  - error-handling
  - api-design
  - i18n
---

## 概述

本系统采用统一的错误码体系，确保前后端错误处理的一致性和可维护性。所有错误码均支持中英文国际化。

## 错误码分类

错误码按功能模块分为以下几类：

### 1. 认证相关错误 (AUTH_xxx)
| 错误码 | HTTP状态码 | 中文说明 | 英文说明 |
|---------|------------|---------|---------|
| `UNAUTHORIZED` | 401 | 请先登录 | Please log in first |
| `TOKEN_EXPIRED` | 401 | 登录已过期，请重新登录 | Login expired, please log in again |
| `TOKEN_INVALID` | 401 | 无效的登录凭证 | Invalid login credentials |
| `TOKEN_MISSING` | 401 | 缺少认证令牌 | Authentication token is missing |
| `INVALID_CREDENTIALS` | 401 | 邮箱或密码错误 | Invalid email or password |
| `INVALID_VERIFICATION_TOKEN` | 401 | 验证令牌无效 | Invalid verification token |

### 2. 授权相关错误 (AUTHZ_xxx)
| 错误码 | HTTP状态码 | 中文说明 | 英文说明 |
|---------|------------|---------|---------|
| `FORBIDDEN` | 403 | 访问被禁止 | Access forbidden |
| `ACCESS_DENIED` | 403 | 访问被拒绝 | Access denied |
| `NOT_AUTHORIZED` | 403 | 无权执行此操作 | Not authorized to perform this operation |
| `READ_PERMISSION_DENIED` | 403 | 读取权限被拒绝 | Read permission denied |

### 3. 验证相关错误 (VAL_xxx)
| 错误码 | HTTP状态码 | 中文说明 | 英文说明 |
|---------|------------|---------|---------|
| `INVALID_INPUT` | 400 | 输入数据无效 | Invalid input data |
| `MISSING_REQUIRED_FIELD` | 400 | 缺少必填字段 | Missing required field |
| `INVALID_FILE_TYPE` | 400 | 仅支持ZIP文件格式 | Only ZIP file format is supported |
| `INVALID_SKILL_STRUCTURE` | 400 | 技能包结构无效 | Invalid skill package structure |
| `INVALID_PROMPT_STRUCTURE` | 400 | 提示词结构无效 | Invalid prompt structure |
| `FILE_TOO_LARGE` | 400 | 文件大小超过限制 | File size exceeds limit |
| `ZIP_EMPTY` | 400 | ZIP文件为空 | ZIP file is empty |

### 4. 资源相关错误 (RES_xxx)
| 错误码 | HTTP状态码 | 中文说明 | 英文说明 |
|---------|------------|---------|---------|
| `RESOURCE_NOT_FOUND` | 404 | 资源不存在 | Resource not found |
| `SKILL_NOT_FOUND` | 404 | 技能不存在 | Skill not found |
| `SKILL_VERSION_NOT_FOUND` | 404 | 技能版本不存在 | Skill version not found |
| `PROMPT_NOT_FOUND` | 404 | 提示词不存在 | Prompt not found |
| `PROMPT_VERSION_NOT_FOUND` | 404 | 提示词版本不存在 | Prompt version not found |
| `USER_NOT_FOUND` | 404 | 用户不存在 | User not found |
| `FILE_NOT_FOUND` | 404 | 文件不存在 | File not found |
| `ENTERPRISE_NOT_FOUND` | 404 | 企业不存在 | Enterprise not found |

### 5. 业务逻辑错误 (BIZ_xxx)
| 错误码 | HTTP状态码 | 中文说明 | 英文说明 |
|---------|------------|---------|---------|
| `PUBLIC_SKILL_REQUIRES_FILE` | 400 | 公开技能必须上传文件 | Public skills must upload a file |
| `NAME_REQUIRED` | 400 | 技能名称必填 | Skill name is required |
| `DESCRIPTION_REQUIRED` | 400 | 描述必填 | Description is required |
| `UPDATE_DESCRIPTION_REQUIRED` | 400 | 更新说明必填 | Update description is required |
| `DUPLICATE_RESOURCE` | 400 | 资源已存在 | Resource already exists |
| `OPERATION_NOT_ALLOWED` | 400 | 不允许执行此操作 | This operation is not allowed |
| `SKILL_NAME_EXISTS_BY_OTHER` | 400 | 同名技能已被其他用户使用 | Skill name already taken by another user |
| `PROMPT_NAME_EXISTS_BY_OTHER` | 400 | 同名提示词已被其他用户使用 | Prompt name already taken by another user |
| `USERNAME_TAKEN` | 400 | 用户名已被使用 | Username already taken |
| `NO_FILE_UPLOADED` | 400 | 未上传文件 | No file uploaded |
| `NO_FILE_AVAILABLE` | 400 | 该技能没有可下载的文件 | No file available for this skill |
| `DOWNLOAD_FAILED` | 400 | 下载失败 | Download failed |

### 6. 服务器错误 (SRV_xxx)
| 错误码 | HTTP状态码 | 中文说明 | 英文说明 |
|---------|------------|---------|---------|
| `INTERNAL_SERVER_ERROR` | 500 | 服务器内部错误 | Internal server error |
| `DATABASE_ERROR` | 500 | 数据库错误 | Database error |
| `FILE_UPLOAD_ERROR` | 500 | 文件上传失败 | File upload failed |
| `FILE_PROCESS_ERROR` | 500 | 文件处理失败 | File processing failed |
| `EMAIL_SEND_FAILED` | 500 | 邮件发送失败 | Failed to send email |

## 后端使用指南

### 1. 导入错误码工具

```typescript
import { ErrorCode, createErrorResponse } from '../utils/errors';
```

### 2. 在Controller中使用

```typescript
// 创建错误响应
const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
res.status(error.statusCode).json(error);

// 带详情的错误响应
const error = createErrorResponse(ErrorCode.INVALID_SKILL_STRUCTURE, validationResult.errors);
res.status(error.statusCode).json(error);
```

### 3. 错误响应格式

```json
{
  "code": "UNAUTHORIZED",
  "message": "请先登录",
  "statusCode": 401,
  "details": null
}
```

### 4. 错误处理中间件

系统已配置全局错误处理中间件 (`errorHandler.ts`)，会自动：
- 根据请求头 `Accept-Language` 返回对应语言的错误信息
- 记录错误日志
- 在开发环境下返回错误堆栈

## 前端使用指南

### 1. 导入错误处理Hook

```typescript
import { useErrorHandler } from '../utils/errorHandler';
```

### 2. 在组件中使用

```typescript
const { getErrorMessage, getErrorCode, isUnauthorized, isForbidden } = useErrorHandler();

// 获取错误信息
try {
  await someApiCall();
} catch (error) {
  setError(getErrorMessage(error));
}

// 检查错误类型
if (isUnauthorized(error)) {
  // 处理未授权错误
  navigate('/login');
}

if (isForbidden(error)) {
  // 处理禁止访问错误
  setError('您没有权限访问此资源');
}
```

### 3. 国际化配置

错误信息已配置在以下文件中：
- 中文：`frontend/src/i18n/locales/zh.json`
- 英文：`frontend/src/i18n/locales/en.json`

添加新的错误码时，需要在这两个文件中添加对应的翻译。

### 4. 可用的错误类型检查方法

| 方法名 | 说明 |
|--------|------|
| `isUnauthorized(error)` | 检查是否为认证错误 (UNAUTHORIZED, TOKEN_EXPIRED, TOKEN_INVALID 等) |
| `isForbidden(error)` | 检查是否为授权错误 (FORBIDDEN, ACCESS_DENIED, NOT_AUTHORIZED) |
| `isNotFound(error)` | 检查是否为资源不存在错误 |
| `isValidationError(error)` | 检查是否为验证错误 (VAL_ 前缀) |
| `isServerError(error)` | 检查是否为服务器错误 (SRV_ 前缀) |

## 错误码命名规范

1. **格式**：`CATEGORY_SPECIFIC_ERROR`
2. **分类前缀**：
   - `AUTH_` - 认证相关
   - `AUTHZ_` - 授权相关
   - `VAL_` - 验证相关
   - `RES_` - 资源相关
   - `BIZ_` - 业务逻辑相关
   - `SRV_` - 服务器相关
3. **命名风格**：大写字母 + 下划线分隔

## 添加新错误码的步骤

### 后端

1. 在 `backend/src/utils/errors.ts` 中添加新的错误码到 `ErrorCode` 枚举
2. 在 `ERROR_MESSAGES` 对象中添加中英文错误信息
3. 根据错误类型，在 `getStatusCode` 函数中添加对应的 HTTP 状态码映射
4. 在相应的Controller中使用新错误码

### 前端

1. 在 `frontend/src/i18n/locales/zh.json` 的 `errors` 对象中添加中文翻译
2. 在 `frontend/src/i18n/locales/en.json` 的 `errors` 对象中添加英文翻译
3. 翻译键名为错误码字符串，例如：`"UNAUTHORIZED"`

## 最佳实践

1. **始终使用错误码**：不要直接返回字符串错误，始终使用 `ErrorCode` 枚举
2. **提供详细错误信息**：对于验证错误，提供 `details` 字段说明具体问题
3. **记录错误日志**：在返回错误前记录日志，便于问题排查
4. **前端友好提示**：错误信息应该对用户友好，避免技术术语
5. **国际化支持**：所有错误信息都应支持中英文

## 示例

### 后端示例

```typescript
export const createSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      logger.warn('Create skill failed - unauthorized', { ip: req.ip });
      const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    // ... 业务逻辑
  } catch (error) {
    logger.error('Create skill failed', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.userId 
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};
```

### 前端示例

```typescript
export default function UploadPage() {
  const { getErrorMessage, isUnauthorized } = useErrorHandler();
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      await skillApi.createSkill(skillData);
      // 成功处理
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      
      // 如果是未授权错误，跳转到登录页
      if (isUnauthorized(err)) {
        navigate('/login');
      }
    }
  };

  return (
    <div>
      {error && <Alert variant="destructive">{error}</Alert>}
      {/* ... */}
    </div>
  );
}
```

## 常见问题

### Q: 如何区分不同类型的错误？
A: 使用 `useErrorHandler` Hook 提供的类型检查方法：
- `isUnauthorized()` - 检查是否为认证错误
- `isForbidden()` - 检查是否为授权错误
- `isNotFound()` - 检查是否为资源不存在错误
- `isValidationError()` - 检查是否为验证错误
- `isServerError()` - 检查是否为服务器错误

### Q: 如何添加自定义错误详情？
A: 在 `createErrorResponse` 的第二个参数中传递详情对象：
```typescript
const error = createErrorResponse(ErrorCode.INVALID_SKILL_STRUCTURE, {
  errors: ['Missing skill.json', 'Invalid file structure']
});
```

### Q: 错误信息如何国际化？
A: 后端根据请求头 `Accept-Language` 返回对应的错误信息，前端使用 `useErrorHandler` 的 `getErrorMessage` 方法自动获取翻译后的信息。

### Q: 错误码和 HTTP 状态码的对应关系？
A: 
- 认证错误 (AUTH_xxx) → 401
- 授权错误 (AUTHZ_xxx) → 403
- 验证错误 (VAL_xxx) → 400
- 资源错误 (RES_xxx) → 404
- 业务错误 (BIZ_xxx) → 400
- 服务器错误 (SRV_xxx) → 500

## 错误码完整列表

| 分类 | 数量 | 错误码列表 |
|------|------|-----------|
| 认证相关 | 6 | UNAUTHORIZED, TOKEN_EXPIRED, TOKEN_INVALID, TOKEN_MISSING, INVALID_CREDENTIALS, INVALID_VERIFICATION_TOKEN |
| 授权相关 | 4 | FORBIDDEN, ACCESS_DENIED, NOT_AUTHORIZED, READ_PERMISSION_DENIED |
| 验证相关 | 7 | INVALID_INPUT, MISSING_REQUIRED_FIELD, INVALID_FILE_TYPE, INVALID_SKILL_STRUCTURE, INVALID_PROMPT_STRUCTURE, FILE_TOO_LARGE, ZIP_EMPTY |
| 资源相关 | 8 | RESOURCE_NOT_FOUND, SKILL_NOT_FOUND, SKILL_VERSION_NOT_FOUND, PROMPT_NOT_FOUND, PROMPT_VERSION_NOT_FOUND, USER_NOT_FOUND, FILE_NOT_FOUND, ENTERPRISE_NOT_FOUND |
| 业务逻辑 | 12 | PUBLIC_SKILL_REQUIRES_FILE, NAME_REQUIRED, DESCRIPTION_REQUIRED, UPDATE_DESCRIPTION_REQUIRED, DUPLICATE_RESOURCE, OPERATION_NOT_ALLOWED, SKILL_NAME_EXISTS_BY_OTHER, PROMPT_NAME_EXISTS_BY_OTHER, USERNAME_TAKEN, NO_FILE_UPLOADED, NO_FILE_AVAILABLE, DOWNLOAD_FAILED |
| 服务器错误 | 5 | INTERNAL_SERVER_ERROR, DATABASE_ERROR, FILE_UPLOAD_ERROR, FILE_PROCESS_ERROR, EMAIL_SEND_FAILED |
| **总计** | **42** | |

---

**最后更新**: 2026-03-22
