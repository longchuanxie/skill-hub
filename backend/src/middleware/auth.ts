import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { User } from '../models/User';
import { createLogger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../utils/errors';
import { isTokenRevoked } from '../utils/tokenBlacklist';

const logger = createLogger('authMiddleware');

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed - no token provided', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      res.status(401).json(createErrorResponse(ErrorCode.TOKEN_MISSING));
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (await isTokenRevoked(token)) {
      logger.warn('Authentication failed - token revoked', {
        userId: payload.userId,
        path: req.path,
        method: req.method,
      });
      res.status(401).json(createErrorResponse(ErrorCode.TOKEN_INVALID));
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      logger.warn('Authentication failed - user not found', {
        userId: payload.userId,
        path: req.path,
        method: req.method,
      });
      res.status(404).json(createErrorResponse(ErrorCode.USER_NOT_FOUND));
      return;
    }

    req.user = payload;
    logger.debug('User authenticated successfully', {
      userId: payload.userId,
      path: req.path,
      method: req.method,
    });
    next();
  } catch (error) {
    logger.warn('Authentication failed - invalid token', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(401).json(createErrorResponse(ErrorCode.TOKEN_INVALID));
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next();
  }
};
