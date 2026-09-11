import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../models/User';
import { logger } from './logger';

export interface TokenPayload {
  userId: string;
  role: string;
  enterpriseId?: string;
  type?: TokenType;
}

export type TokenType = 'access' | 'refresh' | 'email-verification' | 'password-reset';

const DEV_FALLBACK_SECRET = 'dev-insecure-secret';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    logger.warn('JWT_SECRET is not set, falling back to an insecure development secret');
    return DEV_FALLBACK_SECRET;
  }
  return secret;
};

const getJwtRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_REFRESH_SECRET must be set in production');
    }
    logger.warn('JWT_REFRESH_SECRET is not set, falling back to JWT_SECRET (development only)');
    return getJwtSecret();
  }
  return secret;
};

export const generateAccessToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    role: user.role,
    enterpriseId: user.enterpriseId?.toString(),
    type: 'access',
  };
  const options: SignOptions = {
    expiresIn: '24h',
  };
  return jwt.sign(payload, getJwtSecret(), options);
};

export const generateRefreshToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    role: user.role,
    type: 'refresh',
  };
  const options: SignOptions = {
    expiresIn: '7d',
  };
  return jwt.sign(payload, getJwtRefreshSecret(), options);
};

export const verifyToken = (token: string): TokenPayload => {
  const payload = jwt.verify(token, getJwtSecret()) as TokenPayload;
  if (payload.type && payload.type !== 'access') {
    throw new Error(`Invalid token type for access: ${payload.type}`);
  }
  return payload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const payload = jwt.verify(token, getJwtRefreshSecret()) as TokenPayload;
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type: expected refresh token');
  }
  return payload;
};

export const generateEmailVerificationToken = (user: IUser): string => {
  const payload = { userId: user._id.toString(), type: 'email-verification' as const };
  const options: SignOptions = { expiresIn: '24h' };
  return jwt.sign(payload, getJwtSecret(), options);
};

export const generatePasswordResetToken = (user: IUser): string => {
  const payload = { userId: user._id.toString(), type: 'password-reset' as const };
  const options: SignOptions = { expiresIn: '1h' };
  return jwt.sign(payload, getJwtSecret(), options);
};
