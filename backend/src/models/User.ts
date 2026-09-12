import { Schema, Document, model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'audit_admin' | 'enterprise_admin' | 'developer' | 'user';
  status: 'active' | 'disabled';
  enterpriseId?: Schema.Types.ObjectId;
  avatar?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string;
  lastPasswordChange: Date;
  passwordExpiresAt: Date;
  loginHistory: LoginHistory[];
  adminPermissions?: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

export interface LoginHistory {
  ip: string;
  userAgent: string;
  loginAt: Date;
  success: boolean;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 8,
      maxlength: 128,
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'audit_admin', 'enterprise_admin', 'developer', 'user'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    enterpriseId: {
      type: Schema.Types.ObjectId,
      ref: 'Enterprise',
    },
    avatar: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
    passwordExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
    loginHistory: {
      select: false,
      type: [
        {
          ip: String,
          userAgent: String,
          loginAt: Date,
          success: Boolean,
        },
      ],
      default: [],
    },
    adminPermissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

userSchema.virtual('isLockedVirtual').get(function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.incLoginAttempts = async function (): Promise<void> {
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
      this.lockUntil = new Date(Date.now() + LOCK_TIME);
    }
  }
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 更新登录历史
userSchema.methods.updateLoginHistory = async function (
  ip: string,
  userAgent: string,
  success: boolean,
): Promise<void> {
  this.loginHistory.push({
    ip,
    userAgent,
    loginAt: new Date(),
    success,
  });
  // 只保留最近100条登录记录
  if (this.loginHistory.length > 100) {
    this.loginHistory = this.loginHistory.slice(-100);
  }
  await this.save();
};

// 检查密码是否过期
userSchema.methods.isPasswordExpired = function (): boolean {
  return this.passwordExpiresAt < new Date();
};

// 更新密码
userSchema.methods.updatePassword = async function (newPassword: string): Promise<void> {
  this.password = newPassword;
  this.lastPasswordChange = new Date();
  this.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
  await this.save();
};

// 启用双重认证
userSchema.methods.enableTwoFactor = async function (secret: string): Promise<void> {
  this.isTwoFactorEnabled = true;
  this.twoFactorSecret = secret;
  await this.save();
};

// 禁用双重认证
userSchema.methods.disableTwoFactor = async function (): Promise<void> {
  this.isTwoFactorEnabled = false;
  this.twoFactorSecret = undefined;
  await this.save();
};

export const User = model<IUser>('User', userSchema);
export { MAX_LOGIN_ATTEMPTS, LOCK_TIME };
