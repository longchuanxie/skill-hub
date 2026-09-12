import { Response } from 'express';
import { AdminInvitation } from '../models/AdminInvitation';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';
import { createLogger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../utils/errors';
import { AuditLog } from '../models/AuditLog';
import { sendEmail } from '../utils/email';

const logger = createLogger('AdminInvitationController');

export const createInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Create invitation validation failed', { errors: errors.array() });
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, role } = req.body;
    const inviterId = req.user?.userId;

    // 检查邀请人是否为超级管理员
    const inviter = await User.findById(inviterId);
    if (!inviter || inviter.role !== 'super_admin') {
      logger.warn('Create invitation failed - insufficient permissions', { inviterId });
      const error = createErrorResponse(ErrorCode.FORBIDDEN);
      res.status(error.statusCode).json(error);
      return;
    }

    // 检查邮箱是否已被注册
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn('Create invitation failed - email already registered', { email });
      const error = createErrorResponse(ErrorCode.EMAIL_TAKEN);
      res.status(error.statusCode).json(error);
      return;
    }

    // 检查是否已有未使用的邀请
    const existingInvitation = await AdminInvitation.findOne({
      email: email.toLowerCase(),
      status: 'pending',
    });
    if (existingInvitation) {
      logger.warn('Create invitation failed - pending invitation already exists', { email });
      res.status(400).json({ message: '该邮箱已有未使用的邀请' });
      return;
    }

    // 创建邀请
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invitation = new AdminInvitation({
      email: email.toLowerCase(),
      inviterId,
      role,
      expiresAt,
    });
    await invitation.save();

    // 发送邀请邮件
    const invitationLink = `${process.env.FRONTEND_URL}/register/admin?code=${invitation.inviteCode}`;
    const mailOptions = {
      to: email,
      subject: 'SkillHub 管理员邀请',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">SkillHub 管理员邀请</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            您好，
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            您收到此邮件是因为有人邀请您成为 SkillHub 平台的管理员。
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            邀请角色：${role === 'super_admin' ? '超级管理员' : role === 'admin' ? '普通管理员' : '审计管理员'}
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            邀请有效期：7天
          </p>
          <p style="margin: 30px 0;">
            <a 
              href="${invitationLink}" 
              style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;"
            >
              接受邀请
            </a>
          </p>
          <p style="color: #999; font-size: 14px; line-height: 1.5;">
            如果您没有申请成为管理员，请忽略此邮件。
          </p>
        </div>
      `,
    };

    const emailResult = await sendEmail({
      to: email,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: invitationLink,
    });
    if (!emailResult.success) {
      logger.error('Failed to send admin invitation email', { email, error: emailResult.error });
    }

    // 记录审计日志
    await AuditLog.create({
      action: 'admin.invitation.create',
      actor: inviterId,
      targetType: 'admin_invitation',
      targetId: invitation._id,
      details: { email, role, expiresAt: invitation.expiresAt },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info('Admin invitation created successfully', {
      invitationId: invitation._id,
      email,
      role,
    });

    res.status(201).json({
      message: '邀请已发送',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
      },
    });
  } catch (error) {
    logger.error('Create invitation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const filter: any = {};
    if (status) filter.status = status;

    const [invitations, total] = await Promise.all([
      AdminInvitation.find(filter)
        .populate('inviterId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      AdminInvitation.countDocuments(filter),
    ]);

    logger.info('Get invitations successfully', { count: invitations.length, total });

    res.json({
      invitations,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        pages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    logger.error('Get invitations failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const cancelInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const inviterId = req.user?.userId;

    // 检查邀请人是否为超级管理员
    const inviter = await User.findById(inviterId);
    if (!inviter || inviter.role !== 'super_admin') {
      logger.warn('Cancel invitation failed - insufficient permissions', { inviterId });
      const error = createErrorResponse(ErrorCode.FORBIDDEN);
      res.status(error.statusCode).json(error);
      return;
    }

    const invitation = await AdminInvitation.findById(id);
    if (!invitation) {
      logger.warn('Cancel invitation failed - invitation not found', { id });
      const error = createErrorResponse(ErrorCode.INVITATION_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    if (invitation.status !== 'pending') {
      logger.warn('Cancel invitation failed - invitation already used or expired', {
        id,
        status: invitation.status,
      });
      res.status(400).json({ message: '邀请已被使用或已过期' });
      return;
    }

    invitation.status = 'expired';
    await invitation.save();

    // 记录审计日志
    await AuditLog.create({
      action: 'admin.invitation.cancel',
      actor: inviterId,
      targetType: 'admin_invitation',
      targetId: invitation._id,
      details: { email: invitation.email, role: invitation.role },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info('Invitation cancelled successfully', { id, email: invitation.email });

    res.json({ message: '邀请已取消' });
  } catch (error) {
    logger.error('Cancel invitation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      invitationId: req.params.id,
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const verifyInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code) {
      logger.warn('Verify invitation failed - code missing');
      res.status(400).json({ message: '邀请码缺失' });
      return;
    }

    const invitation = await AdminInvitation.findOne({ inviteCode: code });
    if (!invitation) {
      logger.warn('Verify invitation failed - invitation not found', { code });
      res.status(404).json({ message: '邀请不存在' });
      return;
    }

    if (!invitation.isValid()) {
      logger.warn('Verify invitation failed - invitation invalid', {
        code,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      });
      res.status(400).json({ message: '邀请已过期或已被使用' });
      return;
    }

    logger.info('Invitation verified successfully', {
      code,
      email: invitation.email,
      role: invitation.role,
    });

    res.json({
      message: '邀请有效',
      invitation: {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Verify invitation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};
