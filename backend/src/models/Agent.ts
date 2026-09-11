import { Schema, Document, model } from 'mongoose';

export interface IAgent extends Document {
  description: string;
  apiKey: string;
  endpoint?: string;
  isEnabled: boolean;
  createdBy: Schema.Types.ObjectId;
  owner?: Schema.Types.ObjectId;
  enterpriseId?: Schema.Types.ObjectId;
  permissions?: {
    canRead: boolean;
    canWrite: boolean;
    allowedResources: string[];
  };
  usage: {
    totalRequests: number;
    lastUsed: Date;
  };
  regenerateApiKey: () => string;
  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new Schema<IAgent>({
  description: {
    type: String,
    default: '',
  },
  apiKey: {
    type: String,
    required: true,
    unique: true,
  },
  endpoint: {
    type: String,
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  enterpriseId: {
    type: Schema.Types.ObjectId,
    ref: 'Enterprise',
  },
  permissions: {
    canRead: { type: Boolean, default: true },
    canWrite: { type: Boolean, default: false },
    allowedResources: [{ type: String }],
  },
  usage: {
    type: {
      totalRequests: { type: Number, default: 0 },
      lastUsed: { type: Date }
    },
    default: { totalRequests: 0 }
  },
}, {
  timestamps: true,
});

agentSchema.index({ createdBy: 1 });
agentSchema.index({ enterpriseId: 1 });
agentSchema.index({ apiKey: 1 }, { unique: true });

agentSchema.methods.regenerateApiKey = function() {
  const crypto = require('crypto');
  this.apiKey = crypto.randomBytes(32).toString('hex');
  return this.apiKey;
};

export const Agent = model<IAgent>('Agent', agentSchema);
