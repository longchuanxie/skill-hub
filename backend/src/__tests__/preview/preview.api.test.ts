import request from 'supertest';
import express from 'express';
import { Skill } from '../../models/Skill';
import { SkillVersion } from '../../models/SkillVersion';
import { User } from '../../models/User';
import { createTestSkillZip } from '../helpers/testZip';
import skillsRoutes from '../../routes/skills';

describe('Skill Preview API', () => {
  let app: express.Application;
  let testUser: any;
  let skillId: string;
  let publicSkillId: string;

  beforeEach(async () => {
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    await testUser.save();

    await createTestSkillZip('uploads/test-skill.zip');
    await createTestSkillZip('uploads/test-skill-public.zip');

    const privateSkill = new Skill({
      name: 'Private Test Skill',
      description: 'A private skill for testing',
      owner: testUser._id,
      category: 'test',
      visibility: 'private',
      version: '1.0.0',
      files: [{
        filename: 'test-skill.zip',
        originalName: 'test-skill.zip',
        path: 'uploads/test-skill.zip',
        size: 1000,
        mimetype: 'application/zip',
      }],
    });
    await privateSkill.save();

    const privateSkillVersion = new SkillVersion({
      skillId: privateSkill._id,
      version: '1.0.0',
      url: 'uploads/test-skill.zip',
      filename: 'test-skill.zip',
      originalName: 'test-skill.zip',
      size: 1000,
      mimetype: 'application/zip',
      updateDescription: 'Initial version',
    });
    await privateSkillVersion.save();

    skillId = privateSkill._id.toString();

    const publicSkill = new Skill({
      name: 'Public Test Skill',
      description: 'A public skill for testing',
      owner: testUser._id,
      category: 'test',
      visibility: 'public',
      version: '1.0.0',
      files: [{
        filename: 'test-skill-public.zip',
        originalName: 'test-skill-public.zip',
        path: 'uploads/test-skill-public.zip',
        size: 1000,
        mimetype: 'application/zip',
      }],
    });
    await publicSkill.save();

    const publicSkillVersion = new SkillVersion({
      skillId: publicSkill._id,
      version: '1.0.0',
      url: 'uploads/test-skill-public.zip',
      filename: 'test-skill-public.zip',
      originalName: 'test-skill-public.zip',
      size: 1000,
      mimetype: 'application/zip',
      updateDescription: 'Initial version',
    });
    await publicSkillVersion.save();

    publicSkillId = publicSkill._id.toString();
  });

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/skills', skillsRoutes);
  });

  describe('GET /api/skills/:skillId/file-tree', () => {
    it('should return file tree for public skill', async () => {
      const response = await request(app)
        .get(`/api/skills/${publicSkillId}/file-tree`)
        .expect(200);

      expect(response.body).toHaveProperty('fileTree');
      expect(Array.isArray(response.body.fileTree)).toBe(true);
    });

    it('should return file tree for owner', async () => {
      const response = await request(app)
        .get(`/api/skills/${publicSkillId}/file-tree`)
        .expect(200);

      expect(response.body).toHaveProperty('fileTree');
      expect(Array.isArray(response.body.fileTree)).toBe(true);
    });

    it('should deny access for private skill without auth', async () => {
      const response = await request(app)
        .get(`/api/skills/${skillId}/file-tree`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent skill', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/skills/${fakeId}/file-tree`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for skill without file', async () => {
      const skillWithoutFile = new Skill({
        name: 'Skill Without File',
        description: 'A skill without file',
        owner: testUser._id,
        category: 'test',
        visibility: 'public',
        version: '1.0.0',
        files: [],
      });
      await skillWithoutFile.save();

      const response = await request(app)
        .get(`/api/skills/${skillWithoutFile._id}/file-tree`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/skills/:id/preview', () => {
    it('should preview text file content', async () => {
      const response = await request(app)
        .get(`/api/skills/${publicSkillId}/preview`)
        .query({ path: 'README.md' })
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('mimeType');
      expect(response.body).toHaveProperty('isBinary');
    });

    it('should preview code file content', async () => {
      const response = await request(app)
        .get(`/api/skills/${publicSkillId}/preview`)
        .query({ path: 'src/index.js' })
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body.mimeType).toBe('application/javascript');
      expect(response.body.isBinary).toBe(false);
    });

    it('should identify binary files', async () => {
      const response = await request(app)
        .get(`/api/skills/${publicSkillId}/preview`)
        .query({ path: 'image.png' })
        .expect(200);

      expect(response.body).toHaveProperty('isBinary');
      expect(response.body.isBinary).toBe(true);
    });

    it('should deny access for private skill without auth', async () => {
      const response = await request(app)
        .get(`/api/skills/${skillId}/preview`)
        .query({ path: 'README.md' })
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent skill', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/skills/${fakeId}/preview`)
        .query({ path: 'README.md' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for skill without file', async () => {
      const skillWithoutFile = new Skill({
        name: 'Skill Without File',
        description: 'A skill without file',
        owner: testUser._id,
        category: 'test',
        visibility: 'public',
        version: '1.0.0',
        files: [],
      });
      await skillWithoutFile.save();

      const response = await request(app)
        .get(`/api/skills/${skillWithoutFile._id}/preview`)
        .query({ path: 'README.md' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});