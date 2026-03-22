import { Schema, Document, model } from 'mongoose';

export interface ISkill extends Document {
  name?: string;
  description?: string;
  owner: Schema.Types.ObjectId;
  enterpriseId?: Schema.Types.ObjectId;
  category: string;
  tags: string[];
  author?: string;
  compatibility: string[];
  files: {
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
  }[];
  version: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  visibility: 'public' | 'private' | 'enterprise' | 'shared';
  downloads: number;
  ratings: {
    userId: Schema.Types.ObjectId;
    rating: number;
    createdAt: Date;
  }[];
  averageRating: number;
  usageCount: number;
  likes: Schema.Types.ObjectId[];
  likeCount: number;
  favorites: Schema.Types.ObjectId[];
  favoriteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>({
  name: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: false,
    maxlength: 5000,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  enterpriseId: {
    type: Schema.Types.ObjectId,
    ref: 'Enterprise',
  },
  category: {
    type: String,
    required: true,
    default: 'general',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  author: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  compatibility: [{
    type: String,
    trim: true,
  }],
  files: [{
    filename: String,
    path: String,
    size: Number,
    mimeType: String,
  }],
  version: {
    type: String,
    default: '1.0.0',
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft',
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'enterprise', 'shared'],
    default: 'private',
  },
  downloads: {
    type: Number,
    default: 0,
  },
  ratings: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now },
  }],
  averageRating: {
    type: Number,
    default: 0,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  likeCount: {
    type: Number,
    default: 0,
  },
  favorites: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  favoriteCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

skillSchema.index(
  { name: 'text', tags: 'text', description: 'text' },
  {
    weights: {
      name: 10,
      tags: 5,
      description: 2
    },
    name: 'skill_text_search_index'
  }
);
skillSchema.index({ category: 1 });
skillSchema.index({ owner: 1 });
skillSchema.index({ enterpriseId: 1 });
skillSchema.index({ visibility: 1 });
skillSchema.index({ status: 1 });
skillSchema.index(
  { owner: 1, name: 1 },
  { unique: true, partialFilterExpression: { name: { $exists: true, $ne: '' } } }
);

skillSchema.methods.calcAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    return;
  }
  const sum = this.ratings.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
  this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
};

export const Skill = model<ISkill>('Skill', skillSchema);
