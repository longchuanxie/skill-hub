import { Schema, Document, model } from 'mongoose';

export interface ITestCase extends Document {
  skillId: Schema.Types.ObjectId;
  name: string;
  description: string;
  input: any;
  expectedOutput: any;
  timeout: number;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseSchema = new Schema<ITestCase>({
  skillId: {
    type: Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  input: {
    type: Schema.Types.Mixed,
    required: true,
  },
  expectedOutput: {
    type: Schema.Types.Mixed,
    required: true,
  },
  timeout: {
    type: Number,
    default: 30000,
    min: 1000,
    max: 300000,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

testCaseSchema.index({ skillId: 1 });
testCaseSchema.index({ createdBy: 1 });

export const TestCase = model<ITestCase>('TestCase', testCaseSchema);
