import { Schema, Document, model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'enterprise_admin' | 'developer' | 'user';
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
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

const userSchema = new Schema<IUser>({
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
    minlength: 8,
    maxlength: 128,
  },
  role: {
    type: String,
    enum: ['admin', 'enterprise_admin', 'developer', 'user'],
    default: 'user',
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
  },
  passwordResetExpires: {
    type: Date,
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
}, {
  timestamps: true,
});

userSchema.virtual('isLockedVirtual').get(function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

userSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.incLoginAttempts = async function(): Promise<void> {
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

userSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', userSchema);
export { MAX_LOGIN_ATTEMPTS, LOCK_TIME };
