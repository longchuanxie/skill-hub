import jwt from 'jsonwebtoken';
import { getJwtSecret } from './jwt';

// OAuth state is a short-lived signed token (JWT, 10 minutes). A plain
// base64 blob let anyone forge a callback state (CSRF); signing ties it to
// the server and makes it expire.
export interface OAuthStatePayload {
  providerId: string;
  redirectUri: string;
  enterpriseId?: string;
  action?: 'login' | 'link';
  userId?: string;
}

const STATE_TTL_SECONDS = 600;

export const signOAuthState = (payload: OAuthStatePayload): string =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: STATE_TTL_SECONDS });

export const verifyOAuthState = (state: string): OAuthStatePayload | null => {
  try {
    return jwt.verify(state, getJwtSecret()) as OAuthStatePayload;
  } catch {
    return null;
  }
};
