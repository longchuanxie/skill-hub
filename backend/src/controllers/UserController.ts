import { Response } from 'express';
import { User, IUser } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, avatar } = req.body;
    const userId = req.user?.userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        res.status(400).json({ error: 'Username already taken' });
        return;
      }
      user.username = username;
    }

    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();
    res.json({ message: 'Profile updated', user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('username avatar role createdAt');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const getUserList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const [users, total] = await Promise.all([
      User.find().select('-password').skip(skip).limit(Number(pageSize)).sort({ createdAt: -1 }),
      User.countDocuments()
    ]);

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
    res.status(500).json({ error: 'Failed to get user list' });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ message: 'Avatar uploaded', avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};
