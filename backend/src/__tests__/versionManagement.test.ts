import request from 'supertest';
import express from 'express';
import { Skill } from '../models/Skill';
import { User } from '../models/User';
import { ResourceVersion } from '../models/ResourceVersion';
import versionsRoutes from '../routes/versions';

describe('Version Management API', () => {
  let app: express.Application;
  let testUser: any;
  let skillId: string;
  let versionId: string;

  beforeEach(async () => {
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    await testUser.save();

    const skill = new Skill({
      name: 'Test Skill',
      description: 'A skill for testing',
      owner: testUser._id,
      category: 'test',
      visibility: 'public',
      version: '1.0.0',
    });
    await skill.save();
    skillId = skill._id.toString();
  });

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/versions', versionsRoutes);
  });

  describe('Version List and Details', () => {
    describe('GET /api/versions/:resourceType/:resourceId', () => {
      it('should get versions list', async () => {
        const version = new ResourceVersion({
          resourceId: skillId,
          resourceType: 'skill',
          version: '1.0.0',
          versionNumber: 1,
          content: 'Test content',
          createdBy: testUser._id
        });
        await version.save();

        const response = await request(app)
          .get(`/api/versions/skill/${skillId}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
      });
    });

    describe('GET /api/versions/:resourceType/:resourceId/:version', () => {
      it('should get version details', async () => {
        const version = new ResourceVersion({
          resourceId: skillId,
          resourceType: 'skill',
          version: '1.0.0',
          versionNumber: 1,
          content: 'Test content',
          createdBy: testUser._id
        });
        await version.save();

        const response = await request(app)
          .get(`/api/versions/skill/${skillId}/1.0.0`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });
  });

  describe('Version Creation', () => {
    describe('POST /api/versions/:resourceType/:resourceId', () => {
      it('should create version', async () => {
        const response = await request(app)
          .post(`/api/versions/skill/${skillId}`)
          .send({
            version: '1.1.0',
            content: 'New version content',
            changelog: 'Initial version'
          })
          .expect(401);
      });
    });
  });

  describe('Version Rollback', () => {
    describe('POST /api/versions/:resourceType/:resourceId/:version/rollback', () => {
      it('should rollback version', async () => {
        const response = await request(app)
          .post(`/api/versions/skill/${skillId}/1.0.0/rollback`)
          .expect(401);
      });
    });
  });

  describe('Version Tags', () => {
    describe('POST /api/versions/:resourceType/:resourceId/:version/tags', () => {
      it('should add version tag', async () => {
        const response = await request(app)
          .post(`/api/versions/skill/${skillId}/1.0.0/tags`)
          .send({ tag: 'stable' })
          .expect(401);
      });
    });

    describe('DELETE /api/versions/:resourceType/:resourceId/:version/tags/:tag', () => {
      it('should delete version tag', async () => {
        const response = await request(app)
          .delete(`/api/versions/skill/${skillId}/1.0.0/tags/stable`)
          .expect(401);
      });
    });
  });

  describe('Version Comparison', () => {
    describe('GET /api/versions/:resourceType/:resourceId/compare', () => {
      it('should compare versions', async () => {
        const version1 = new ResourceVersion({
          resourceId: skillId,
          resourceType: 'skill',
          version: '1.0.0',
          versionNumber: 1,
          content: 'Version 1',
          createdBy: testUser._id
        });
        await version1.save();

        const version2 = new ResourceVersion({
          resourceId: skillId,
          resourceType: 'skill',
          version: '1.1.0',
          versionNumber: 2,
          content: 'Version 2',
          createdBy: testUser._id
        });
        await version2.save();

        const response = await request(app)
          .get(`/api/versions/skill/${skillId}/compare`)
          .query({ from: '1.0.0', to: '1.1.0' })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });
  });

  describe('Version Download', () => {
    describe('GET /api/versions/:resourceType/:resourceId/:version/download', () => {
      it('should download version', async () => {
        const version = new ResourceVersion({
          resourceId: skillId,
          resourceType: 'skill',
          version: '1.0.0',
          versionNumber: 1,
          content: 'Test content',
          createdBy: testUser._id
        });
        await version.save();

        const response = await request(app)
          .get(`/api/versions/skill/${skillId}/1.0.0/download`)
          .expect(400);
      });
    });
  });
});
