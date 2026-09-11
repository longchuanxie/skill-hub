import { Schema, Document, model } from 'mongoose';

export interface ICustomPage extends Document {
  pageKey: string;
  title: string;
  content: string;
  language: 'en' | 'zh';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customPageSchema = new Schema<ICustomPage>({
  pageKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    enum: ['en', 'zh'],
    required: true,
    default: 'en',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

customPageSchema.index({ pageKey: 1, language: 1 }, { unique: true });
customPageSchema.index({ isActive: 1 });

export const CustomPage = model<ICustomPage>('CustomPage', customPageSchema);
