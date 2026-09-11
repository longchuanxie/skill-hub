import { Schema, Document, model } from 'mongoose';

export interface ISkillVersion extends Document {
  skillId: Schema.Types.ObjectId;
  version: string;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  updateDescription: string;
  createdAt: Date;
}

const skillVersionSchema = new Schema<ISkillVersion>({
  skillId: {
    type: Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
    index: true,
  },
  version: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  updateDescription: {
    type: String,
    required: true,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

skillVersionSchema.index({ skillId: 1 });
skillVersionSchema.index({ createdAt: -1 });

export const SkillVersion = model<ISkillVersion>('SkillVersion', skillVersionSchema);