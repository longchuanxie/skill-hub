import { Schema, Document, model } from 'mongoose';
import crypto from 'crypto';

export interface IAdminInvitation extends Document {
  email: string;
  inviteCode: string;
  inviterId: Schema.Types.ObjectId;
  role: 'super_admin' | 'admin' | 'audit_admin';
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
  status: 'pending' | 'used' | 'expired';
  isExpired(): boolean;
  isValid(): boolean;
  markAsUsed(): Promise<void>;
  markAsExpired(): Promise<void>;
}

const adminInvitationSchema = new Schema<IAdminInvitation>({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 100,
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  inviterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'audit_admin'],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  usedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'used', 'expired'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// 生成邀请码
adminInvitationSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// 检查邀请是否过期
adminInvitationSchema.methods.isExpired = function(): boolean {
  return this.expiresAt < new Date();
};

// 检查邀请是否有效
adminInvitationSchema.methods.isValid = function(): boolean {
  return this.status === 'pending' && !this.isExpired();
};

// 标记邀请为已使用
adminInvitationSchema.methods.markAsUsed = async function(): Promise<void> {
  this.status = 'used';
  this.usedAt = new Date();
  await this.save();
};

// 标记邀请为已过期
adminInvitationSchema.methods.markAsExpired = async function(): Promise<void> {
  this.status = 'expired';
  await this.save();
};

export const AdminInvitation = model<IAdminInvitation>('AdminInvitation', adminInvitationSchema);
