import { Schema, Document, model } from 'mongoose';

export interface IPermissionAuditLog extends Document {
  skillId: Schema.Types.ObjectId;
  action: 'create' | 'update' | 'delete' | 'add_collaborator' | 'remove_collaborator' | 'update_role';
  details: any;
  performedBy: Schema.Types.ObjectId;
  performedAt: Date;
}

const permissionAuditLogSchema = new Schema<IPermissionAuditLog>({
  skillId: {
    type: Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'add_collaborator', 'remove_collaborator', 'update_role'],
    required: true,
  },
  details: {
    type: Schema.Types.Mixed,
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  performedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false,
});

permissionAuditLogSchema.index({ skillId: 1 });
permissionAuditLogSchema.index({ performedBy: 1 });
permissionAuditLogSchema.index({ performedAt: -1 });
permissionAuditLogSchema.index({ action: 1 });

export const PermissionAuditLog = model<IPermissionAuditLog>('PermissionAuditLog', permissionAuditLogSchema);
