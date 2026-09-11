import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError, ErrorCode, ERROR_MESSAGES, getErrorMessage, createErrorResponse } from '../utils/errors';

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

// All error responses share the flat { code, message, statusCode } contract
// produced by createErrorResponse in utils/errors.ts.
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const lang = getAcceptLanguage(req);
  const knownCode = err.code && err.code in ERROR_MESSAGES ? err.code : undefined;

  let code: ErrorCode;
  let message: string;
  let statusCode: number;
  let details: unknown;

  if (knownCode && err instanceof AppError) {
    code = knownCode;
    message = err.message || getErrorMessage(code, lang);
    statusCode = err.statusCode;
    details = err.details;
  } else if (knownCode) {
    const mapped = createErrorResponse(knownCode);
    code = mapped.code;
    message = err.isOperational ? err.message : mapped.message;
    statusCode = err.statusCode ?? mapped.statusCode;
    details = err.isOperational ? undefined : mapped.details;
  } else {
    const mapped = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    code = mapped.code;
    message = mapped.message;
    statusCode = err.statusCode && err.statusCode < 500 ? err.statusCode : mapped.statusCode;
    details = undefined;
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    isOperational: err.isOperational ?? err instanceof AppError,
    code,
  });

  const errorResponse: {
    code: ErrorCode;
    message: string;
    statusCode: number;
    details?: unknown;
    stack?: string;
  } = { code, message, statusCode };

  if (details !== undefined) {
    errorResponse.details = details;
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};
