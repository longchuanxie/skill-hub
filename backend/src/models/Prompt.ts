import { Schema, Document, model } from 'mongoose';

export interface IPrompt extends Document {
  name: string;
  description: string;
  content: string;
  variables: {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    description?: string;
  }[];
  owner: Schema.Types.ObjectId;
  enterpriseId?: Schema.Types.ObjectId;
  category: string;
  tags: string[];
  version: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  visibility: 'public' | 'private' | 'enterprise' | 'shared';
  usageCount: number;
  ratings: {
    userId: Schema.Types.ObjectId;
    rating: number;
    createdAt: Date;
  }[];
  averageRating: number;
  likes: Schema.Types.ObjectId[];
  likeCount: number;
  favorites: Schema.Types.ObjectId[];
  favoriteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const promptSchema = new Schema<IPrompt>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000,
  },
  variables: [{
    name: { type: String, required: true },
    type: { type: String, default: 'string' },
    required: { type: Boolean, default: false },
    defaultValue: String,
    description: String,
  }],
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
  usageCount: {
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

promptSchema.index({ name: 'text', description: 'text', content: 'text' });
promptSchema.index({ category: 1 });
promptSchema.index({ owner: 1 });
promptSchema.index({ enterpriseId: 1 });
promptSchema.index({ visibility: 1 });
promptSchema.index({ status: 1 });
promptSchema.index(
  { owner: 1, name: 1 },
  { unique: true }
);

promptSchema.methods.calcAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    return;
  }
  const sum = this.ratings.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
  this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
};

export const Prompt = model<IPrompt>('Prompt', promptSchema);