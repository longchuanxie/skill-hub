import { Schema, Document, model } from 'mongoose';

export interface IPromptVersion extends Document {
  promptId: Schema.Types.ObjectId;
  version: string;
  content: string;
  description: string;
  variables: {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    description?: string;
  }[];
  updateDescription: string;
  createdAt: Date;
}

const promptVersionSchema = new Schema<IPromptVersion>({
  promptId: {
    type: Schema.Types.ObjectId,
    ref: 'Prompt',
    required: true,
    index: true,
  },
  version: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  variables: [{
    name: { type: String, required: true },
    type: { type: String, default: 'string' },
    required: { type: Boolean, default: false },
    defaultValue: String,
    description: String,
  }],
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

promptVersionSchema.index({ promptId: 1 });
promptVersionSchema.index({ createdAt: -1 });

export const PromptVersion = model<IPromptVersion>('PromptVersion', promptVersionSchema);