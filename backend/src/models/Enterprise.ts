import { Schema, Document, model } from 'mongoose';

export interface IEnterprise extends Document {
  name: string;
  description?: string;
  logo?: string;
  owner: Schema.Types.ObjectId;
  members: Array<{
    userId: Schema.Types.ObjectId;
    role: 'admin' | 'member';
    joinedAt: Date;
  }>;
  settings: {
    allowPublicShare: boolean;
    requireApproval: boolean;
    auth: {
      passwordLoginEnabled: boolean;
      oauthRequired: boolean;
    };
    resourceReview: {
      autoApprove: boolean;
      enableContentFilter: boolean;
    };
  };
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    expiresAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const enterpriseSchema = new Schema<IEnterprise>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  logo: {
    type: String,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  settings: {
    allowPublicShare: {
      type: Boolean,
      default: true,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
    auth: {
      passwordLoginEnabled: {
        type: Boolean,
        default: true,
      },
      oauthRequired: {
        type: Boolean,
        default: false,
      },
    },
    resourceReview: {
      autoApprove: {
        type: Boolean,
        default: false,
      },
      enableContentFilter: {
        type: Boolean,
        default: true,
      },
    },
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    expiresAt: {
      type: Date,
    },
  },
}, {
  timestamps: true,
});

enterpriseSchema.index({ name: 'text' });
enterpriseSchema.index({ name: 1 }, { unique: true });

enterpriseSchema.pre('save', function(next) {
  if (!this.settings.auth.passwordLoginEnabled && !this.settings.auth.oauthRequired) {
    const error = new Error('At least one authentication method must be enabled');
    return next(error);
  }
  next();
});

export const Enterprise = model<IEnterprise>('Enterprise', enterpriseSchema);
