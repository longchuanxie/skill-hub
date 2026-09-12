import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { User } from '../models/User';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { SkillVersion } from '../models/SkillVersion';
import { SkillPermissions } from '../models/SkillPermissions';
import { ResourceVersion } from '../models/ResourceVersion';

// Regression tests for batch-3: collaboration becomes effective, rollback
// creates a real new version, disabled users are locked out, copyPrompt
// stays unique and public skills cannot drop their file.
describe('Business rules (batch 3)', () => {
  let owner: any;
  let collaborator: any;
  let admin: any;
  let ownerToken: string;
  let collabToken: string;
  let adminToken: string;

  const signToken = (user: any) =>
    jwt.sign({ userId: user._id.toString(), role: user.role, type: 'access' }, 'test-secret', {
      expiresIn: '1h',
    });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Skill.deleteMany({}),
      Prompt.deleteMany({}),
      SkillVersion.deleteMany({}),
      SkillPermissions.deleteMany({}),
    ]);

    owner = await User.create({
      username: 'b3owner',
      email: 'b3owner@example.com',
      password: 'StrongPass123!',
    });
    collaborator = await User.create({
      username: 'b3collab',
      email: 'b3collab@example.com',
      password: 'StrongPass123!',
    });
    admin = await User.create({
      username: 'b3admin',
      email: 'b3admin@example.com',
      password: 'StrongPass123!',
      role: 'admin',
    });

    ownerToken = signToken(owner);
    collabToken = signToken(collaborator);
    adminToken = signToken(admin);
  });

  describe('collaboration', () => {
    let privateSkill: any;

    beforeEach(async () => {
      privateSkill = await Skill.create({
        name: 'Collab Skill',
        description: 'x',
        owner: owner._id,
        category: 'test',
        visibility: 'private',
        status: 'approved',
        version: '1.0.0',
      });
      await SkillPermissions.create({
        skillId: privateSkill._id,
        visibility: 'private',
        allowComments: true,
        allowForks: false,
        collaborators: [
          {
            userId: collaborator._id,
            username: collaborator.username,
            role: 'viewer',
            addedAt: new Date(),
            addedBy: owner._id,
          },
        ],
      });
    });

    it('lets a viewer collaborator read but not write', async () => {
      await request(app)
        .get(`/api/skills/${privateSkill._id}`)
        .set('Authorization', `Bearer ${collabToken}`)
        .expect(200);

      await request(app)
        .put(`/api/skills/${privateSkill._id}`)
        .set('Authorization', `Bearer ${collabToken}`)
        .send({ description: 'hijack' })
        .expect(403);
    });

    it('lets an editor collaborator write', async () => {
      await SkillPermissions.updateOne(
        { skillId: privateSkill._id },
        { 'collaborators.$[elem].role': 'editor' },
        { arrayFilters: [{ 'elem.userId': collaborator._id }] },
      );

      await request(app)
        .put(`/api/skills/${privateSkill._id}`)
        .set('Authorization', `Bearer ${collabToken}`)
        .send({ description: 'collab edit' })
        .expect(200);
    });

    it('lists shared skills for the collaborator with their role', async () => {
      const res = await request(app)
        .get('/api/shared-with-me')
        .set('Authorization', `Bearer ${collabToken}`)
        .expect(200);

      expect(res.body.skills.length).toBe(1);
      expect(res.body.skills[0].collaboratorRole).toBe('viewer');
    });
  });

  describe('rollback creates a new version', () => {
    it('makes the old content the latest again', async () => {
      const skill = await Skill.create({
        name: 'Rollback Skill',
        description: 'x',
        owner: owner._id,
        category: 'test',
        visibility: 'private',
        status: 'approved',
        version: '2.0.0',
      });
      await SkillVersion.create({
        skillId: skill._id,
        version: '1.0.0',
        url: 'uploads/old.zip',
        filename: 'old.zip',
        originalName: 'old.zip',
        size: 1,
        mimetype: 'application/zip',
        updateDescription: 'v1',
      });
      await SkillVersion.create({
        skillId: skill._id,
        version: '2.0.0',
        url: 'uploads/new.zip',
        filename: 'new.zip',
        originalName: 'new.zip',
        size: 1,
        mimetype: 'application/zip',
        updateDescription: 'v2',
      });
      await request(app)
        .post(`/api/versions/skill/${skill._id}`)
        .send({})
        .catch(() => undefined);
      await ResourceVersion.create({
        resourceId: skill._id,
        resourceType: 'skill',
        version: '1.0.0',
        versionNumber: 1,
        content: 'old',
        files: [{ filename: 'old.zip', path: 'uploads/old.zip', size: 1 }],
        createdBy: owner._id,
      });

      await request(app)
        .post(`/api/versions/skill/${skill._id}/1.0.0/rollback`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // downloadSkill serves the newest SkillVersion - after rollback it
      // must point at the rolled-back content, not v2.
      const latest = await SkillVersion.findOne({ skillId: skill._id }).sort({ createdAt: -1 });
      expect(latest?.url).toBe('uploads/old.zip');
    });
  });

  describe('disabled users', () => {
    it('rejects authentication after an admin disables the account', async () => {
      await request(app)
        .put(`/api/admin/users/${collaborator._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'disabled' })
        .expect(200);

      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${collabToken}`)
        .expect(403);
    });
  });

  describe('copyPrompt stays unique', () => {
    it('allows copying the same prompt twice', async () => {
      const prompt = await Prompt.create({
        name: 'Copyable',
        description: 'x',
        content: 'hello',
        owner: owner._id,
        category: 'test',
        visibility: 'public',
        status: 'approved',
        version: '1.0.0',
      });

      await request(app)
        .post(`/api/prompts/${prompt._id}/copy`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      await request(app)
        .post(`/api/prompts/${prompt._id}/copy`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const copies = await Prompt.countDocuments({
        owner: owner._id,
        name: /^Copyable \(Copy/,
      });
      expect(copies).toBe(2);
    });
  });

  describe('public skills must keep a file', () => {
    it('rejects flipping a file-less skill to public', async () => {
      const skill = await Skill.create({
        name: 'Fileless Skill',
        description: 'x',
        owner: owner._id,
        category: 'test',
        visibility: 'private',
        status: 'approved',
        version: '1.0.0',
        files: [],
      });

      await request(app)
        .put(`/api/skills/${skill._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ visibility: 'public' })
        .expect(400);
    });
  });
});
