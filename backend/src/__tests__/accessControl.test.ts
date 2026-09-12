import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { User } from '../models/User';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { SkillVersion } from '../models/SkillVersion';
import { ResourceVersion } from '../models/ResourceVersion';

// Regression tests for the batch-1 access-control hardening:
// - version read endpoints require public/owner access
// - GET /api/users is admin-only and leaks no sensitive fields
// - likes are per-user (previously every user toggled the same slot)
// - private prompts cannot be rendered by strangers
// - enterprise-visibility resources stay out of anonymous search
describe('Access control (batch 1)', () => {
  let owner: any;
  let stranger: any;
  let admin: any;
  let ownerToken: string;
  let strangerToken: string;
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
      ResourceVersion.deleteMany({}),
    ]);

    owner = await User.create({
      username: 'owner1',
      email: 'owner1@example.com',
      password: 'StrongPass123!',
    });
    stranger = await User.create({
      username: 'stranger1',
      email: 'stranger1@example.com',
      password: 'StrongPass123!',
    });
    admin = await User.create({
      username: 'admin1',
      email: 'admin1@example.com',
      password: 'StrongPass123!',
      role: 'admin',
    });

    ownerToken = signToken(owner);
    strangerToken = signToken(stranger);
    adminToken = signToken(admin);
  });

  describe('GET /api/versions/*', () => {
    let publicSkill: any;
    let privateSkill: any;

    beforeEach(async () => {
      publicSkill = await Skill.create({
        name: 'Public Versioned Skill',
        description: 'A public skill',
        owner: owner._id,
        category: 'test',
        visibility: 'public',
        status: 'approved',
        version: '1.0.0',
      });
      privateSkill = await Skill.create({
        name: 'Private Versioned Skill',
        description: 'A private skill',
        owner: owner._id,
        category: 'test',
        visibility: 'private',
        status: 'approved',
        version: '1.0.0',
      });
      await ResourceVersion.create({
        resourceId: publicSkill._id,
        resourceType: 'skill',
        version: '1.0.0',
        versionNumber: 1,
        content: 'public content',
        createdBy: owner._id,
      });
      await ResourceVersion.create({
        resourceId: privateSkill._id,
        resourceType: 'skill',
        version: '1.0.0',
        versionNumber: 1,
        content: 'private content',
        createdBy: owner._id,
      });
    });

    it('lists versions of a public skill anonymously', async () => {
      const res = await request(app).get(`/api/versions/skill/${publicSkill._id}`).expect(200);
      expect(res.body.versions.length).toBeGreaterThan(0);
    });

    it('denies version list of a private skill to strangers and anonymous', async () => {
      await request(app).get(`/api/versions/skill/${privateSkill._id}`).expect(403);
      await request(app)
        .get(`/api/versions/skill/${privateSkill._id}`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .expect(403);
    });

    it('allows the owner to list versions of their private skill', async () => {
      await request(app)
        .get(`/api/versions/skill/${privateSkill._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    });

    it('denies version detail of a private skill anonymously', async () => {
      await request(app).get(`/api/versions/skill/${privateSkill._id}/1.0.0`).expect(403);
    });
  });

  describe('GET /api/users', () => {
    it('rejects non-admin users', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${strangerToken}`)
        .expect(403);
    });

    it('returns users without sensitive fields for admins', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.users.length).toBeGreaterThan(0);
      for (const user of res.body.users) {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('passwordResetToken');
        expect(user).not.toHaveProperty('twoFactorSecret');
        expect(user).not.toHaveProperty('loginHistory');
      }
    });
  });

  describe('likes are per-user', () => {
    it('keeps two users likes independent', async () => {
      const skill = await Skill.create({
        name: 'Likeable Skill',
        description: 'x',
        owner: owner._id,
        category: 'test',
        visibility: 'public',
        status: 'approved',
        version: '1.0.0',
      });

      const first = await request(app)
        .post(`/api/likes/skill/${skill._id}/toggle`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      expect(first.body.liked).toBe(true);

      const second = await request(app)
        .post(`/api/likes/skill/${skill._id}/toggle`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .expect(200);
      expect(second.body.liked).toBe(true);
      expect(second.body.likeCount).toBe(2);

      const reloaded = await Skill.findById(skill._id).select('likes likeCount').lean();
      expect(reloaded?.likes.length).toBe(2);
      expect(reloaded?.likeCount).toBe(2);
    });
  });

  describe('POST /api/prompts/:id/render', () => {
    it('denies rendering a private prompt to strangers', async () => {
      const prompt = await Prompt.create({
        name: 'Secret Prompt',
        description: 'x',
        content: 'secret {{answer}}',
        owner: owner._id,
        category: 'test',
        visibility: 'private',
        status: 'approved',
        version: '1.0.0',
      });

      await request(app)
        .post(`/api/prompts/${prompt._id}/render`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ variables: { answer: '42' } })
        .expect(403);

      const ownerRender = await request(app)
        .post(`/api/prompts/${prompt._id}/render`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ variables: { answer: '42' } })
        .expect(200);
      expect(ownerRender.body.result).toContain('42');
    });
  });

  describe('search visibility', () => {
    it('hides enterprise resources from anonymous search', async () => {
      await Skill.create({
        name: 'Zeta Public Search Skill',
        description: 'zeta keyword public',
        owner: owner._id,
        category: 'test',
        visibility: 'public',
        status: 'approved',
        version: '1.0.0',
      });
      await Skill.create({
        name: 'Zeta Enterprise Search Skill',
        description: 'zeta keyword enterprise',
        owner: owner._id,
        enterpriseId: stranger._id,
        category: 'test',
        visibility: 'enterprise',
        status: 'approved',
        version: '1.0.0',
      });

      const res = await request(app)
        .get('/api/search')
        .query({ q: 'zeta', type: 'skill' })
        .expect(200);

      const names: string[] = res.body.data.skills.items.map((s: { name: string }) => s.name);
      expect(names).toContain('Zeta Public Search Skill');
      expect(names).not.toContain('Zeta Enterprise Search Skill');
    });
  });
});
