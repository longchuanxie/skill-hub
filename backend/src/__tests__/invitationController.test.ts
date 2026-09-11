import request from 'supertest';
import app from '../app';
import { User } from '../models/User';
import { Enterprise } from '../models/Enterprise';
import { Invitation } from '../models/Invitation';
import jwt from 'jsonwebtoken';

describe('Invitation Controller', () => {
  let adminUser: any;
  let enterpriseAdminUser: any;
  let regularUser: any;
  let enterprise: any;
  let adminToken: string;
  let enterpriseAdminToken: string;
  let regularToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await Enterprise.deleteMany({});
    await Invitation.deleteMany({});

    adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });
    await adminUser.save();

    enterpriseAdminUser = new User({
      username: 'enterpriseadmin',
      email: 'enterpriseadmin@example.com',
      password: 'password123',
      role: 'enterprise_admin'
    });
    await enterpriseAdminUser.save();

    regularUser = new User({
      username: 'regular',
      email: 'regular@example.com',
      password: 'password123',
      role: 'user'
    });
    await regularUser.save();

    enterprise = new Enterprise({
      name: 'Test Enterprise',
      owner: adminUser._id,
      members: [
        { userId: adminUser._id, role: 'admin' },
        { userId: enterpriseAdminUser._id, role: 'admin' }
      ]
    });
    await enterprise.save();

    regularUser.enterpriseId = enterprise._id;
    await regularUser.save();

    adminToken = jwt.sign({ userId: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    enterpriseAdminToken = jwt.sign({ userId: enterpriseAdminUser._id, role: enterpriseAdminUser.role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    regularToken = jwt.sign({ userId: regularUser._id, role: regularUser.role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  describe('POST /api/enterprises/:id/invite', () => {
    it('should create an invitation successfully', async () => {
      const response = await request(app)
        .post(`/api/enterprises/${enterprise._id}/invite`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@example.com',
          role: 'member'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe('newuser@example.com');
      expect(response.body.role).toBe('member');

      const invitation = await Invitation.findOne({ email: 'newuser@example.com' });
      expect(invitation).toBeTruthy();
      expect(invitation?.status).toBe('pending');
    });

    it('should return 403 if user is not authorized', async () => {
      const response = await request(app)
        .post(`/api/enterprises/${enterprise._id}/invite`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          email: 'newuser@example.com',
          role: 'member'
        });

      expect(response.status).toBe(403);
    });

    it('should return 400 if email is already a member', async () => {
      const response = await request(app)
        .post(`/api/enterprises/${enterprise._id}/invite`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: regularUser.email,
          role: 'member'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('USER_ALREADY_MEMBER');
    });

    it('should return 400 if pending invitation exists', async () => {
      await new Invitation({
        email: 'pending@example.com',
        enterpriseId: enterprise._id,
        invitedBy: adminUser._id,
        role: 'member',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }).save();

      const response = await request(app)
        .post(`/api/enterprises/${enterprise._id}/invite`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'pending@example.com',
          role: 'member'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVITATION_PENDING_EXISTS');
    });
  });

  describe('GET /api/enterprises/:id/invitations', () => {
    it('should get all invitations for enterprise', async () => {
      await new Invitation({
        email: 'invite1@example.com',
        enterpriseId: enterprise._id,
        invitedBy: adminUser._id,
        role: 'member',
        token: 'token1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }).save();

      await new Invitation({
        email: 'invite2@example.com',
        enterpriseId: enterprise._id,
        invitedBy: adminUser._id,
        role: 'admin',
        token: 'token2',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }).save();

      const response = await request(app)
        .get(`/api/enterprises/${enterprise._id}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('should return 403 if user is not authorized', async () => {
      const response = await request(app)
        .get(`/api/enterprises/${enterprise._id}/invitations`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/invitation/:token/accept', () => {
    it('should accept invitation successfully', async () => {
      const invitation = await new Invitation({
        email: regularUser.email,
        enterpriseId: enterprise._id,
        invitedBy: adminUser._id,
        role: 'member',
        token: 'accept-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }).save();

      regularUser.enterpriseId = undefined;
      await regularUser.save();

      const response = await request(app)
        .post(`/api/invitation/${invitation.token}/accept`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('accepted');

      const updatedInvitation = await Invitation.findById(invitation._id);
      expect(updatedInvitation?.status).toBe('accepted');

      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser?.enterpriseId?.toString()).toBe(enterprise._id.toString());

      const updatedEnterprise = await Enterprise.findById(enterprise._id);
      const isMember = updatedEnterprise?.members.some(m => m.userId.toString() === regularUser._id.toString());
      expect(isMember).toBeTruthy();
    });

    it('should return 404 if invitation not found', async () => {
      const response = await request(app)
        .post('/api/invitation/nonexistent-token/accept')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 if invitation is expired', async () => {
      const invitation = await new Invitation({
        email: regularUser.email,
        enterpriseId: enterprise._id,
        invitedBy: adminUser._id,
        role: 'member',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }).save();

      const response = await request(app)
        .post(`/api/invitation/${invitation.token}/accept`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVITATION_EXPIRED');
    });

    it('should return 400 if email does not match', async () => {
      const invitation = await new Invitation({
        email: 'other@example.com',
        enterpriseId: enterprise._id,
        invitedBy: adminUser._id,
        role: 'member',
        token: 'wrong-email-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }).save();

      const response = await request(app)
        .post(`/api/invitation/${invitation.token}/accept`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVITATION_EMAIL_MISMATCH');
    });
  });

  describe('POST /api/invitation/:token/decline', () => {
    it('should decline invitation successfully', async () => {
      const invitation = await new Invitation({
        email: regularUser.email,
        enterpriseId: enterprise._id,
        invitedBy: adminUser._id,
        role: 'member',
        token: 'decline-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }).save();

      const response = await request(app)
        .post(`/api/invitation/${invitation.token}/decline`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('declined');

      const updatedInvitation = await Invitation.findById(invitation._id);
      expect(updatedInvitation?.status).toBe('declined');
    });
  });

  describe('DELETE /api/enterprises/:id/invitations/:invitationId', () => {
    it('should cancel invitation successfully', async () => {
      const invitation = await new Invitation({
        email: 'cancel@example.com',
        enterpriseId: enterprise._id,
        invitedBy: adminUser._id,
        role: 'member',
        token: 'cancel-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }).save();

      const response = await request(app)
        .delete(`/api/enterprises/${enterprise._id}/invitations/${invitation._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('cancelled');

      const deletedInvitation = await Invitation.findById(invitation._id);
      expect(deletedInvitation).toBeNull();
    });

    it('should return 403 if user is not authorized', async () => {
      const invitation = await new Invitation({
        email: 'unauthorized@example.com',
        enterpriseId: enterprise._id,
        invitedBy: adminUser._id,
        role: 'member',
        token: 'unauthorized-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }).save();

      const response = await request(app)
        .delete(`/api/enterprises/${enterprise._id}/invitations/${invitation._id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });
});
