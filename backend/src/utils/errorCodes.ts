export enum ErrorCode {
  SUCCESS = 0,
  UNKNOWN_ERROR = 1,
  INVALID_PARAMETER = 2,
  MISSING_PARAMETER = 3,

  UNAUTHORIZED = 1001,
  TOKEN_EXPIRED = 1002,
  TOKEN_INVALID = 1003,
  TOKEN_MISSING = 1004,
  ACCOUNT_DISABLED = 1005,
  ACCOUNT_LOCKED = 1006,
  INVALID_CREDENTIALS = 1007,

  FORBIDDEN = 2001,
  INSUFFICIENT_PERMISSIONS = 2002,
  RESOURCE_ACCESS_DENIED = 2003,
  ENTERPRISE_ACCESS_DENIED = 2004,
  ROLE_NOT_ALLOWED = 2005,

  RESOURCE_NOT_FOUND = 3001,
  RESOURCE_ALREADY_EXISTS = 3002,
  RESOURCE_CONFLICT = 3003,
  RESOURCE_DELETED = 3004,
  RESOURCE_EXPIRED = 3005,

  SECURITY_CHECK_FAILED = 4001,
  FILE_TYPE_NOT_ALLOWED = 4002,
  FILE_SIZE_EXCEEDED = 4003,
  FILE_UPLOAD_FAILED = 4004,
  VIRUS_DETECTED = 4005,
  CONTENT_VIOLATION = 4006,
  RATE_LIMIT_EXCEEDED = 4007,
  OPERATION_NOT_ALLOWED = 4008,

  USERNAME_EXISTS = 5001,
  EMAIL_EXISTS = 5002,
  EMAIL_NOT_VERIFIED = 5003,
  WEAK_PASSWORD = 5004,
  PASSWORD_MISMATCH = 5005,
  ENTERPRISE_NOT_FOUND = 5006,
  ENTERPRISE_FULL = 5007,

  VALIDATION_ERROR = 6001,
  INVALID_EMAIL_FORMAT = 6002,
  INVALID_USERNAME_FORMAT = 6003,
  INVALID_PASSWORD_FORMAT = 6004,

  NO_FILE_AVAILABLE = 7001,
  FILE_NOT_FOUND = 7002,
  DOWNLOAD_FAILED = 7003,
  SKILL_NOT_FOUND = 7004,
  PUBLIC_SKILL_REQUIRES_FILE = 7005,
}

interface ErrorMessages {
  zh: string;
  en: string;
}

