import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ErrorCode, ERROR_MESSAGES, getErrorMessage } from '../utils/errors';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: ErrorCode;
}

const getAcceptLanguage = (req: Request): 'zh' | 'en' => {
  const acceptLanguage = req.headers['accept-language'] || '';
  if (acceptLanguage.includes('en')) {
    return 'en';
  }
  return 'zh';
};

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const lang = getAcceptLanguage(req);
  const message = err.isOperational ? err.message : (lang === 'zh' ? '服务器内部错误' : 'Internal Server Error');

  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    isOperational: err.isOperational,
    code: err.code,
  });

  const errorResponse: any = {
    success: false,
    error: {
      message,
    },
  };

  if (err.code !== undefined) {
    errorResponse.error.code = err.code;
    errorResponse.error.messageZh = ERROR_MESSAGES[err.code]?.zh || '未知错误';
    errorResponse.error.messageEn = ERROR_MESSAGES[err.code]?.en || 'Unknown error';
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: ErrorCode;

  constructor(message: string, statusCode: number, code?: ErrorCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, ErrorCode.INVALID_INPUT);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, 404, ErrorCode.RESOURCE_NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code?: ErrorCode) {
    super(message, 409, code || ErrorCode.DUPLICATE_RESOURCE);
  }
}
