import { Response, Request } from 'express';
import { Enterprise } from '../models/Enterprise';
import { User } from '../models/User';
import { Invitation } from '../models/Invitation';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import { getFileUrl } from '../middleware/upload';
import { createLogger } from '../utils/logger';
import crypto from 'crypto';
import { ErrorCode, createErrorResponse } from '../utils/errors';

const logger = createLogger('EnterpriseController');

export const createEnterprise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    logger.info('Creating enterprise', { userId: req.user?.userId, name });

    const existingEnterprise = await Enterprise.findOne({ owner: req.user?.userId });
    if (existingEnterprise) {
      logger.warn('Create enterprise failed - user already owns an enterprise', {
        userId: req.user?.userId,
      });
      res.status(400).json(createErrorResponse(ErrorCode.OPERATION_NOT_ALLOWED));
      return;
    }

    const existingName = await Enterprise.findOne({ name });
    if (existingName) {
      logger.warn('Create enterprise failed - name already exists', { name });
      res.status(400).json(createErrorResponse(ErrorCode.DUPLICATE_RESOURCE));
      return;
    }

    const enterprise = new Enterprise({
      name,
      description,
      owner: req.user?.userId,
      members: [{ userId: req.user?.userId, role: 'admin' }],
    });

    await enterprise.save();

    const user = await User.findById(req.user?.userId);
    if (user) {
      user.enterpriseId = enterprise._id as any;
      await user.save();
    }

    logger.info('Enterprise created successfully', {
      enterpriseId: enterprise._id,
      userId: req.user?.userId,
      name,
    });

    res.status(201).json(enterprise);
  } catch (error: any) {
    if (error.code === 11000) {
      logger.warn('Create enterprise failed - duplicate key error', { name: req.body.name });
      res.status(400).json(createErrorResponse(ErrorCode.DUPLICATE_RESOURCE));
      return;
    }
    logger.error('Create enterprise failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.userId,
    });
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const getEnterprise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    logger.debug('Getting enterprise by ID', { enterpriseId: id, userId: req.user?.userId });

    const enterprise = await Enterprise.findById(id)
      .populate('owner', 'username email avatar')
      .populate('members.userId', 'username email avatar');

    if (!enterprise) {
      logger.warn('Get enterprise failed - enterprise not found', {
        enterpriseId: id,
        userId: req.user?.userId,
      });
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    const isMember = enterprise.members.some(
      (m) => (m.userId as any)._id?.toString() === req.user?.userId,
    );
    const isOwner = (enterprise.owner as any)._id?.toString() === req.user?.userId;

    if (!isMember && !isOwner && enterprise.subscription.plan === 'free') {
      logger.warn('Get enterprise failed - access denied', {
        enterpriseId: id,
        userId: req.user?.userId,
        plan: enterprise.subscription.plan,
      });
      res.status(403).json(createErrorResponse(ErrorCode.ACCESS_DENIED));
      return;
    }

    res.json(enterprise);
  } catch (error) {
    logger.error('Get enterprise failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      enterpriseId: req.params.id,
    });
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const getMyEnterprise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enterprise = await Enterprise.findOne({ 'members.userId': req.user?.userId })
      .populate('owner', 'username email avatar')
      .populate('members.userId', 'username email avatar');

    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    res.json(enterprise);
  } catch (error) {
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const updateEnterprise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    const isAdmin = enterprise.members.some(
      (m) => m.userId.toString() === req.user?.userId && m.role === 'admin',
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json(createErrorResponse(ErrorCode.NOT_AUTHORIZED));
      return;
    }

    if (req.file) {
      updates.logo = getFileUrl(req.file.filename);
    }

    Object.assign(enterprise, updates);
    await enterprise.save();
    res.json(enterprise);
  } catch (error) {
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const inviteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    const isAdmin = enterprise.members.some(
      (m) => m.userId.toString() === req.user?.userId && m.role === 'admin',
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json(createErrorResponse(ErrorCode.NOT_AUTHORIZED));
      return;
    }

    const existingMember = await User.findOne({ email, enterpriseId: id });
    if (existingMember) {
      res.status(400).json(createErrorResponse(ErrorCode.USER_ALREADY_MEMBER));
      return;
    }

    const existingInvitation = await Invitation.findOne({
      email,
      enterpriseId: id,
      status: 'pending',
    });
    if (existingInvitation) {
      res.status(400).json(createErrorResponse(ErrorCode.INVITATION_PENDING_EXISTS));
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const invitation = new Invitation({
      email,
      enterpriseId: id,
      invitedBy: req.user?.userId,
      role: role as 'admin' | 'member',
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await invitation.save();

    await AuditLog.create({
      action: 'invite_member',
      actor: req.user?.userId,
      targetType: 'enterprise',
      targetId: id,
      details: { email, role },
    });

    logger.info('Invitation created', { invitationId: invitation._id, email, enterpriseId: id });

    res.status(201).json(invitation);
  } catch (error) {
    logger.error('Failed to invite member', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const getInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    const isAdmin = enterprise.members.some(
      (m) => m.userId.toString() === req.user?.userId && m.role === 'admin',
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json(createErrorResponse(ErrorCode.NOT_AUTHORIZED));
      return;
    }

    const invitations = await Invitation.find({ enterpriseId: id })
      .populate('invitedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    logger.error('Failed to get invitations', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const acceptInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      res.status(404).json(createErrorResponse(ErrorCode.INVITATION_NOT_FOUND));
      return;
    }

    if (invitation.status !== 'pending') {
      res.status(400).json(createErrorResponse(ErrorCode.INVITATION_ALREADY_PROCESSED));
      return;
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      res.status(400).json(createErrorResponse(ErrorCode.INVITATION_EXPIRED));
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json(createErrorResponse(ErrorCode.USER_NOT_FOUND));
      return;
    }

    if (user.email !== invitation.email) {
      res.status(400).json(createErrorResponse(ErrorCode.INVITATION_EMAIL_MISMATCH));
      return;
    }

    const enterprise = await Enterprise.findById(invitation.enterpriseId);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    // Idempotent join sequence (no multi-document transaction available):
    // every step is safe to retry after a partial failure.
    // 1. Add to the enterprise roster only if not already a member.
    await Enterprise.updateOne(
      { _id: enterprise._id, 'members.userId': { $ne: user._id } },
      {
        $push: {
          members: {
            userId: user._id as any,
            role: invitation.role,
            joinedAt: new Date(),
          },
        },
      },
    );

    // 2. Leave any previous enterprise roster before switching.
    if (user.enterpriseId && String(user.enterpriseId) !== String(enterprise._id)) {
      await Enterprise.updateOne(
        { _id: user.enterpriseId },
        { $pull: { members: { userId: user._id } } },
      );
    }

    // 3. Point the user at the new enterprise.
    user.enterpriseId = enterprise._id as any;
    await user.save();

    // 4. Mark the invitation accepted only if still pending (replay-safe).
    await Invitation.updateOne({ _id: invitation._id, status: 'pending' }, { status: 'accepted' });

    await AuditLog.create({
      action: 'accept_invitation',
      actor: user._id,
      targetType: 'enterprise',
      targetId: enterprise._id,
      details: { invitationId: invitation._id },
    });

    logger.info('Invitation accepted', {
      invitationId: invitation._id,
      userId: user._id,
      enterpriseId: enterprise._id,
    });

    res.json({ message: 'Invitation accepted successfully', enterprise });
  } catch (error) {
    logger.error('Failed to accept invitation', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const declineInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      res.status(404).json(createErrorResponse(ErrorCode.INVITATION_NOT_FOUND));
      return;
    }

    if (invitation.status !== 'pending') {
      res.status(400).json(createErrorResponse(ErrorCode.INVITATION_ALREADY_PROCESSED));
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json(createErrorResponse(ErrorCode.USER_NOT_FOUND));
      return;
    }

    if (user.email !== invitation.email) {
      res.status(400).json(createErrorResponse(ErrorCode.INVITATION_EMAIL_MISMATCH));
      return;
    }

    invitation.status = 'declined';
    await invitation.save();

    await AuditLog.create({
      action: 'decline_invitation',
      actor: user._id,
      targetType: 'enterprise',
      targetId: invitation.enterpriseId,
      details: { invitationId: invitation._id },
    });

    logger.info('Invitation declined', { invitationId: invitation._id, userId: user._id });

    res.json({ message: 'Invitation declined successfully' });
  } catch (error) {
    logger.error('Failed to decline invitation', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const cancelInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, invitationId } = req.params;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    const isAdmin = enterprise.members.some(
      (m) => m.userId.toString() === req.user?.userId && m.role === 'admin',
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json(createErrorResponse(ErrorCode.NOT_AUTHORIZED));
      return;
    }

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      res.status(404).json(createErrorResponse(ErrorCode.INVITATION_NOT_FOUND));
      return;
    }

    if (invitation.enterpriseId.toString() !== id) {
      res.status(400).json(createErrorResponse(ErrorCode.OPERATION_NOT_ALLOWED));
      return;
    }

    await Invitation.findByIdAndDelete(invitationId);

    await AuditLog.create({
      action: 'cancel_invitation',
      actor: req.user?.userId,
      targetType: 'enterprise',
      targetId: id,
      details: { invitationId, email: invitation.email },
    });

    logger.info('Invitation cancelled', { invitationId, enterpriseId: id });

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    logger.error('Failed to cancel invitation', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    const isAdmin = enterprise.members.some(
      (m) => m.userId.toString() === req.user?.userId && m.role === 'admin',
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json(createErrorResponse(ErrorCode.NOT_AUTHORIZED));
      return;
    }

    enterprise.members = enterprise.members.filter((m) => m.userId.toString() !== memberId);
    await enterprise.save();

    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    const isOwner = enterprise.owner.toString() === req.user?.userId;
    if (!isOwner) {
      res.status(403).json(createErrorResponse(ErrorCode.FORBIDDEN));
      return;
    }

    const member = enterprise.members.find((m) => m.userId.toString() === memberId);
    if (!member) {
      res.status(404).json(createErrorResponse(ErrorCode.USER_NOT_FOUND));
      return;
    }

    member.role = role;
    await enterprise.save();

    res.json({ message: 'Role updated' });
  } catch (error) {
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const leaveEnterprise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json(createErrorResponse(ErrorCode.UNAUTHORIZED));
      return;
    }

    const user = await User.findById(userId);
    if (!user || !user.enterpriseId) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    const enterprise = await Enterprise.findById(user.enterpriseId);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    if (enterprise.owner.toString() === userId) {
      res.status(400).json(createErrorResponse(ErrorCode.OPERATION_NOT_ALLOWED));
      return;
    }

    enterprise.members = enterprise.members.filter((m) => m.userId.toString() !== userId);
    await enterprise.save();

    user.enterpriseId = undefined;
    user.role = 'user';
    await user.save();

    res.json({ message: 'Successfully left enterprise' });
  } catch (error) {
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const updateAuthSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { passwordLoginEnabled, oauthRequired } = req.body;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    const isAdmin = enterprise.members.some(
      (m) => m.userId.toString() === req.user?.userId && m.role === 'admin',
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json(createErrorResponse(ErrorCode.NOT_AUTHORIZED));
      return;
    }

    if (passwordLoginEnabled !== undefined) {
      enterprise.settings.auth.passwordLoginEnabled = passwordLoginEnabled;
    }
    if (oauthRequired !== undefined) {
      enterprise.settings.auth.oauthRequired = oauthRequired;
    }

    await enterprise.save();
    res.json({
      message: 'Auth settings updated',
      settings: enterprise.settings.auth,
    });
  } catch (error) {
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const getAuthSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    const isMember = enterprise.members.some((m) => m.userId.toString() === req.user?.userId);
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isMember && !isOwner) {
      res.status(403).json(createErrorResponse(ErrorCode.NOT_AUTHORIZED));
      return;
    }

    res.json(enterprise.settings.auth);
  } catch (error) {
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const getAuthSettingsPublic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    res.json({
      passwordLoginEnabled: enterprise.settings.auth.passwordLoginEnabled,
      oauthRequired: enterprise.settings.auth.oauthRequired,
    });
  } catch (error) {
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const getResourceReviewSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    const isMember = enterprise.members.some((m) => m.userId.toString() === req.user?.userId);
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isMember && !isOwner) {
      res.status(403).json(createErrorResponse(ErrorCode.NOT_AUTHORIZED));
      return;
    }

    res.json(enterprise.settings.resourceReview);
  } catch (error) {
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const updateResourceReviewSettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { autoApprove, enableContentFilter } = req.body;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json(createErrorResponse(ErrorCode.ENTERPRISE_NOT_FOUND));
      return;
    }

    const isAdmin = enterprise.members.some(
      (m) => m.userId.toString() === req.user?.userId && m.role === 'admin',
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json(createErrorResponse(ErrorCode.NOT_AUTHORIZED));
      return;
    }

    if (autoApprove !== undefined) {
      enterprise.settings.resourceReview.autoApprove = autoApprove;
    }
    if (enableContentFilter !== undefined) {
      enterprise.settings.resourceReview.enableContentFilter = enableContentFilter;
    }

    await enterprise.save();
    res.json({
      message: 'Resource review settings updated',
      settings: enterprise.settings.resourceReview,
    });
  } catch (error) {
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};
