import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { signOAuthState, verifyOAuthState } from '../utils/oauthState';

// Regression tests for the OAuth hardening: the state parameter is a
// server-signed short-lived token (plain base64 let anyone forge a
// callback) and the callback rejects anything unverifiable before
// touching provider data.
describe('OAuth security', () => {
  describe('state signing', () => {
    it('round-trips a signed state', () => {
      const state = signOAuthState({
        providerId: '507f1f77bcf86cd7994d8901',
        redirectUri: 'http://localhost:3001/api/oauth/callback/github',
        action: 'login',
      });

      const payload = verifyOAuthState(state);
      expect(payload).not.toBeNull();
      expect(payload?.providerId).toBe('507f1f77bcf86cd7994d8901');
      expect(payload?.action).toBe('login');
    });

    it('rejects a forged (unsigned) state', () => {
      const forged = Buffer.from(
        JSON.stringify({ providerId: 'x', redirectUri: 'http://evil' }),
      ).toString('base64');
      expect(verifyOAuthState(forged)).toBeNull();
    });

    it('rejects a state signed with the wrong secret', () => {
      const wrongSecret = jwt.sign(
        { providerId: 'x', redirectUri: 'http://evil' },
        'attacker-secret',
        { expiresIn: '10m' },
      );
      expect(verifyOAuthState(wrongSecret)).toBeNull();
    });

    it('rejects an expired state', () => {
      const expired = jwt.sign({ providerId: 'x', redirectUri: 'http://x' }, 'test-secret', {
        expiresIn: '-10s',
      });
      expect(verifyOAuthState(expired)).toBeNull();
    });
  });

  describe('GET /api/oauth/callback/:provider', () => {
    it('rejects a forged state before any provider lookup', async () => {
      const forged = Buffer.from(JSON.stringify({ providerId: 'x' })).toString('base64');
      const res = await request(app)
        .get(`/api/oauth/callback/github?code=abc&state=${forged}`)
        .expect(400);
      expect(res.body.error).toBe('Invalid or expired state');
    });

    it('rejects a garbage state', async () => {
      await request(app).get('/api/oauth/callback/github?code=abc&state=not-a-jwt').expect(400);
    });

    it('rejects a validly-signed but unknown provider state', async () => {
      const state = signOAuthState({
        providerId: '507f1f77bcf86cd7994d8901',
        redirectUri: 'http://localhost:3001/api/oauth/callback/github',
        action: 'login',
      });
      await request(app).get(`/api/oauth/callback/github?code=abc&state=${state}`).expect(404);
    });
  });
});
