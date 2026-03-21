import { Response } from 'express';
import { User, IUser } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../utils/logger';

const logger = createLogger('UserController');

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.debug('Getting user profile', { userId: req.user?.userId });
    
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      logger.warn('Get profile failed - user not found', { userId: req.user?.userId });
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    logger.error('Get profile failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, userId: req.user?.userId });
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, avatar } = req.body;
    const userId = req.user?.userId;

    logger.info('Updating user profile', { userId, hasUsername: !!username, hasAvatar: !!avatar });

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('Update profile failed - user not found', { userId });
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        logger.warn('Update profile failed - username already taken', { userId, username });
        res.status(400).json({ error: 'Username already taken' });
        return;
      }
      user.username = username;
    }

    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();
    
    logger.info('User profile updated successfully', { userId, username: user.username });

    res.json({ message: 'Profile updated', user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (error) {
    logger.error('Update profile failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, userId: req.user?.userId });
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    logger.debug('Getting user by ID', { userId: id, requesterId: req.user?.userId });
    
    const user = await User.findById(id).select('username avatar role createdAt');
    if (!user) {
      logger.warn('Get user failed - user not found', { userId: id });
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    logger.error('Get user failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, userId: req.params.id });
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const getUserList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    logger.debug('Getting user list', { page, pageSize, requesterId: req.user?.userId });

    const [users, total] = await Promise.all([
      User.find().select('-password').skip(skip).limit(Number(pageSize)).sort({ createdAt: -1 }),
      User.countDocuments()
    ]);

    logger.info('User list retrieved successfully', { count: users.length, total, page, pageSize });

    res.json({
      users,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        pages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    logger.error('Get user list failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    res.status(500).json({ error: 'Failed to get user list' });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      logger.warn('Upload avatar failed - no file uploaded', { userId: req.user?.userId });
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      logger.warn('Upload avatar failed - user not found', { userId: req.user?.userId });
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.avatar = `/uploads/${req.file.filename}`;
    
    logger.info('Avatar uploaded successfully', { userId: user._id, filename: req.file.filename });
    await user.save();

    res.json({ message: 'Avatar uploaded', avatar: user.avatar });
  } catch (error) {
    logger.error('Upload avatar failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, userId: req.user?.userId });
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};
