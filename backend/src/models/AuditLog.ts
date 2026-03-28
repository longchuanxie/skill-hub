import { Schema, Document, model } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  actor: Schema.Types.ObjectId;
  targetType?: 'user' | 'enterprise' | 'skill' | 'prompt';
  targetId?: Schema.Types.ObjectId;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  action: {
    type: String,
    required: true,
    trim: true,
  },
  actor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    enum: ['user', 'enterprise', 'skill', 'prompt'],
  },
  targetId: {
    type: Schema.Types.ObjectId,
  },
  details: {
    type: Schema.Types.Mixed,
  },
  ip: {
    type: String,
    trim: true,
  },
  userAgent: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
