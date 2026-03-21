import { Schema, Document, model, Types } from 'mongoose';

interface Collaborator {
  userId: Types.ObjectId | string;
  username: string;
  role: 'viewer' | 'editor' | 'admin';
  addedAt: Date;
  addedBy: Types.ObjectId | string;
}

export interface ISkillPermissions extends Document {
  skillId: Types.ObjectId | string;
  visibility: 'public' | 'private' | 'password-protected';
  password?: string;
  allowComments: boolean;
  allowForks: boolean;
  collaborators: Collaborator[];
  createdAt: Date;
  updatedAt: Date;
}

const collaboratorSchema = new Schema<Collaborator>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['viewer', 'editor', 'admin'],
    default: 'viewer',
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { _id: false });

const skillPermissionsSchema = new Schema<ISkillPermissions>({
  skillId: {
    type: Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
    unique: true,
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'password-protected'],
    default: 'private',
  },
  password: {
    type: String,
  },
  allowComments: {
    type: Boolean,
    default: true,
  },
  allowForks: {
    type: Boolean,
    default: true,
  },
  collaborators: [collaboratorSchema],
}, {
  timestamps: true,
});

skillPermissionsSchema.index({ skillId: 1 });

export const SkillPermissions = model<ISkillPermissions>('SkillPermissions', skillPermissionsSchema);
