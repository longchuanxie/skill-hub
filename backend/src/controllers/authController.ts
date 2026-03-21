import { Response } from 'express';
import { User } from '../models/User';
import { Enterprise } from '../models/Enterprise';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';
import { createLogger } from '../utils/logger';

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

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      logger.warn('User already exists', { email, username, existingId: existingUser._id });
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const user = new User({ username, email, password });
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
  } catch (error) {
    logger.error('Registration failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, email: req.body.email });
    res.status(500).json({ error: 'Registration failed' });
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

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn('Login failed - user not found', { email });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.enterpriseId) {
      const enterprise = await Enterprise.findById(user.enterpriseId);
      if (enterprise && !enterprise.settings.auth.passwordLoginEnabled) {
        const isEnterpriseAdmin = enterprise.owner.toString() === user._id.toString() ||
          enterprise.members.some(m => m.userId.toString() === user._id.toString() && m.role === 'admin');
        
        if (!isEnterpriseAdmin) {
          logger.warn('Login failed - password login disabled for enterprise', { userId: user._id, enterpriseId: user.enterpriseId });
          res.status(403).json({ 
            error: 'PASSWORD_LOGIN_DISABLED',
            message: 'Password login is disabled for this enterprise. Please use SSO/OAuth to login.' 
          });
          return;
        }
      }
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('Login failed - invalid password', { userId: user._id, email });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info('User logged in successfully', { userId: user._id, email: user.email, username: user.username });

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
    res.status(500).json({ error: 'Login failed' });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn('Refresh token missing');
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const payload = verifyToken(refreshToken);
    const user = await User.findById(payload.userId);
    if (!user) {
      logger.warn('Refresh token failed - user not found', { userId: payload.userId });
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const newToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    logger.info('Token refreshed successfully', { userId: user._id });

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error('Refresh token failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    res.status(401).json({ error: 'Invalid refresh token' });
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
      res.status(404).json({ error: 'User not found' });
      return;
    }
    logger.debug('Get user info', { userId: user._id });
    res.json(user);
  } catch (error) {
    logger.error('Get user failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, userId: req.user?.userId });
    res.status(500).json({ error: 'Failed to get user' });
  }
};
