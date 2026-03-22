import { Response, Request, Express } from 'express';
import { Enterprise } from '../models/Enterprise';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { getFileUrl } from '../middleware/upload';
import { createLogger } from '../utils/logger';

const logger = createLogger('EnterpriseController');

export const createEnterprise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    
    logger.info('Creating enterprise', { userId: req.user?.userId, name });

    const existingEnterprise = await Enterprise.findOne({ owner: req.user?.userId });
    if (existingEnterprise) {
      logger.warn('Create enterprise failed - user already owns an enterprise', { userId: req.user?.userId });
      res.status(400).json({ error: 'You already own an enterprise' });
      return;
    }

    const existingName = await Enterprise.findOne({ name });
    if (existingName) {
      logger.warn('Create enterprise failed - name already exists', { name });
      res.status(400).json({ error: 'Enterprise name already exists' });
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

    logger.info('Enterprise created successfully', { enterpriseId: enterprise._id, userId: req.user?.userId, name });

    res.status(201).json(enterprise);
  } catch (error: any) {
    if (error.code === 11000) {
      logger.warn('Create enterprise failed - duplicate key error', { name: req.body.name });
      res.status(400).json({ error: 'Enterprise name already exists' });
      return;
    }
    logger.error('Create enterprise failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, userId: req.user?.userId });
    res.status(500).json({ error: 'Failed to create enterprise' });
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
      logger.warn('Get enterprise failed - enterprise not found', { enterpriseId: id, userId: req.user?.userId });
      res.status(404).json({ error: 'Enterprise not found' });
      return;
    }

    const isMember = enterprise.members.some(
      m => (m.userId as any)._id?.toString() === req.user?.userId
    );
    const isOwner = (enterprise.owner as any)._id?.toString() === req.user?.userId;

    if (!isMember && !isOwner && enterprise.subscription.plan === 'free') {
      logger.warn('Get enterprise failed - access denied', { enterpriseId: id, userId: req.user?.userId, plan: enterprise.subscription.plan });
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(enterprise);
  } catch (error) {
    logger.error('Get enterprise failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, enterpriseId: req.params.id });
    res.status(500).json({ error: 'Failed to get enterprise' });
  }
};

export const getMyEnterprise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enterprise = await Enterprise.findOne({ 'members.userId': req.user?.userId })
      .populate('owner', 'username email avatar')
      .populate('members.userId', 'username email avatar');

    if (!enterprise) {
      res.status(404).json({ error: 'No enterprise found' });
      return;
    }

    res.json(enterprise);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get enterprise' });
  }
};

export const updateEnterprise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json({ error: 'Enterprise not found' });
      return;
    }

    const isAdmin = enterprise.members.some(
      m => m.userId.toString() === req.user?.userId && m.role === 'admin'
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    if (req.file) {
      updates.logo = getFileUrl(req.file.filename);
    }

    Object.assign(enterprise, updates);
    await enterprise.save();
    res.json(enterprise);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update enterprise' });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json({ error: 'Enterprise not found' });
      return;
    }

    const isAdmin = enterprise.members.some(
      m => m.userId.toString() === req.user?.userId && m.role === 'admin'
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    res.status(501).json({ error: 'Email invitation not implemented yet' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to invite member' });
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json({ error: 'Enterprise not found' });
      return;
    }

    const isAdmin = enterprise.members.some(
      m => m.userId.toString() === req.user?.userId && m.role === 'admin'
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    enterprise.members = enterprise.members.filter(
      m => m.userId.toString() !== memberId
    );
    await enterprise.save();

    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json({ error: 'Enterprise not found' });
      return;
    }

    const isOwner = enterprise.owner.toString() === req.user?.userId;
    if (!isOwner) {
      res.status(403).json({ error: 'Only owner can change roles' });
      return;
    }

    const member = enterprise.members.find(
      m => m.userId.toString() === memberId
    );
    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    member.role = role;
    await enterprise.save();

    res.json({ message: 'Role updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

export const leaveEnterprise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || !user.enterpriseId) {
      res.status(400).json({ error: 'User is not a member of any enterprise' });
      return;
    }

    const enterprise = await Enterprise.findById(user.enterpriseId);
    if (!enterprise) {
      res.status(404).json({ error: 'Enterprise not found' });
      return;
    }

    if (enterprise.owner.toString() === userId) {
      res.status(400).json({ error: 'Owner cannot leave enterprise. Transfer ownership first.' });
      return;
    }

    enterprise.members = enterprise.members.filter(
      m => m.userId.toString() !== userId
    );
    await enterprise.save();

    user.enterpriseId = undefined;
    user.role = 'user';
    await user.save();

    res.json({ message: 'Successfully left enterprise' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave enterprise' });
  }
};

export const updateAuthSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { passwordLoginEnabled, oauthRequired } = req.body;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json({ error: 'Enterprise not found' });
      return;
    }

    const isAdmin = enterprise.members.some(
      m => m.userId.toString() === req.user?.userId && m.role === 'admin'
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: 'Not authorized' });
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
      settings: enterprise.settings.auth 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update auth settings' });
  }
};

export const getAuthSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json({ error: 'Enterprise not found' });
      return;
    }

    const isMember = enterprise.members.some(
      m => m.userId.toString() === req.user?.userId
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isMember && !isOwner) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    res.json(enterprise.settings.auth);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get auth settings' });
  }
};

export const getAuthSettingsPublic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json({ error: 'Enterprise not found' });
      return;
    }

    res.json({
      passwordLoginEnabled: enterprise.settings.auth.passwordLoginEnabled,
      oauthRequired: enterprise.settings.auth.oauthRequired
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get auth settings' });
  }
};

export const getResourceReviewSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json({ error: 'Enterprise not found' });
      return;
    }

    const isMember = enterprise.members.some(
      m => m.userId.toString() === req.user?.userId
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isMember && !isOwner) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    res.json(enterprise.settings.resourceReview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get resource review settings' });
  }
};

export const updateResourceReviewSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { autoApprove, enableContentFilter } = req.body;

    const enterprise = await Enterprise.findById(id);
    if (!enterprise) {
      res.status(404).json({ error: 'Enterprise not found' });
      return;
    }

    const isAdmin = enterprise.members.some(
      m => m.userId.toString() === req.user?.userId && m.role === 'admin'
    );
    const isOwner = enterprise.owner.toString() === req.user?.userId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: 'Not authorized' });
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
      settings: enterprise.settings.resourceReview 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update resource review settings' });
  }
};
