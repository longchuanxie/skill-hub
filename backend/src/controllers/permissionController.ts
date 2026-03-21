import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SkillPermissions } from '../models/SkillPermissions';
import { PermissionAuditLog } from '../models/PermissionAuditLog';
import { Skill } from '../models/Skill';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

export const getPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to view permissions'
      });
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
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions'
    });
  }
};

export const updatePermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;
    const { visibility, password, allowComments, allowForks } = req.body;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update permissions'
      });
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

    if (visibility === 'password-protected' && password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      permissions.password = hashedPassword;
    } else if (visibility !== 'password-protected') {
      permissions.password = undefined;
    }

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
    console.error('Update permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update permissions'
    });
  }
};

export const addCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;
    const { userId, role } = req.body;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to add collaborator'
      });
      return;
    }

    if (String(skill.owner) === userId) {
      res.status(400).json({
        success: false,
        error: 'Cannot add owner as collaborator'
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    let permissions = await SkillPermissions.findOne({ skillId });
    if (!permissions) {
      permissions = new SkillPermissions({ skillId });
    }

    const existingCollaborator = permissions.collaborators.find(
      c => String(c.userId) === userId
    );

    if (existingCollaborator) {
      res.status(400).json({
        success: false,
        error: 'User is already a collaborator'
      });
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
    console.error('Add collaborator error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add collaborator'
    });
  }
};

export const updateCollaboratorPermission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, userId } = req.params;
    const { role } = req.body;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update collaborator'
      });
      return;
    }

    const permissions = await SkillPermissions.findOne({ skillId });
    if (!permissions) {
      res.status(404).json({
        success: false,
        error: 'Permissions not found'
      });
      return;
    }

    const collaborator = permissions.collaborators.find(
      c => String(c.userId) === userId
    );

    if (!collaborator) {
      res.status(404).json({
        success: false,
        error: 'Collaborator not found'
      });
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
    console.error('Update collaborator error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update collaborator'
    });
  }
};

export const removeCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, userId } = req.params;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to remove collaborator'
      });
      return;
    }

    const permissions = await SkillPermissions.findOne({ skillId });
    if (!permissions) {
      res.status(404).json({
        success: false,
        error: 'Permissions not found'
      });
      return;
    }

    const collaboratorIndex = permissions.collaborators.findIndex(
      c => String(c.userId) === userId
    );

    if (collaboratorIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Collaborator not found'
      });
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
    console.error('Remove collaborator error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove collaborator'
    });
  }
};

export const getPermissionAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
      return;
    }

    if (String(skill.owner) !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to view audit logs'
      });
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
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
};

export const checkPermission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;
    const { permission } = req.query;

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
      return;
    }

    let hasPermission = false;
    let reason = '';

    const isOwner = req.user?.userId && String(skill.owner) === req.user.userId;
    const isPublic = skill.visibility === 'public';

    if (permission === 'view') {
      hasPermission = !!(isOwner || isPublic);
      reason = isOwner ? 'User is owner' : isPublic ? 'Skill is public' : 'No access';
    } else if (permission === 'edit' || permission === 'delete' || permission === 'manage') {
      hasPermission = !!isOwner;
      reason = isOwner ? 'User is owner' : 'Not authorized';
    }

    if (!hasPermission && req.user?.userId) {
      const permissions = await SkillPermissions.findOne({ skillId });
      if (permissions) {
        const collaborator = permissions.collaborators.find(
          c => String(c.userId) === req.user?.userId
        );
        if (collaborator) {
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

    res.json({
      success: true,
      data: {
        hasPermission,
        reason
      }
    });
  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check permission'
    });
  }
};
