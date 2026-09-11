import { Schema, Document, model } from 'mongoose';

export interface IUserInfoConfig {
  method: 'GET' | 'POST';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  userIdPath: string;
  emailPath?: string;
  namePath?: string;
  avatarPath?: string;
}

export interface IOAuthProvider extends Document {
  name: string;
  provider: string;
  clientId: string;
  clientSecret: string;
  authorizationURL: string;
  tokenURL: string;
  userInfoURL: string;
  scope: string;
  callbackPath: string;
  isEnabled: boolean;
  enterpriseId?: Schema.Types.ObjectId;
  userInfoConfig?: IUserInfoConfig;
  createdAt: Date;
  updatedAt: Date;
}

const oauthProviderSchema = new Schema<IOAuthProvider>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  provider: {
    type: String,
    required: true,
    enum: ['google', 'github', 'microsoft', 'slack', 'custom'],
  },
  clientId: {
    type: String,
    required: true,
  },
  clientSecret: {
    type: String,
    required: true,
  },
  authorizationURL: {
    type: String,
    required: true,
  },
  tokenURL: {
    type: String,
    required: true,
  },
  userInfoURL: {
    type: String,
    required: function(this: IOAuthProvider) {
      return this.provider !== 'custom';
    },
  },
  scope: {
    type: String,
    default: 'openid profile email',
  },
  callbackPath: {
    type: String,
    required: true,
  },
  isEnabled: {
    type: Boolean,
    default: false,
  },
  enterpriseId: {
    type: Schema.Types.ObjectId,
    ref: 'Enterprise',
  },
  userInfoConfig: {
    method: {
      type: String,
      enum: ['GET', 'POST'],
      default: 'GET',
    },
    url: {
      type: String,
      required: function(this: IOAuthProvider) {
        return this.provider === 'custom';
      },
    },
    headers: {
      type: Schema.Types.Mixed,
    },
    body: {
      type: String,
    },
    userIdPath: {
      type: String,
      required: function(this: IOAuthProvider) {
        return this.provider === 'custom';
      },
    },
    emailPath: {
      type: String,
    },
    namePath: {
      type: String,
    },
    avatarPath: {
      type: String,
    },
  },
}, {
  timestamps: true,
});

oauthProviderSchema.index({ provider: 1 });
oauthProviderSchema.index({ enterpriseId: 1 });
oauthProviderSchema.index({ provider: 1, enterpriseId: 1 }, { unique: true });

export const OAuthProvider = model<IOAuthProvider>('OAuthProvider', oauthProviderSchema);
