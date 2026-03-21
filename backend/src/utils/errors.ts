export enum ErrorCode {
  // 认证相关错误 (AUTH_xxx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // 授权相关错误 (AUTHZ_xxx)
  FORBIDDEN = 'FORBIDDEN',
  ACCESS_DENIED = 'ACCESS_DENIED',
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  
  // 验证相关错误 (VAL_xxx)
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  INVALID_SKILL_STRUCTURE = 'INVALID_SKILL_STRUCTURE',
  INVALID_PROMPT_STRUCTURE = 'INVALID_PROMPT_STRUCTURE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  ZIP_EMPTY = 'ZIP_EMPTY',
  
  // 资源相关错误 (RES_xxx)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  SKILL_NOT_FOUND = 'SKILL_NOT_FOUND',
  SKILL_VERSION_NOT_FOUND = 'SKILL_VERSION_NOT_FOUND',
  PROMPT_NOT_FOUND = 'PROMPT_NOT_FOUND',
  PROMPT_VERSION_NOT_FOUND = 'PROMPT_VERSION_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  
  // 业务逻辑错误 (BIZ_xxx)
  PUBLIC_SKILL_REQUIRES_FILE = 'PUBLIC_SKILL_REQUIRES_FILE',
  NAME_REQUIRED = 'NAME_REQUIRED',
  DESCRIPTION_REQUIRED = 'DESCRIPTION_REQUIRED',
  UPDATE_DESCRIPTION_REQUIRED = 'UPDATE_DESCRIPTION_REQUIRED',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  SKILL_NAME_EXISTS_BY_OTHER = 'SKILL_NAME_EXISTS_BY_OTHER',
  PROMPT_NAME_EXISTS_BY_OTHER = 'PROMPT_NAME_EXISTS_BY_OTHER',
  
  // 服务器错误 (SRV_xxx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_PROCESS_ERROR = 'FILE_PROCESS_ERROR',
}

export interface ErrorInfo {
  code: ErrorCode;
  message: string;
  details?: any;
  statusCode: number;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: ErrorCode, message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ERROR_MESSAGES: Record<ErrorCode, { zh: string; en: string }> = {
  // 认证相关错误
  [ErrorCode.UNAUTHORIZED]: {
    zh: '请先登录',
    en: 'Please log in first'
  },
  [ErrorCode.TOKEN_EXPIRED]: {
    zh: '登录已过期，请重新登录',
    en: 'Login expired, please log in again'
  },
  [ErrorCode.TOKEN_INVALID]: {
    zh: '无效的登录凭证',
    en: 'Invalid login credentials'
  },
  
  // 授权相关错误
  [ErrorCode.FORBIDDEN]: {
    zh: '访问被禁止',
    en: 'Access forbidden'
  },
  [ErrorCode.ACCESS_DENIED]: {
    zh: '访问被拒绝',
    en: 'Access denied'
  },
  [ErrorCode.NOT_AUTHORIZED]: {
    zh: '无权执行此操作',
    en: 'Not authorized to perform this operation'
  },
  
  // 验证相关错误
  [ErrorCode.INVALID_INPUT]: {
    zh: '输入数据无效',
    en: 'Invalid input data'
  },
  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    zh: '缺少必填字段',
    en: 'Missing required field'
  },
  [ErrorCode.INVALID_FILE_TYPE]: {
    zh: '仅支持ZIP文件格式',
    en: 'Only ZIP file format is supported'
  },
  [ErrorCode.INVALID_SKILL_STRUCTURE]: {
    zh: '技能包结构无效',
    en: 'Invalid skill package structure'
  },
  [ErrorCode.INVALID_PROMPT_STRUCTURE]: {
    zh: '提示词结构无效',
    en: 'Invalid prompt structure'
  },
  [ErrorCode.FILE_TOO_LARGE]: {
    zh: '文件大小超过限制',
    en: 'File size exceeds limit'
  },
  [ErrorCode.ZIP_EMPTY]: {
    zh: 'ZIP文件为空',
    en: 'ZIP file is empty'
  },
  
