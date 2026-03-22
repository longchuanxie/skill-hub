import request from 'supertest';
import express from 'express';
import { Skill } from '../models/Skill';
import { SkillVersion } from '../models/SkillVersion';
import { User } from '../models/User';
import skillRoutes from '../routes/skills';
import { generateNextVersion } from '../controllers/SkillController';

describe('Skill Name Version Management', () => {
  let app: express.Application;
  let testUser: any;
  let accessToken: string;

  const mockAuth = (req: any, res: any, next: any) => {
    req.user = { userId: testUser._id.toString(), role: 'user' };
    next();
  };

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/skills', mockAuth, skillRoutes);
  });

  beforeEach(async () => {
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    await testUser.save();
  });

  describe('generateNextVersion', () => {
    it('should return 1.0.0 for skill with no versions', async () => {
      const skill = new Skill({
        name: 'Test Skill',
        owner: testUser._id,
        category: 'general',
        visibility: 'private',
      });
      await skill.save();

      const nextVersion = await generateNextVersion(skill._id);
      expect(nextVersion).toBe('1.0.0');
    });

    it('should increment patch version correctly', async () => {
      const skill = new Skill({
        name: 'Test Skill',
        owner: testUser._id,
        category: 'general',
        visibility: 'private',
        version: '1.0.0',
      });
      await skill.save();

      const skillVersion = new SkillVersion({
        skillId: skill._id,
        version: '1.0.0',
        url: '/uploads/test.zip',
        filename: 'test.zip',
        originalName: 'test.zip',
        size: 1024,
        mimetype: 'application/zip',
        updateDescription: 'Initial version',
      });
      await skillVersion.save();

      const nextVersion = await generateNextVersion(skill._id);
      expect(nextVersion).toBe('1.0.1');
    });

    it('should handle version overflow correctly', async () => {
      const skill = new Skill({
        name: 'Test Skill',
        owner: testUser._id,
        category: 'general',
        visibility: 'private',
        version: '1.0.99',
      });
      await skill.save();

      const skillVersion = new SkillVersion({
        skillId: skill._id,
        version: '1.0.99',
        url: '/uploads/test.zip',
        filename: 'test.zip',
        originalName: 'test.zip',
        size: 1024,
        mimetype: 'application/zip',
        updateDescription: 'Version 1.0.99',
      });
      await skillVersion.save();

      const nextVersion = await generateNextVersion(skill._id);
      expect(nextVersion).toBe('1.1.0');
    });
  });

  describe('Same name skill upload', () => {
    it('should create new skill when name is unique', async () => {
      const existingSkills = await Skill.find({ owner: testUser._id, name: 'Unique Skill' });
      expect(existingSkills.length).toBe(0);
    });

    it('should find existing skill by owner and name', async () => {
      const skill = new Skill({
        name: 'Existing Skill',
        owner: testUser._id,
        category: 'general',
        visibility: 'private',
        version: '1.0.0',
      });
      await skill.save();

      const found = await Skill.findOne({ owner: testUser._id, name: 'Existing Skill' });
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Existing Skill');
    });

    it('should not find skill with different owner', async () => {
      const otherUser = new User({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123',
      });
      await otherUser.save();

      const skill = new Skill({
        name: 'Other Skill',
        owner: otherUser._id,
        category: 'general',
        visibility: 'private',
        version: '1.0.0',
      });
      await skill.save();

      const found = await Skill.findOne({ owner: testUser._id, name: 'Other Skill' });
      expect(found).toBeNull();
    });

    it('should create new version when same user uploads same name', async () => {
      const skill = new Skill({
        name: 'Version Test Skill',
        owner: testUser._id,
        category: 'general',
        visibility: 'private',
        version: '1.0.0',
      });
      await skill.save();

      const skillVersion = new SkillVersion({
        skillId: skill._id,
        version: '1.0.0',
        url: '/uploads/test.zip',
        filename: 'test.zip',
        originalName: 'test.zip',
        size: 1024,
        mimetype: 'application/zip',
        updateDescription: 'Initial version',
      });
      await skillVersion.save();

      const newVersion = await generateNextVersion(skill._id);
      expect(newVersion).toBe('1.0.1');

      const newSkillVersion = new SkillVersion({
        skillId: skill._id,
        version: newVersion,
        url: '/uploads/test2.zip',
        filename: 'test2.zip',
        originalName: 'test2.zip',
        size: 2048,
        mimetype: 'application/zip',
        updateDescription: 'Update to version 1.0.1',
      });
      await newSkillVersion.save();

      const versions = await SkillVersion.find({ skillId: skill._id }).sort({ createdAt: 1 });
      expect(versions.length).toBe(2);
      expect(versions[0].version).toBe('1.0.0');
      expect(versions[1].version).toBe('1.0.1');
    });
  });

  describe('Skill model unique index', () => {
    it('should allow same name with different owners', async () => {
      const otherUser = new User({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123',
      });
      await otherUser.save();

      const skill1 = new Skill({
        name: 'Shared Name',
        owner: testUser._id,
        category: 'general',
        visibility: 'private',
      });
      await skill1.save();

      const skill2 = new Skill({
        name: 'Shared Name',
        owner: otherUser._id,
        category: 'general',
        visibility: 'private',
      });
      await skill2.save();

      const skills = await Skill.find({ name: 'Shared Name' });
      expect(skills.length).toBe(2);
    });
  });
});
