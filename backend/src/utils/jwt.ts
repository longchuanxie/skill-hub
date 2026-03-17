import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../models/User';

export interface TokenPayload {
  userId: string;
  role: string;
  enterpriseId?: string;
}

export const generateAccessToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    role: user.role,
    enterpriseId: user.enterpriseId?.toString(),
  };
  const options: SignOptions = {
    expiresIn: '24h',
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', options);
};

export const generateRefreshToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    role: user.role,
  };
  const options: SignOptions = {
    expiresIn: '7d',
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as TokenPayload;
};

export const generateEmailVerificationToken = (user: IUser): string => {
  const payload = { userId: user._id.toString(), type: 'email-verification' };
  const options: SignOptions = { expiresIn: '24h' };
  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', options);
};

export const generatePasswordResetToken = (user: IUser): string => {
  const payload = { userId: user._id.toString(), type: 'password-reset' };
  const options: SignOptions = { expiresIn: '1h' };
  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', options);
};
