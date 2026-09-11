import { Schema, Document, model } from 'mongoose';

export interface IResourceVersion extends Document {
  resourceId: Schema.Types.ObjectId;
  resourceType: 'skill' | 'prompt';
  version: string;
  versionNumber: number;
  content: string;
  files: Array<{
    filename: string;
    path: string;
    size: number;
    mimetype: string;
  }>;
  changelog: string;
  tags: string[];
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  fileManifest?: {
    totalFiles: number;
    totalSize: number;
    files: Array<{
      path: string;
      name: string;
      size: number;
      checksum: string;
    }>;
    checksum: string;
  };
  comparisonStatus?: 'pending' | 'completed' | 'failed';
}

const resourceVersionSchema = new Schema<IResourceVersion>({
  resourceId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  resourceType: {
    type: String,
    enum: ['skill', 'prompt'],
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  versionNumber: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
  },
  files: [{
    filename: String,
    path: String,
    size: Number,
    mimetype: String,
  }],
  changelog: {
    type: String,
    maxlength: 2000,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileManifest: {
    totalFiles: Number,
    totalSize: Number,
    files: [{
      path: String,
      name: String,
      size: Number,
      checksum: String,
    }],
    checksum: String,
  },
  comparisonStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

resourceVersionSchema.index({ resourceId: 1, versionNumber: -1 }, { unique: true });
resourceVersionSchema.index({ resourceId: 1, isActive: 1 });

export const ResourceVersion = model<IResourceVersion>('ResourceVersion', resourceVersionSchema);
