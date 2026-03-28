import { Invitation } from '../models/Invitation';
import { User } from '../models/User';
import { Enterprise } from '../models/Enterprise';
import mongoose from 'mongoose';

describe('Invitation Model', () => {
  let testUser: any;
  let testEnterprise: any;

  beforeEach(async () => {
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    await testUser.save();

    testEnterprise = new Enterprise({
      name: 'Test Enterprise',
      owner: testUser._id,
      members: [{ userId: testUser._id, role: 'admin' }],
    });
    await testEnterprise.save();
  });

  describe('Creating invitations', () => {
    it('should create an invitation successfully', async () => {
      const invitation = new Invitation({
        email: 'invitee@example.com',
        enterpriseId: testEnterprise._id,
        invitedBy: testUser._id,
        role: 'member',
        token: 'test-token-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const savedInvitation = await invitation.save();
      
      expect(savedInvitation._id).toBeDefined();
      expect(savedInvitation.email).toBe('invitee@example.com');
      expect(savedInvitation.enterpriseId.toString()).toBe(testEnterprise._id.toString());
      expect(savedInvitation.invitedBy.toString()).toBe(testUser._id.toString());
      expect(savedInvitation.role).toBe('member');
      expect(savedInvitation.status).toBe('pending');
      expect(savedInvitation.token).toBe('test-token-123');
    });

    it('should have default status as pending', async () => {
      const invitation = new Invitation({
        email: 'invitee2@example.com',
        enterpriseId: testEnterprise._id,
        invitedBy: testUser._id,
        role: 'admin',
        token: 'test-token-456',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const savedInvitation = await invitation.save();
      expect(savedInvitation.status).toBe('pending');
    });

    it('should require email, enterpriseId, invitedBy, role, token, and expiresAt', async () => {
      const invitation = new Invitation({});
      
      await expect(invitation.save()).rejects.toThrow();
    });

    it('should validate role is either admin or member', async () => {
      const invitation = new Invitation({
        email: 'invitee3@example.com',
        enterpriseId: testEnterprise._id,
        invitedBy: testUser._id,
        role: 'invalid-role',
        token: 'test-token-789',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await expect(invitation.save()).rejects.toThrow();
    });

    it('should validate status is one of allowed values', async () => {
      const invitation = new Invitation({
        email: 'invitee4@example.com',
        enterpriseId: testEnterprise._id,
        invitedBy: testUser._id,
        role: 'member',
        status: 'invalid-status',
        token: 'test-token-012',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await expect(invitation.save()).rejects.toThrow();
    });
  });

  describe('Querying invitations', () => {
    beforeEach(async () => {
      await Invitation.create([
        {
          email: 'invitee1@example.com',
          enterpriseId: testEnterprise._id,
          invitedBy: testUser._id,
          role: 'member',
          status: 'pending',
          token: 'token-1',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          email: 'invitee2@example.com',
          enterpriseId: testEnterprise._id,
          invitedBy: testUser._id,
          role: 'admin',
          status: 'accepted',
          token: 'token-2',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ]);
    });

    it('should find pending invitations for an enterprise', async () => {
      const pendingInvitations = await Invitation.find({
        enterpriseId: testEnterprise._id,
        status: 'pending',
      });

      expect(pendingInvitations.length).toBe(1);
      expect(pendingInvitations[0].email).toBe('invitee1@example.com');
    });

    it('should find invitation by token', async () => {
      const invitation = await Invitation.findOne({ token: 'token-1' });
      
      expect(invitation).toBeDefined();
      expect(invitation?.email).toBe('invitee1@example.com');
    });

    it('should find invitations by email', async () => {
      const invitations = await Invitation.find({ email: 'invitee1@example.com' });
      
      expect(invitations.length).toBeGreaterThan(0);
    });
  });

  describe('Updating invitations', () => {
    let invitation: any;

    beforeEach(async () => {
      invitation = new Invitation({
        email: 'update-test@example.com',
        enterpriseId: testEnterprise._id,
        invitedBy: testUser._id,
        role: 'member',
        token: 'update-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await invitation.save();
    });

    it('should update status to accepted', async () => {
      invitation.status = 'accepted';
      const updated = await invitation.save();
      
      expect(updated.status).toBe('accepted');
    });

    it('should update status to declined', async () => {
      invitation.status = 'declined';
      const updated = await invitation.save();
      
      expect(updated.status).toBe('declined');
    });

    it('should update status to expired', async () => {
      invitation.status = 'expired';
      const updated = await invitation.save();
      
      expect(updated.status).toBe('expired');
    });
  });
});
