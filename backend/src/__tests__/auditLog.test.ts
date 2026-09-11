import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import mongoose from 'mongoose';

describe('AuditLog Model', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    await testUser.save();
  });

  describe('Creating audit logs', () => {
    it('should create an audit log successfully', async () => {
      const auditLog = new AuditLog({
        action: 'user.create',
        actor: testUser._id,
        targetType: 'user',
        targetId: new mongoose.Types.ObjectId(),
        details: { username: 'newuser' },
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      const savedLog = await auditLog.save();
      
      expect(savedLog._id).toBeDefined();
      expect(savedLog.action).toBe('user.create');
      expect(savedLog.actor.toString()).toBe(testUser._id.toString());
      expect(savedLog.targetType).toBe('user');
      expect(savedLog.details).toEqual({ username: 'newuser' });
      expect(savedLog.ip).toBe('192.168.1.1');
      expect(savedLog.userAgent).toBe('Mozilla/5.0');
    });

    it('should require action and actor', async () => {
      const auditLog = new AuditLog({});
      
      await expect(auditLog.save()).rejects.toThrow();
    });

    it('should validate targetType is one of allowed values', async () => {
      const auditLog = new AuditLog({
        action: 'test.action',
        actor: testUser._id,
        targetType: 'invalid-type',
      });

      await expect(auditLog.save()).rejects.toThrow();
    });

    it('should allow targetType without targetId', async () => {
      const auditLog = new AuditLog({
        action: 'system.action',
        actor: testUser._id,
        targetType: 'user',
      });

      const savedLog = await auditLog.save();
      expect(savedLog.targetId).toBeUndefined();
    });

    it('should allow creation without optional fields', async () => {
      const auditLog = new AuditLog({
        action: 'simple.action',
        actor: testUser._id,
      });

      const savedLog = await auditLog.save();
      expect(savedLog.targetType).toBeUndefined();
      expect(savedLog.details).toBeUndefined();
      expect(savedLog.ip).toBeUndefined();
      expect(savedLog.userAgent).toBeUndefined();
    });
  });

  describe('Querying audit logs', () => {
    beforeEach(async () => {
      await AuditLog.create([
        {
          action: 'user.create',
          actor: testUser._id,
          targetType: 'user',
          targetId: new mongoose.Types.ObjectId(),
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          action: 'skill.update',
          actor: testUser._id,
          targetType: 'skill',
          targetId: new mongoose.Types.ObjectId(),
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
        {
          action: 'enterprise.delete',
          actor: testUser._id,
          targetType: 'enterprise',
          targetId: new mongoose.Types.ObjectId(),
        },
      ]);
    });

    it('should find logs by actor', async () => {
      const logs = await AuditLog.find({ actor: testUser._id });
      
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should find logs by action', async () => {
      const logs = await AuditLog.find({ action: 'user.create' });
      
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('user.create');
    });

    it('should find logs by targetType', async () => {
      const logs = await AuditLog.find({ targetType: 'skill' });
      
      expect(logs.length).toBe(1);
      expect(logs[0].targetType).toBe('skill');
    });

    it('should sort logs by createdAt descending', async () => {
      const logs = await AuditLog.find().sort({ createdAt: -1 });
      
      expect(logs[0].action).toBe('enterprise.delete');
    });

    it('should filter logs by date range', async () => {
      const twoHoursAgo = new Date(Date.now() - 2.5 * 60 * 60 * 1000);
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const logs = await AuditLog.find({
        createdAt: { $gte: twoHoursAgo, $lte: thirtyMinutesAgo },
      });
      
      expect(logs.length).toBe(2);
    });
  });
});
