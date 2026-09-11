import { Response } from 'express';
import { User } from '../models/User';
import { generatePasswordResetToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { ErrorCode, createErrorResponse } from '../utils/errors';
import { createLogger } from '../utils/logger';
import { sendEmail, EmailTemplates, SMTPConfig } from '../utils/email';

const logger = createLogger('passwordController');

const verificationCodes: Map<string, { code: string; expires: Date; attempts: number }> = new Map();
const MAX_VERIFICATION_ATTEMPTS = 3;
const VERIFICATION_CODE_EXPIRY = 5 * 60 * 1000;

export const generateVerificationCode = (email: string): string => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + VERIFICATION_CODE_EXPIRY);
  verificationCodes.set(email.toLowerCase(), { code, expires, attempts: 0 });
  return code;
};

export const sendVerificationCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      const error = createErrorResponse(ErrorCode.MISSING_REQUIRED_FIELD, { field: 'email' });
      res.status(error.statusCode).json(error);
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.info('Verification code requested for non-existent email', { email });
      res.json({ message: 'If email exists, verification code will be sent', expiresIn: VERIFICATION_CODE_EXPIRY / 1000 });
      return;
    }

    const code = generateVerificationCode(email);
    logger.info('Verification code generated', { email, userId: user._id });

    const template = EmailTemplates.verificationCode(code, VERIFICATION_CODE_EXPIRY / 60000);
    
    const emailResult = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!emailResult.success) {
      logger.error('Failed to send verification code email', { email, error: emailResult.error });
      const error = createErrorResponse(ErrorCode.EMAIL_SEND_FAILED);
      res.status(error.statusCode).json(error);
      return;
    }
    
    res.json({ message: 'Verification code sent', expiresIn: VERIFICATION_CODE_EXPIRY / 1000 });
  } catch (error) {
    logger.error('Send verification code failed', { error: error instanceof Error ? error.message : String(error), email: req.body.email });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const verifyCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      const error = createErrorResponse(ErrorCode.MISSING_REQUIRED_FIELD, { fields: ['email', 'code'] });
      res.status(error.statusCode).json(error);
      return;
    }

    const stored = verificationCodes.get(email.toLowerCase());
    if (!stored) {
      logger.warn('Verification code not found', { email });
      const error = createErrorResponse(ErrorCode.VERIFICATION_CODE_INVALID);
      res.status(error.statusCode).json(error);
      return;
    }

    if (new Date() > stored.expires) {
      verificationCodes.delete(email.toLowerCase());
      logger.warn('Verification code expired', { email });
      const error = createErrorResponse(ErrorCode.VERIFICATION_CODE_EXPIRED);
      res.status(error.statusCode).json(error);
      return;
    }

    if (stored.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      verificationCodes.delete(email.toLowerCase());
      logger.warn('Verification code max attempts exceeded', { email });
      const error = createErrorResponse(ErrorCode.VERIFICATION_CODE_INVALID, { message: 'Max attempts exceeded' });
      res.status(error.statusCode).json(error);
      return;
    }

    if (stored.code !== code) {
      stored.attempts += 1;
      const error = createErrorResponse(ErrorCode.VERIFICATION_CODE_INVALID, { attemptsLeft: MAX_VERIFICATION_ATTEMPTS - stored.attempts });
      res.status(error.statusCode).json(error);
      return;
    }

    verificationCodes.delete(email.toLowerCase());
    logger.info('Verification code verified', { email });
    res.json({ message: 'Verification successful' });
  } catch (error) {
    logger.error('Verify code failed', { error: error instanceof Error ? error.message : String(error), email: req.body.email });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      const error = createErrorResponse(ErrorCode.MISSING_REQUIRED_FIELD, { field: 'email' });
      res.status(error.statusCode).json(error);
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.info('Password reset requested for non-existent email', { email });
      res.json({ message: 'If email exists, password reset link will be sent', expiresIn: 3600 });
      return;
    }

    const resetToken = generatePasswordResetToken(user);
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const template = EmailTemplates.passwordReset(user.username, resetUrl);
    
    const emailResult = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!emailResult.success) {
      logger.error('Failed to send password reset email', { email, error: emailResult.error });
      const error = createErrorResponse(ErrorCode.EMAIL_SEND_FAILED);
      res.status(error.statusCode).json(error);
      return;
    }

    logger.info('Password reset email sent', { email, userId: user._id });
    res.json({ message: 'Password reset link sent', expiresIn: 3600 });
  } catch (error) {
    logger.error('Forgot password failed', { error: error instanceof Error ? error.message : String(error), email: req.body.email });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      const error = createErrorResponse(ErrorCode.MISSING_REQUIRED_FIELD, { fields: ['token', 'password'] });
      res.status(error.statusCode).json(error);
      return;
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      const existingUser = await User.findOne({ passwordResetToken: token });
      if (existingUser) {
        logger.warn('Password reset token expired', { userId: existingUser._id });
        const error = createErrorResponse(ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED);
        res.status(error.statusCode).json(error);
        return;
      }
      
      logger.warn('Password reset token invalid');
      const error = createErrorResponse(ErrorCode.PASSWORD_RESET_TOKEN_INVALID);
      res.status(error.statusCode).json(error);
      return;
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const template = EmailTemplates.passwordChanged(user.username);
    
    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    logger.info('Password reset successful', { userId: user._id });
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error('Reset password failed', { error: error instanceof Error ? error.message : String(error) });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      const error = createErrorResponse(ErrorCode.MISSING_REQUIRED_FIELD, { fields: ['currentPassword', 'newPassword'] });
      res.status(error.statusCode).json(error);
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      logger.warn('Change password failed - user not found', { userId: req.user?.userId });
      const error = createErrorResponse(ErrorCode.USER_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      logger.warn('Change password failed - invalid current password', { userId: user._id });
      const error = createErrorResponse(ErrorCode.INVALID_CREDENTIALS);
      res.status(error.statusCode).json(error);
      return;
    }

    user.password = newPassword;
    await user.save();

    const template = EmailTemplates.passwordChanged(user.username);
    
    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    logger.info('Password changed successfully', { userId: user._id });
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password failed', { error: error instanceof Error ? error.message : String(error), userId: req.user?.userId });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export async function sendEmailWithCustomSMTP(
  options: { to: string; subject: string; html: string; text?: string },
  smtpConfig: SMTPConfig
): Promise<{ success: boolean; error?: string }> {
  const result = await sendEmail(
    { to: options.to, subject: options.subject, html: options.html, text: options.text },
    smtpConfig
  );
  return { success: result.success, error: result.error };
}
