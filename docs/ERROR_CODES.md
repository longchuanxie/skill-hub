# 错误码体系文档

## 概述

本系统采用统一的错误码体系，确保前后端错误处理的一致性和可维护性。

## 错误码分类

错误码按功能模块分为以下几类：

### 1. 认证相关错误 (AUTH_xxx)
| 错误码 | HTTP状态码 | 说明 |
|---------|------------|------|
| `UNAUTHORIZED` | 401 | 用户未登录 |
| `TOKEN_EXPIRED` | 401 | 登录已过期 |
| `TOKEN_INVALID` | 401 | 无效的登录凭证 |

### 2. 授权相关错误 (AUTHZ_xxx)
| 错误码 | HTTP状态码 | 说明 |
|---------|------------|------|
| `FORBIDDEN` | 403 | 访问被禁止 |
| `ACCESS_DENIED` | 403 | 访问被拒绝 |
| `NOT_AUTHORIZED` | 403 | 无权执行此操作 |

### 3. 验证相关错误 (VAL_xxx)
| 错误码 | HTTP状态码 | 说明 |
|---------|------------|------|
| `INVALID_INPUT` | 400 | 输入数据无效 |
| `MISSING_REQUIRED_FIELD` | 400 | 缺少必填字段 |
| `INVALID_FILE_TYPE` | 400 | 仅支持ZIP文件格式 |
| `INVALID_SKILL_STRUCTURE` | 400 | 技能包结构无效 |
| `INVALID_PROMPT_STRUCTURE` | 400 | 提示词结构无效 |
| `FILE_TOO_LARGE` | 400 | 文件大小超过限制 |
| `ZIP_EMPTY` | 400 | ZIP文件为空 |

### 4. 资源相关错误 (RES_xxx)
| 错误码 | HTTP状态码 | 说明 |
|---------|------------|------|
| `RESOURCE_NOT_FOUND` | 404 | 资源不存在 |
| `SKILL_NOT_FOUND` | 404 | 技能不存在 |
| `PROMPT_NOT_FOUND` | 404 | 提示词不存在 |
| `USER_NOT_FOUND` | 404 | 用户不存在 |
| `FILE_NOT_FOUND` | 404 | 文件不存在 |

### 5. 业务逻辑错误 (BIZ_xxx)
| 错误码 | HTTP状态码 | 说明 |
|---------|------------|------|
| `PUBLIC_SKILL_REQUIRES_FILE` | 400 | 公开技能必须上传文件 |
| `NAME_REQUIRED` | 400 | 技能名称必填 |
| `DESCRIPTION_REQUIRED` | 400 | 描述必填 |
| `DUPLICATE_RESOURCE` | 400 | 资源已存在 |
| `OPERATION_NOT_ALLOWED` | 400 | 不允许执行此操作 |

### 6. 服务器错误 (SRV_xxx)
| 错误码 | HTTP状态码 | 说明 |
|---------|------------|------|
| `INTERNAL_SERVER_ERROR` | 500 | 服务器内部错误 |
| `DATABASE_ERROR` | 500 | 数据库错误 |
| `FILE_UPLOAD_ERROR` | 500 | 文件上传失败 |
| `FILE_PROCESS_ERROR` | 500 | 文件处理失败 |

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
3. 在相应的Controller中使用新错误码

### 前端

1. 在 `frontend/src/i18n/locales/zh.json` 中添加中文翻译
2. 在 `frontend/src/i18n/locales/en.json` 中添加英文翻译
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
A: 后端根据请求语言返回对应的错误信息，前端使用 `useErrorHandler` 的 `getErrorMessage` 方法自动获取翻译后的信息。