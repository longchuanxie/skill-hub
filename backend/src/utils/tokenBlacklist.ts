import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RevokedToken } from '../models/RevokedToken';

const sha256 = (value: string): string => crypto.createHash('sha256').update(value).digest('hex');

export type RevocableTokenType = 'access' | 'refresh';

// Revoke a token until its natural expiry. Idempotent: revoking twice is a
// no-op thanks to the unique index on tokenHash.
export const revokeToken = async (token: string, tokenType: RevocableTokenType): Promise<void> => {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Skip if already expired - nothing to revoke.
    if (expiresAt.getTime() <= Date.now()) return;

    await RevokedToken.updateOne(
      { tokenHash: sha256(token) },
      { tokenHash: sha256(token), tokenType, expiresAt },
      { upsert: true },
    );
  } catch {
    // Revocation is best-effort; an undecodable token cannot be used anyway.
  }
};

export const isTokenRevoked = async (token: string): Promise<boolean> => {
  const record = await RevokedToken.findOne({ tokenHash: sha256(token) }).lean();
  return record !== null;
};
