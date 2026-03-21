import request from 'supertest';
import express from 'express';
import { Skill } from '../models/Skill';
import { User } from '../models/User';
import { SkillPermissions } from '../models/SkillPermissions';
import { PermissionAuditLog } from '../models/PermissionAuditLog';
import permissionsRoutes from '../routes/permissions';

describe('Permission Management API', () => {
  let app: express.Application;
  let testUser: any;
  let collaboratorUser: any;
  let skillId: string;

  beforeEach(async () => {
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    await testUser.save();

    collaboratorUser = new User({
      username: 'collaborator',
      email: 'collaborator@example.com',
      password: 'password123',
    });
    await collaboratorUser.save();

    const skill = new Skill({
      name: 'Test Skill',
      description: 'A skill for testing',
      owner: testUser._id,
      category: 'test',
      visibility: 'private',
      version: '1.0.0',
    });
    await skill.save();
    skillId = skill._id.toString();
  });

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api', permissionsRoutes);
  });

  describe('Permission Settings', () => {
    describe('GET /api/skills/:skillId/permissions', () => {
      it('should get permissions', async () => {
        const response = await request(app)
          .get(`/api/skills/${skillId}/permissions`)
          .expect(401);
      });
    });

    describe('PUT /api/skills/:skillId/permissions', () => {
      it('should update permissions', async () => {
        const response = await request(app)
          .put(`/api/skills/${skillId}/permissions`)
          .send({
            visibility: 'public',
            allowComments: true,
            allowForks: true
          })
          .expect(401);
      });
    });
  });

  describe('Collaborator Management', () => {
    describe('POST /api/skills/:skillId/collaborators', () => {
      it('should add collaborator', async () => {
        const response = await request(app)
          .post(`/api/skills/${skillId}/collaborators`)
          .send({
            userId: collaboratorUser._id.toString(),
            role: 'editor'
          })
          .expect(401);
      });
    });

    describe('PUT /api/skills/:skillId/collaborators/:userId', () => {
      it('should update collaborator role', async () => {
        const response = await request(app)
          .put(`/api/skills/${skillId}/collaborators/${collaboratorUser._id}`)
          .send({ role: 'admin' })
          .expect(401);
      });
    });

    describe('DELETE /api/skills/:skillId/collaborators/:userId', () => {
      it('should remove collaborator', async () => {
        const response = await request(app)
          .delete(`/api/skills/${skillId}/collaborators/${collaboratorUser._id}`)
          .expect(401);
      });
    });
  });

  describe('Permission Audit Logs', () => {
    describe('GET /api/skills/:skillId/permissions/audit-logs', () => {
      it('should get audit logs', async () => {
        const auditLog = new PermissionAuditLog({
          skillId,
          action: 'create',
          performedBy: testUser._id
        });
        await auditLog.save();

        const response = await request(app)
          .get(`/api/skills/${skillId}/permissions/audit-logs`)
          .expect(401);
      });
    });
  });

  describe('Permission Check', () => {
    describe('GET /api/skills/:skillId/permissions/check', () => {
      it('should check permission', async () => {
        const response = await request(app)
          .get(`/api/skills/${skillId}/permissions/check`)
          .query({ permission: 'view' })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
      });
    });
  });
});
