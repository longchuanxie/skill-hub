import request from 'supertest';
import app from '../app';
import { User } from '../models/User';

// Regression tests for the security hardening in commit c4fbcc7:
// - no registration path grants the admin role
// - refresh tokens are signed with a separate secret and cannot be
//   replayed as access tokens
describe('Auth Security', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('does not grant admin role to the legacy backdoor username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin2',
          email: 'admin2@example.com',
          password: 'StrongPass123!',
        })
        .expect(201);

      expect(response.body.user.role).toBe('user');

      const dbUser = await User.findOne({ username: 'admin2' });
      expect(dbUser?.role).toBe('user');
    });

    it('does not grant admin role to the legacy backdoor email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'legacyadmin',
          email: 'admin@example.com',
          password: 'StrongPass123!',
        })
        .expect(201);

      expect(response.body.user.role).toBe('user');

      const dbUser = await User.findOne({ email: 'admin@example.com' });
      expect(dbUser?.role).toBe('user');
    });
  });

  describe('token separation', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'tokenuser',
          email: 'tokenuser@example.com',
          password: 'StrongPass123!',
        })
        .expect(201);

      const login = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tokenuser@example.com',
          password: 'StrongPass123!',
        })
        .expect(200);

      accessToken = login.body.token;
      refreshToken = login.body.refreshToken;
    });

    it('issues distinct access and refresh tokens', () => {
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(accessToken).not.toBe(refreshToken);
    });

    it('rejects a refresh token used as an access token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(401);
    });

    it('exchanges a valid refresh token for a new token pair', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.token).toBeTruthy();
      expect(response.body.refreshToken).toBeTruthy();
      // The access token must never be returned in the refresh slot.
      expect(response.body.refreshToken).not.toBe(response.body.token);
    });

    it('rejects an access token used as a refresh token', async () => {
      await request(app).post('/api/auth/refresh').send({ refreshToken: accessToken }).expect(401);
    });
  });
});
