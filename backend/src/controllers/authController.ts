import { Response } from 'express';
import { User } from '../models/User';
import { Enterprise } from '../models/Enterprise';
import { AdminInvitation } from '../models/AdminInvitation';
import { AuditLog } from '../models/AuditLog';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';
import { createLogger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../utils/errors';
import { MAX_LOGIN_ATTEMPTS, LOCK_TIME } from '../models/User';

const logger = createLogger('authController');

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.info('User registration attempt', { email: req.body.email, username: req.body.username });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Registration validation failed', { errors: errors.array(), email: req.body.email });
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username, email, password } = req.body;

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      logger.warn('Email already registered', { email, existingId: existingEmail._id });
      const error = createErrorResponse(ErrorCode.EMAIL_TAKEN);
      res.status(error.statusCode).json(error);
      return;
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      logger.warn('Username already taken', { username, existingId: existingUsername._id });
      const error = createErrorResponse(ErrorCode.USERNAME_TAKEN);
      res.status(error.statusCode).json(error);
      return;
    }

    const user = new User({ username, email: email.toLowerCase(), password, role: 'user' });
    await user.save();

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info('User registered successfully', { userId: user._id, email: user.email, username: user.username });

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
      refreshToken,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      logger.warn('Duplicate key error on registration', { field, email: req.body.email, username: req.body.username });
      
      if (field === 'email') {
        const err = createErrorResponse(ErrorCode.EMAIL_TAKEN);
        res.status(err.statusCode).json(err);
        return;
      } else if (field === 'username') {
        const err = createErrorResponse(ErrorCode.USERNAME_TAKEN);
        res.status(err.statusCode).json(err);
        return;
      }
    }
    
    logger.error('Registration failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, email: req.body.email });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.info('User login attempt', { email: req.body.email });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Login validation failed', { errors: errors.array(), email: req.body.email });
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn('Login failed - user not found', { email });
      const error = createErrorResponse(ErrorCode.INVALID_CREDENTIALS);
      res.status(error.statusCode).json(error);
      return;
    }

    if (user.isLocked()) {
      const remainingTime = user.lockUntil ? Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000) : 15;
      logger.warn('Login failed - account locked', { userId: user._id, email, remainingTime });
      const error = createErrorResponse(ErrorCode.ACCOUNT_LOCKED, { remainingTime });
      res.status(error.statusCode).json(error);
      return;
    }

    if (user.enterpriseId) {
      const enterprise = await Enterprise.findById(user.enterpriseId);
      if (enterprise && !enterprise.settings.auth.passwordLoginEnabled) {
        const isEnterpriseAdmin = enterprise.owner.toString() === user._id.toString() ||
          enterprise.members.some(m => m.userId.toString() === user._id.toString() && m.role === 'admin');
        
        if (!isEnterpriseAdmin) {
          logger.warn('Login failed - password login disabled for enterprise', { userId: user._id, enterpriseId: user.enterpriseId });
          const error = createErrorResponse(ErrorCode.FORBIDDEN, { 
            message: 'Password login is disabled for this enterprise. Please use SSO/OAuth to login.' 
          });
          res.status(error.statusCode).json(error);
          return;
        }
      }
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
      logger.warn('Login failed - invalid password', { userId: user._id, email, attemptsLeft });
      
      if (attemptsLeft <= 0) {
        const error = createErrorResponse(ErrorCode.ACCOUNT_LOCKED, { remainingTime: 15 });
        res.status(error.statusCode).json(error);
        return;
      }
      
      const error = createErrorResponse(ErrorCode.INVALID_CREDENTIALS, { attemptsLeft });
      res.status(error.statusCode).json(error);
      return;
    }

    await user.resetLoginAttempts();
    user.lastLoginAt = new Date();
    user.lastLoginIp = clientIp;
    await user.save();

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info('User logged in successfully', { userId: user._id, email: user.email, username: user.username, ip: clientIp });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        enterpriseId: user.enterpriseId,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    logger.error('Login failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, email: req.body.email });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn('Refresh token missing');
      const error = createErrorResponse(ErrorCode.TOKEN_MISSING);
      res.status(error.statusCode).json(error);
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId);
    if (!user) {
      logger.warn('Refresh token failed - user not found', { userId: payload.userId });
      const error = createErrorResponse(ErrorCode.USER_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const newToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    logger.info('Token refreshed successfully', { userId: user._id });

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error('Refresh token failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    const err = createErrorResponse(ErrorCode.TOKEN_INVALID);
    res.status(err.statusCode).json(err);
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  logger.info('User logged out', { userId: req.user?.userId });
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      logger.warn('Get user failed - user not found', { userId: req.user?.userId });
      const error = createErrorResponse(ErrorCode.USER_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }
    logger.debug('Get user info', { userId: user._id });
    res.json(user);
  } catch (error) {
    logger.error('Get user failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, userId: req.user?.userId });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const registerAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.info('Admin registration attempt', { email: req.body.email, username: req.body.username });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Admin registration validation failed', { errors: errors.array(), email: req.body.email });
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username, email, password, inviteCode } = req.body;

    // 验证邀请码
    const invitation = await AdminInvitation.findOne({ inviteCode });
    if (!invitation) {
      logger.warn('Admin registration failed - invitation not found', { inviteCode });
      const error = createErrorResponse(ErrorCode.INVITATION_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    if (!invitation.isValid()) {
      logger.warn('Admin registration failed - invitation invalid', { inviteCode, status: invitation.status, expiresAt: invitation.expiresAt });
      res.status(400).json({ message: '邀请已过期或已被使用' });
      return;
    }

    // 确保邮箱匹配
    if (email.toLowerCase() !== invitation.email) {
      logger.warn('Admin registration failed - email mismatch', { providedEmail: email, invitationEmail: invitation.email });
      res.status(400).json({ message: '邮箱与邀请不匹配' });
      return;
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      logger.warn('Admin registration failed - email already registered', { email });
      const error = createErrorResponse(ErrorCode.EMAIL_TAKEN);
      res.status(error.statusCode).json(error);
      return;
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      logger.warn('Admin registration failed - username already taken', { username });
      const error = createErrorResponse(ErrorCode.USERNAME_TAKEN);
      res.status(error.statusCode).json(error);
      return;
    }

    // 创建管理员用户
    const user = new User({ 
      username, 
      email: email.toLowerCase(), 
      password, 
      role: invitation.role,
      isEmailVerified: true, // 管理员注册自动验证邮箱
    });
    await user.save();

    // 标记邀请为已使用
    await invitation.markAsUsed();

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 记录审计日志
    await AuditLog.create({
      action: 'admin.register',
      actor: user._id,
      targetType: 'user',
      targetId: user._id,
      details: { role: user.role, inviterId: invitation.inviterId },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info('Admin registered successfully', { userId: user._id, email: user.email, username: user.username, role: user.role });

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      token,
      refreshToken,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      logger.warn('Duplicate key error on admin registration', { field, email: req.body.email, username: req.body.username });
      
      if (field === 'email') {
        const err = createErrorResponse(ErrorCode.EMAIL_TAKEN);
        res.status(err.statusCode).json(err);
        return;
      } else if (field === 'username') {
        const err = createErrorResponse(ErrorCode.USERNAME_TAKEN);
        res.status(err.statusCode).json(err);
        return;
      }
    }
    
    logger.error('Admin registration failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, email: req.body.email });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};