  // 资源相关错误
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    zh: '资源不存在',
    en: 'Resource not found'
  },
  [ErrorCode.SKILL_NOT_FOUND]: {
    zh: '技能不存在',
    en: 'Skill not found'
  },
  [ErrorCode.SKILL_VERSION_NOT_FOUND]: {
    zh: '技能版本不存在',
    en: 'Skill version not found'
  },
  [ErrorCode.PROMPT_NOT_FOUND]: {
    zh: '提示词不存在',
    en: 'Prompt not found'
  },
  [ErrorCode.PROMPT_VERSION_NOT_FOUND]: {
    zh: '提示词版本不存在',
    en: 'Prompt version not found'
  },
  [ErrorCode.USER_NOT_FOUND]: {
    zh: '用户不存在',
    en: 'User not found'
  },
  [ErrorCode.FILE_NOT_FOUND]: {
    zh: '文件不存在',
    en: 'File not found'
  },
  
  // 业务逻辑错误
  [ErrorCode.PUBLIC_SKILL_REQUIRES_FILE]: {
    zh: '公开技能必须上传文件',
    en: 'Public skills must upload a file'
  },
  [ErrorCode.NAME_REQUIRED]: {
    zh: '技能名称必填。请提供名称或确保ZIP文件只有一个顶级目录',
    en: 'Skill name is required. Please provide a name or ensure that the ZIP file has a single top-level directory'
  },
  [ErrorCode.DESCRIPTION_REQUIRED]: {
    zh: '描述必填',
    en: 'Description is required'
  },
  [ErrorCode.UPDATE_DESCRIPTION_REQUIRED]: {
    zh: '更新说明必填',
    en: 'Update description is required'
  },
  [ErrorCode.DUPLICATE_RESOURCE]: {
    zh: '资源已存在',
    en: 'Resource already exists'
  },
  [ErrorCode.OPERATION_NOT_ALLOWED]: {
    zh: '不允许执行此操作',
    en: 'This operation is not allowed'
  },
  [ErrorCode.SKILL_NAME_EXISTS_BY_OTHER]: {
    zh: '同名技能已被其他用户使用',
    en: 'Skill name already taken by another user'
  },
  [ErrorCode.PROMPT_NAME_EXISTS_BY_OTHER]: {
    zh: '同名提示词已被其他用户使用',
    en: 'Prompt name already taken by another user'
  },
  
  // 服务器错误
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    zh: '服务器内部错误',
    en: 'Internal server error'
  },
  [ErrorCode.DATABASE_ERROR]: {
    zh: '数据库错误',
    en: 'Database error'
  },
  [ErrorCode.FILE_UPLOAD_ERROR]: {
    zh: '文件上传失败',
    en: 'File upload failed'
  },
  [ErrorCode.FILE_PROCESS_ERROR]: {
    zh: '文件处理失败',
    en: 'File processing failed'
  },
};

export function getErrorMessage(code: ErrorCode, lang: 'zh' | 'en' = 'zh'): string {
  return ERROR_MESSAGES[code]?.[lang] || ERROR_MESSAGES[code]?.zh || '未知错误';
}

export function createErrorResponse(code: ErrorCode, details?: any): ErrorInfo {
  const message = getErrorMessage(code);
  const statusCode = getStatusCode(code);
  
  return {
    code,
    message,
    details,
    statusCode,
  };
}

function getStatusCode(code: ErrorCode): number {
  if (code.startsWith('AUTH_')) return 401;
  if (code.startsWith('AUTHZ_')) return 403;
  if (code.startsWith('VAL_')) return 400;
  if (code.startsWith('RES_')) return 404;
  if (code.startsWith('BIZ_')) return 400;
  if (code.startsWith('SRV_')) return 500;
  return 500;
}