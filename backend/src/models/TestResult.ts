import { Schema, Document, model } from 'mongoose';

interface TestCaseResult {
  testCaseId: Schema.Types.ObjectId;
  testCaseName: string;
  status: 'passed' | 'failed' | 'error' | 'timeout';
  actualOutput?: any;
  errorMessage?: string;
  duration: number;
}

interface TestLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  data?: any;
}

export interface ITestResult extends Document {
  skillId: Schema.Types.ObjectId;
  version: string;
  status: 'running' | 'passed' | 'failed' | 'error';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  results: TestCaseResult[];
  logs: TestLog[];
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
}

const testCaseResultSchema = new Schema<TestCaseResult>({
  testCaseId: {
    type: Schema.Types.ObjectId,
    ref: 'TestCase',
    required: true,
  },
  testCaseName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['passed', 'failed', 'error', 'timeout'],
    required: true,
  },
  actualOutput: Schema.Types.Mixed,
  errorMessage: String,
  duration: {
    type: Number,
    required: true,
  },
}, { _id: false });

const testLogSchema = new Schema<TestLog>({
  level: {
    type: String,
    enum: ['info', 'warn', 'error', 'debug'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  data: Schema.Types.Mixed,
}, { _id: false });

const testResultSchema = new Schema<ITestResult>({
  skillId: {
    type: Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['running', 'passed', 'failed', 'error'],
    default: 'running',
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: Date,
  duration: Number,
  results: [testCaseResultSchema],
  logs: [testLogSchema],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

testResultSchema.index({ skillId: 1 });
testResultSchema.index({ createdBy: 1 });
testResultSchema.index({ status: 1 });
testResultSchema.index({ createdAt: -1 });

export const TestResult = model<ITestResult>('TestResult', testResultSchema);
