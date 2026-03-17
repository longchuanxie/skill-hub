import { Response } from 'express';
import { User } from '../models/User';
import { Enterprise } from '../models/Enterprise';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

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
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.enterpriseId) {
      const enterprise = await Enterprise.findById(user.enterpriseId);
      if (enterprise && !enterprise.settings.auth.passwordLoginEnabled) {
        const isEnterpriseAdmin = enterprise.owner.toString() === user._id.toString() ||
          enterprise.members.some(m => m.userId.toString() === user._id.toString() && m.role === 'admin');
        
        if (!isEnterpriseAdmin) {
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
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

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
    res.status(500).json({ error: 'Login failed' });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const payload = verifyToken(refreshToken);
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const newToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
};
