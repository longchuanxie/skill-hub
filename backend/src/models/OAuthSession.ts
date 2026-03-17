import { Schema, Document, model } from 'mongoose';

export interface IOAuthSession extends Document {
  userId: Schema.Types.ObjectId;
  providerId: Schema.Types.ObjectId;
  provider: string;
  providerUserId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
  createdAt: Date;
  updatedAt: Date;
}

const oauthSessionSchema = new Schema<IOAuthSession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'OAuthProvider',
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
  providerUserId: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
  },
  expiresAt: {
    type: Date,
  },
  scope: {
    type: String,
  },
}, {
  timestamps: true,
});

oauthSessionSchema.index({ userId: 1, provider: 1 }, { unique: true });
oauthSessionSchema.index({ providerId: 1 });

export const OAuthSession = model<IOAuthSession>('OAuthSession', oauthSessionSchema);
