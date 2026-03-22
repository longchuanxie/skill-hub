import { Router, Response } from 'express';
import crypto from 'crypto';
import { register, login, refreshToken, logout, getMe } from '../controllers/authController';
import { authenticate, AuthRequest } from '../middleware/auth';
import { registerValidation, loginValidation, refreshTokenValidation } from '../validations/authValidation';
import {
  sendVerificationCode,
  verifyCode,
  forgotPassword,
  resetPassword,
  changePassword
} from '../controllers/passwordController';
import { User } from '../models/User';
import {
  sendCodeValidation,
  verifyCodeValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation
} from '../validations/passwordValidation';
import { publicApiLimiter } from '../middleware/rateLimit';
import { ErrorCode, createErrorResponse } from '../utils/errors';

const router = Router();

router.post('/register', publicApiLimiter, registerValidation, register);
router.post('/login', publicApiLimiter, loginValidation, login);
router.post('/refresh', refreshTokenValidation, refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

router.post('/send-code', publicApiLimiter, sendCodeValidation, sendVerificationCode);
router.post('/verify-code', publicApiLimiter, verifyCodeValidation, verifyCode);
router.post('/forgot-password', publicApiLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password', publicApiLimiter, resetPasswordValidation, resetPassword);
router.post('/change-password', authenticate, changePasswordValidation, changePassword);

router.post('/send-verification-email', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      const error = createErrorResponse(ErrorCode.USER_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }
    if (user.isEmailVerified) {
      res.json({ message: 'Email already verified' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    await user.save();

    console.log(`Email verification token for ${user.email}: ${token}`);
    res.json({ message: 'Verification email sent', expiresIn: 3600 });
  } catch (error) {
    const err = createErrorResponse(ErrorCode.EMAIL_SEND_FAILED);
    res.status(err.statusCode).json(err);
  }
});

router.get('/verify-email/:token', async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ emailVerificationToken: token });
    
    if (!user) {
      const error = createErrorResponse(ErrorCode.INVALID_VERIFICATION_TOKEN);
      res.status(error.statusCode).json(error);
      return;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
});

export default router;
