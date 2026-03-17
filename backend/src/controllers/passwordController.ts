import { Response } from 'express';
import { User } from '../models/User';
import { generatePasswordResetToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

const verificationCodes: Map<string, { code: string; expires: Date }> = new Map();

export const generateVerificationCode = (email: string): string => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000);
  verificationCodes.set(email, { code, expires });
  return code;
};

export const sendVerificationCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.json({ message: 'If email exists, verification code will be sent' });
      return;
    }

    const code = generateVerificationCode(email);
    console.log(`Verification code for ${email}: ${code}`);
    
    res.json({ message: 'Verification code sent', expiresIn: 300 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send verification code' });
  }
};

export const verifyCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ error: 'Email and code required' });
      return;
    }

    const stored = verificationCodes.get(email.toLowerCase());
    if (!stored) {
      res.status(400).json({ error: 'No verification code found' });
      return;
    }

    if (new Date() > stored.expires) {
      verificationCodes.delete(email.toLowerCase());
      res.status(400).json({ error: 'Verification code expired' });
      return;
    }

    if (stored.code !== code) {
      res.status(400).json({ error: 'Invalid verification code' });
      return;
    }

    verificationCodes.delete(email.toLowerCase());
    res.json({ message: 'Verification successful' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.json({ message: 'If email exists, password reset link will be sent' });
      return;
    }

    const resetToken = generatePasswordResetToken(user);
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({ message: 'Password reset link sent', expiresIn: 3600 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process forgot password' });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: 'Token and new password required' });
      return;
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password required' });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
};