export const errorMessages: Record<ErrorCode, ErrorMessages> = {
  [ErrorCode.SUCCESS]: {
    zh: '操作成功',
    en: 'Operation successful',
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    zh: '未知错误',
    en: 'Unknown error',
  },
  [ErrorCode.INVALID_PARAMETER]: {
    zh: '参数无效',
    en: 'Invalid parameter',
  },
  [ErrorCode.MISSING_PARAMETER]: {
    zh: '缺少参数',
    en: 'Missing parameter',
  },
  [ErrorCode.UNAUTHORIZED]: {
    zh: '未授权访问',
    en: 'Unauthorized access',
  },
  [ErrorCode.TOKEN_EXPIRED]: {
    zh: '令牌已过期',
    en: 'Token expired',
  },
  [ErrorCode.TOKEN_INVALID]: {
    zh: '令牌无效',
    en: 'Invalid token',
  },
  [ErrorCode.TOKEN_MISSING]: {
    zh: '缺少令牌',
    en: 'Token missing',
  },
  [ErrorCode.ACCOUNT_DISABLED]: {
    zh: '账户已禁用',
    en: 'Account disabled',
  },
  [ErrorCode.ACCOUNT_LOCKED]: {
    zh: '账户已锁定',
    en: 'Account locked',
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    zh: '邮箱或密码错误',
    en: 'Invalid email or password',
  },
  [ErrorCode.FORBIDDEN]: {
    zh: '禁止访问',
    en: 'Access forbidden',
  },
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    zh: '权限不足',
    en: 'Insufficient permissions',
  },
  [ErrorCode.RESOURCE_ACCESS_DENIED]: {
    zh: '资源访问被拒绝',
    en: 'Resource access denied',
  },
  [ErrorCode.ENTERPRISE_ACCESS_DENIED]: {
    zh: '企业访问被拒绝',
    en: 'Enterprise access denied',
  },
  [ErrorCode.ROLE_NOT_ALLOWED]: {
    zh: '角色不允许',
    en: 'Role not allowed',
  },
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    zh: '资源未找到',
    en: 'Resource not found',
  },
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: {
    zh: '资源已存在',
    en: 'Resource already exists',
  },
  [ErrorCode.RESOURCE_CONFLICT]: {
    zh: '资源冲突',
    en: 'Resource conflict',
  },
  [ErrorCode.RESOURCE_DELETED]: {
    zh: '资源已删除',
    en: 'Resource deleted',
  },
  [ErrorCode.RESOURCE_EXPIRED]: {
    zh: '资源已过期',
    en: 'Resource expired',
  },
  [ErrorCode.SECURITY_CHECK_FAILED]: {
    zh: '安全检查失败',
    en: 'Security check failed',
  },
  [ErrorCode.FILE_TYPE_NOT_ALLOWED]: {
    zh: '文件类型不允许',
    en: 'File type not allowed',
  },
  [ErrorCode.FILE_SIZE_EXCEEDED]: {
    zh: '文件大小超限',
    en: 'File size exceeded',
  },
  [ErrorCode.FILE_UPLOAD_FAILED]: {
    zh: '文件上传失败',
    en: 'File upload failed',
  },
  [ErrorCode.VIRUS_DETECTED]: {
    zh: '检测到病毒',
    en: 'Virus detected',
  },
  [ErrorCode.CONTENT_VIOLATION]: {
    zh: '内容违规',
    en: 'Content violation',
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    zh: '请求频率超限',
    en: 'Rate limit exceeded',
  },
  [ErrorCode.OPERATION_NOT_ALLOWED]: {
    zh: '操作不允许',
    en: 'Operation not allowed',
  },
  [ErrorCode.USERNAME_EXISTS]: {
    zh: '用户名已存在',
    en: 'Username already exists',
  },
  [ErrorCode.EMAIL_EXISTS]: {
    zh: '邮箱已存在',
    en: 'Email already exists',
  },
  [ErrorCode.EMAIL_NOT_VERIFIED]: {
    zh: '邮箱未验证',
    en: 'Email not verified',
  },
  [ErrorCode.WEAK_PASSWORD]: {
    zh: '密码强度不足',
    en: 'Weak password',
  },
  [ErrorCode.PASSWORD_MISMATCH]: {
    zh: '两次密码输入不一致',
    en: 'Passwords do not match',
  },
  [ErrorCode.ENTERPRISE_NOT_FOUND]: {
    zh: '企业未找到',
    en: 'Enterprise not found',
  },
  [ErrorCode.ENTERPRISE_FULL]: {
    zh: '企业成员已满',
    en: 'Enterprise full',
  },
  [ErrorCode.VALIDATION_ERROR]: {
    zh: '验证错误',
    en: 'Validation error',
  },
  [ErrorCode.INVALID_EMAIL_FORMAT]: {
    zh: '邮箱格式无效',
    en: 'Invalid email format',
  },
  [ErrorCode.INVALID_USERNAME_FORMAT]: {
    zh: '用户名格式无效',
    en: 'Invalid username format',
  },
  [ErrorCode.INVALID_PASSWORD_FORMAT]: {
    zh: '密码格式无效',
    en: 'Invalid password format',
  },
  [ErrorCode.NO_FILE_AVAILABLE]: {
    zh: '该技能没有可下载的文件',
    en: 'No file available for this skill',
  },
  [ErrorCode.FILE_NOT_FOUND]: {
    zh: '技能文件在服务器上未找到',
    en: 'Skill file not found on server',
  },
  [ErrorCode.DOWNLOAD_FAILED]: {
    zh: '下载失败',
    en: 'Download failed',
  },
  [ErrorCode.SKILL_NOT_FOUND]: {
    zh: '技能未找到',
    en: 'Skill not found',
  },
  [ErrorCode.PUBLIC_SKILL_REQUIRES_FILE]: {
    zh: '公开技能必须上传文件',
    en: 'Public skill requires a file upload',
  },
};

export function getErrorMessage(code: ErrorCode, lang: 'zh' | 'en' = 'zh'): string {
  const messages = errorMessages[code];
  if (!messages) {
    return lang === 'zh' ? '未知错误' : 'Unknown error';
  }
  return messages[lang];
}

export function getErrorResponse(
  code: ErrorCode,
  lang: 'zh' | 'en' = 'zh',
  details?: Record<string, any>
) {
  return {
    code,
    message: getErrorMessage(code, lang),
    messageZh: errorMessages[code]?.zh || '未知错误',
    messageEn: errorMessages[code]?.en || 'Unknown error',
    details,
  };
}
