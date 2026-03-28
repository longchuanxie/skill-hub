import { Response } from 'express';
import { User } from '../models/User';
import { Enterprise } from '../models/Enterprise';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../utils/errors';
import { AuditLog } from '../models/AuditLog';

const logger = createLogger('AdminController');

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.info('Getting dashboard stats', { adminId: req.user?.userId });

    const [totalUsers, totalEnterprises, totalSkills, totalPrompts, pendingSkills, pendingPrompts] = await Promise.all([
      User.countDocuments(),
      Enterprise.countDocuments(),
      Skill.countDocuments(),
      Prompt.countDocuments(),
      Skill.countDocuments({ status: 'pending' }),
      Prompt.countDocuments({ status: 'pending' }),
    ]);
    
    const pendingContent = pendingSkills + pendingPrompts;

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('username email avatar role createdAt');

    logger.info('Dashboard stats retrieved successfully', { 
      totalUsers, totalEnterprises, totalSkills, totalPrompts, pendingContent 
    });

    res.json({
      totalUsers,
      totalEnterprises,
      totalSkills,
      totalPrompts,
      pendingContent,
      recentUsers,
    });
  } catch (error) {
    logger.error('Get dashboard stats failed', { 
      error: error instanceof Error ? error.message : String(error), 
      stack: error instanceof Error ? error.stack : undefined 
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getUserList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 20, search, role, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    logger.debug('Getting user list', { 
      adminId: req.user?.userId, page, pageSize, search, role, status 
    });

    const filter: any = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('enterpriseId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      User.countDocuments(filter)
    ]);

    logger.info('User list retrieved successfully', { count: users.length, total });

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
    logger.error('Get user list failed', { 
      error: error instanceof Error ? error.message : String(error), 
      stack: error instanceof Error ? error.stack : undefined 
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    logger.debug('Getting user by ID', { adminId: req.user?.userId, userId: id });
    
    const user = await User.findById(id)
      .select('-password')
      .populate('enterpriseId', 'name');
    
    if (!user) {
      logger.warn('Get user failed - user not found', { adminId: req.user?.userId, userId: id });
      const error = createErrorResponse(ErrorCode.USER_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    res.json(user);
  } catch (error) {
    logger.error('Get user failed', { 
      error: error instanceof Error ? error.message : String(error), 
      stack: error instanceof Error ? error.stack : undefined, 
      userId: req.params.id 
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    logger.info('Updating user role', { 
      adminId: req.user?.userId, userId: id, newRole: role 
    });

    const user = await User.findById(id);
    if (!user) {
      logger.warn('Update user role failed - user not found', { adminId: req.user?.userId, userId: id });
      const error = createErrorResponse(ErrorCode.USER_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await AuditLog.create({
      action: 'user.role.update',
      actor: req.user?.userId,
      targetType: 'user',
      targetId: user._id,
      details: { oldRole, newRole: role },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info('User role updated successfully', { userId: id, oldRole, newRole: role });

    res.json({ message: 'Role updated', user: { id: user._id, role: user.role } });
  } catch (error) {
    logger.error('Update user role failed', { 
      error: error instanceof Error ? error.message : String(error), 
      stack: error instanceof Error ? error.stack : undefined, 
      userId: req.params.id 
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    logger.info('Updating user status', { 
      adminId: req.user?.userId, userId: id, newStatus: status 
    });

    const user = await User.findById(id);
    if (!user) {
      logger.warn('Update user status failed - user not found', { adminId: req.user?.userId, userId: id });
      const error = createErrorResponse(ErrorCode.USER_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const oldStatus = (user as any).status || 'active';
    (user as any).status = status;
    await user.save();

    await AuditLog.create({
      action: 'user.status.update',
      actor: req.user?.userId,
      targetType: 'user',
      targetId: user._id,
      details: { oldStatus, newStatus: status },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info('User status updated successfully', { userId: id, oldStatus, newStatus: status });

    res.json({ message: 'Status updated', user: { id: user._id, status: (user as any).status } });
  } catch (error) {
    logger.error('Update user status failed', { 
      error: error instanceof Error ? error.message : String(error), 
      stack: error instanceof Error ? error.stack : undefined, 
      userId: req.params.id 
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getEnterpriseList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    logger.debug('Getting enterprise list', { 
      adminId: req.user?.userId, page, pageSize, search, status 
    });

    const filter: any = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (status) filter.status = status;

    const [enterprises, total] = await Promise.all([
      Enterprise.find(filter)
        .populate('owner', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      Enterprise.countDocuments(filter)
    ]);

    const enterprisesWithStats = await Promise.all(
      enterprises.map(async (enterprise) => {
        const memberCount = enterprise.members.length;
        const skillCount = await Skill.countDocuments({ enterpriseId: enterprise._id });
        const promptCount = await Prompt.countDocuments({ enterpriseId: enterprise._id });
        
        return {
          ...enterprise.toObject(),
          memberCount,
          skillCount,
          promptCount,
        };
      })
    );

    logger.info('Enterprise list retrieved successfully', { count: enterprises.length, total });

    res.json({
      enterprises: enterprisesWithStats,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        pages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    logger.error('Get enterprise list failed', { 
      error: error instanceof Error ? error.message : String(error), 
      stack: error instanceof Error ? error.stack : undefined 
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getEnterpriseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    logger.debug('Getting enterprise by ID', { adminId: req.user?.userId, enterpriseId: id });
    
    const enterprise = await Enterprise.findById(id)
      .populate('owner', 'username email avatar')
      .populate('members.userId', 'username email avatar role');
    
    if (!enterprise) {
      logger.warn('Get enterprise failed - enterprise not found', { 
        adminId: req.user?.userId, enterpriseId: id 
      });
      const error = createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const memberCount = enterprise.members.length;
    const skillCount = await Skill.countDocuments({ enterpriseId: enterprise._id });
    const promptCount = await Prompt.countDocuments({ enterpriseId: enterprise._id });

    res.json({
      ...enterprise.toObject(),
      memberCount,
      skillCount,
      promptCount,
    });
  } catch (error) {
    logger.error('Get enterprise failed', { 
      error: error instanceof Error ? error.message : String(error), 
      stack: error instanceof Error ? error.stack : undefined, 
      enterpriseId: req.params.id 
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};
