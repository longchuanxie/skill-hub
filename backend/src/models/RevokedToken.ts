import { Schema, Document, model } from 'mongoose';

// Revoked (logged-out) JWTs. Stores a SHA-256 hash, never the token itself.
// expiresAt mirrors the token's own expiry and drives a TTL index so rows
// are cleaned up automatically once the token would be invalid anyway.
export interface IRevokedToken extends Document {
  tokenHash: string;
  tokenType: 'access' | 'refresh';
  expiresAt: Date;
  createdAt: Date;
}

const revokedTokenSchema = new Schema<IRevokedToken>(
  {
    tokenHash: {
      type: String,
      required: true,
    },
    tokenType: {
      type: String,
      enum: ['access', 'refresh'],
      default: 'access',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

revokedTokenSchema.index({ tokenHash: 1 }, { unique: true });
revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RevokedToken = model<IRevokedToken>('RevokedToken', revokedTokenSchema);
