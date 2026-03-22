import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SkillPermissions } from '../models/SkillPermissions';
import { PermissionAuditLog } from '../models/PermissionAuditLog';
import { Skill } from '../models/Skill';
import { User } from '../models/User';
import { ErrorCode, createErrorResponse } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('PermissionController');

export const getPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;

    if (!req.user?.userId) {
      const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      const error = createErrorResponse(ErrorCode.NOT_AUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    let permissions = await SkillPermissions.findOne({ skillId });
    if (!permissions) {
      permissions = new SkillPermissions({
        skillId,
        visibility: skill.visibility,
        allowComments: true,
        allowForks: true,
        collaborators: []
      });
      await permissions.save();
    }

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Get permissions error', { error: error instanceof Error ? error.message : String(error) });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const updatePermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;
    const { visibility, password, allowComments, allowForks } = req.body;

    if (!req.user?.userId) {
      const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      const error = createErrorResponse(ErrorCode.NOT_AUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    let permissions = await SkillPermissions.findOne({ skillId });
    if (!permissions) {
      permissions = new SkillPermissions({ skillId });
    }

    const oldPermissions = permissions.toObject();

    if (visibility) permissions.visibility = visibility;
    if (allowComments !== undefined) permissions.allowComments = allowComments;
    if (allowForks !== undefined) permissions.allowForks = allowForks;

    await permissions.save();

    await Skill.findByIdAndUpdate(skillId, { visibility });

    await new PermissionAuditLog({
      skillId,
      action: 'update',
      details: { old: oldPermissions, new: permissions.toObject() },
      performedBy: req.user.userId
    }).save();

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Update permissions error', { error: error instanceof Error ? error.message : String(error) });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const addCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;
    const { userId, role } = req.body;

    if (!req.user?.userId) {
      const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      const error = createErrorResponse(ErrorCode.NOT_AUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    if (String(skill.owner) === userId) {
      const error = createErrorResponse(ErrorCode.OPERATION_NOT_ALLOWED, 'Cannot add owner as collaborator');
      res.status(error.statusCode).json(error);
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = createErrorResponse(ErrorCode.USER_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const owner = await User.findById(req.user.userId);
    if (owner?.enterpriseId) {
      if (!user.enterpriseId || String(user.enterpriseId) !== String(owner.enterpriseId)) {
        const error = createErrorResponse(ErrorCode.ACCESS_DENIED, 'Collaborators must be from the same enterprise');
        res.status(error.statusCode).json(error);
        return;
      }
    }

    let permissions = await SkillPermissions.findOne({ skillId });
    if (!permissions) {
      permissions = new SkillPermissions({ skillId });
    }

    const existingCollaborator = permissions.collaborators.find(
      c => String(c.userId) === userId
    );

    if (existingCollaborator) {
      const error = createErrorResponse(ErrorCode.DUPLICATE_RESOURCE, 'User is already a collaborator');
      res.status(error.statusCode).json(error);
      return;
    }

    permissions.collaborators.push({
      userId: user._id as any,
      username: user.username,
      role: role || 'viewer',
      addedBy: req.user.userId as any,
      addedAt: new Date()
    });

    await permissions.save();

    await new PermissionAuditLog({
      skillId,
      action: 'add_collaborator',
      details: { userId, username: user.username, role },
      performedBy: req.user.userId
    }).save();

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Add collaborator error', { error: error instanceof Error ? error.message : String(error) });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const updateCollaboratorPermission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, userId } = req.params;
    const { role } = req.body;

    if (!req.user?.userId) {
      const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      const error = createErrorResponse(ErrorCode.NOT_AUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const permissions = await SkillPermissions.findOne({ skillId });
    if (!permissions) {
      const error = createErrorResponse(ErrorCode.RESOURCE_NOT_FOUND, 'Permissions not found');
      res.status(error.statusCode).json(error);
      return;
    }

    const collaborator = permissions.collaborators.find(
      c => String(c.userId) === userId
    );

    if (!collaborator) {
      const error = createErrorResponse(ErrorCode.USER_NOT_FOUND, 'Collaborator not found');
      res.status(error.statusCode).json(error);
      return;
    }

    const oldRole = collaborator.role;
    collaborator.role = role;

    await permissions.save();

    await new PermissionAuditLog({
      skillId,
      action: 'update_role',
      details: { userId, oldRole, newRole: role },
      performedBy: req.user.userId
    }).save();

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Update collaborator error', { error: error instanceof Error ? error.message : String(error) });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const removeCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, userId } = req.params;

    if (!req.user?.userId) {
      const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      const error = createErrorResponse(ErrorCode.NOT_AUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const permissions = await SkillPermissions.findOne({ skillId });
    if (!permissions) {
      const error = createErrorResponse(ErrorCode.RESOURCE_NOT_FOUND, 'Permissions not found');
      res.status(error.statusCode).json(error);
      return;
    }

    const collaboratorIndex = permissions.collaborators.findIndex(
      c => String(c.userId) === userId
    );

    if (collaboratorIndex === -1) {
      const error = createErrorResponse(ErrorCode.USER_NOT_FOUND, 'Collaborator not found');
      res.status(error.statusCode).json(error);
      return;
    }

    const removedCollaborator = permissions.collaborators[collaboratorIndex];
    permissions.collaborators.splice(collaboratorIndex, 1);

    await permissions.save();

    await new PermissionAuditLog({
      skillId,
      action: 'remove_collaborator',
      details: { userId, username: removedCollaborator.username },
      performedBy: req.user.userId
    }).save();

    res.json({
      success: true,
      message: 'Collaborator removed',
      data: permissions
    });
  } catch (error) {
    logger.error('Remove collaborator error', { error: error instanceof Error ? error.message : String(error) });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getPermissionAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;

    if (!req.user?.userId) {
      const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      const error = createErrorResponse(ErrorCode.NOT_AUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const logs = await PermissionAuditLog.find({ skillId })
      .sort({ performedAt: -1 })
      .populate('performedBy', 'username');

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error('Get audit logs error', { error: error instanceof Error ? error.message : String(error) });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const checkPermission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;
    const { permission } = req.query;

    const skill = await Skill.findById(skillId).populate('owner');
    if (!skill) {
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    let hasPermission = false;
    let reason = '';

    const owner = skill.owner as any;
    const isOwner = req.user?.userId && String(owner._id) === req.user.userId;
    const isPublic = skill.visibility === 'public';
    const isShared = skill.visibility === 'shared';
    const isEnterprise = skill.visibility === 'enterprise';

    const ownerEnterpriseId = owner?.enterpriseId;

    if (permission === 'view') {
      if (isOwner) {
        hasPermission = true;
        reason = 'User is owner';
      } else if (isPublic) {
        hasPermission = true;
        reason = 'Skill is public';
      } else if (isEnterprise && req.user?.userId) {
        const currentUser = await User.findById(req.user.userId);
        if (currentUser?.enterpriseId && String(currentUser.enterpriseId) === String(ownerEnterpriseId)) {
          hasPermission = true;
          reason = 'User is from same enterprise';
        }
      }
    } else if (permission === 'edit' || permission === 'delete' || permission === 'manage') {
      if (isOwner) {
        hasPermission = true;
        reason = 'User is owner';
      }
    }

    if (!hasPermission && req.user?.userId && (isShared || isEnterprise)) {
      const permissions = await SkillPermissions.findOne({ skillId });
      if (permissions) {
        const collaborator = permissions.collaborators.find(
          c => String(c.userId) === req.user?.userId
        );
        if (collaborator) {
          const currentUser = await User.findById(req.user.userId);
          if (ownerEnterpriseId) {
            if (!currentUser?.enterpriseId || String(currentUser.enterpriseId) !== String(ownerEnterpriseId)) {
              reason = 'Collaborator must be from same enterprise';
            } else {
              if (permission === 'view') {
                hasPermission = true;
                reason = 'User is collaborator from same enterprise';
              } else if (permission === 'edit' && (collaborator.role === 'editor' || collaborator.role === 'admin')) {
                hasPermission = true;
                reason = 'User is editor/admin from same enterprise';
              } else if (permission === 'manage' && collaborator.role === 'admin') {
                hasPermission = true;
                reason = 'User is admin from same enterprise';
              }
            }
          } else {
            if (permission === 'view') {
              hasPermission = true;
              reason = 'User is collaborator';
            } else if (permission === 'edit' && (collaborator.role === 'editor' || collaborator.role === 'admin')) {
              hasPermission = true;
              reason = 'User is editor/admin';
            } else if (permission === 'manage' && collaborator.role === 'admin') {
              hasPermission = true;
              reason = 'User is admin';
            }
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        hasPermission,
        reason
      }
    });
  } catch (error) {
    logger.error('Check permission error', { error: error instanceof Error ? error.message : String(error) });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};
