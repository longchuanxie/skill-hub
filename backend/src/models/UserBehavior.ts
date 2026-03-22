import { Schema, Document, model } from 'mongoose';

export interface IUserBehavior extends Document {
  userId: Schema.Types.ObjectId;
  resourceType: 'skill' | 'prompt';
  resourceId: Schema.Types.ObjectId;
  action: 'view' | 'download' | 'favorite' | 'use';
  metadata?: Record<string, any>;
  createdAt: Date;
}

const userBehaviorSchema = new Schema<IUserBehavior>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  resourceType: {
    type: String,
    enum: ['skill', 'prompt'],
    required: true
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['view', 'download', 'favorite', 'use'],
    required: true
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

userBehaviorSchema.index({ userId: 1, createdAt: -1 });
userBehaviorSchema.index({ resourceType: 1, resourceId: 1 });
userBehaviorSchema.index({ action: 1 });
userBehaviorSchema.index({ createdAt: -1 });

export const UserBehavior = model<IUserBehavior>('UserBehavior', userBehaviorSchema);
