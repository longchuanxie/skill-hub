import request from 'supertest';
import express from 'express';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { SkillVersion } from '../models/SkillVersion';
import { PromptVersion } from '../models/PromptVersion';
import { ResourceVersion } from '../models/ResourceVersion';
import { User } from '../models/User';
import { Agent } from '../models/Agent';
import { Enterprise } from '../models/Enterprise';
import agentRoutes from '../routes/agentResources';
import mongoose from 'mongoose';

describe('Agent Resources Version Management', () => {
  let app: express.Application;
  let testUser: any;
  let testEnterprise: any;
  let testAgent: any;
  let agentApiKey: string;

  const mockAuth = (req: any, res: any, next: any) => {
    req.agent = testAgent;
    next();
  };

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/agent', mockAuth, agentRoutes);
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    await testUser.save();

    testEnterprise = new Enterprise({
      name: 'Test Enterprise',
      domain: 'test.com',
      owner: testUser._id,
      members: [{
        userId: testUser._id,
        role: 'admin',
        joinedAt: new Date(),
      }],
      settings: {
        resourceReview: {
          autoApprove: false,
          enableContentFilter: true,
        },
      },
    });
    await testEnterprise.save();

    agentApiKey = 'test-api-key-' + Date.now();
    testAgent = new Agent({
      name: 'Test Agent',
      owner: testUser._id,
      createdBy: testUser._id,
      enterpriseId: testEnterprise._id,
      permissions: {
        canRead: true,
        canWrite: true,
        allowedResources: [],
      },
      apiKey: agentApiKey,
    });
    await testAgent.save();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('POST /api/agent/skills', () => {
    it('should create new skill when name is unique', async () => {
      const response = await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'unique-skill',
          description: 'Test skill description',
          category: 'general',
        })
        .expect(201);

      expect(response.body.isNew).toBe(true);
      expect(response.body.skill.name).toBe('unique-skill');
      expect(response.body.skill.version).toBe('1.0.0');
      expect(response.body.message).toBe('Skill created successfully');
    });

    it('should create new version when skill name exists', async () => {
      await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'duplicate-skill',
          description: 'First version',
          category: 'general',
        })
        .expect(201);

      const response = await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'duplicate-skill',
          description: 'Second version',
          category: 'general',
        })
        .expect(200);

      expect(response.body.isNew).toBe(false);
      expect(response.body.previousVersion).toBe('1.0.0');
      expect(response.body.currentVersion).toBe('1.0.1');
      expect(response.body.message).toBe('Skill version updated successfully');
    });

    it('should create ResourceVersion record for new skill (no file)', async () => {
      const response = await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'version-test-skill',
          description: 'Test skill',
          category: 'general',
        })
        .expect(201);

      const skillId = response.body.skill._id;

      expect(response.body.status).toBe('draft');

      const skillVersions = await SkillVersion.find({ skillId });
      expect(skillVersions.length).toBe(0);

      const resourceVersions = await ResourceVersion.find({
        resourceId: skillId,
        resourceType: 'skill',
      });
      expect(resourceVersions.length).toBe(1);
      expect(resourceVersions[0].version).toBe('1.0.0');
    });

    it('should create additional ResourceVersion record when updating version (no file)', async () => {
      const createResponse = await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'version-update-test',
          description: 'First version',
          category: 'general',
        })
        .expect(201);

      const skillId = createResponse.body.skill._id;

      await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'version-update-test',
          description: 'Second version',
          category: 'general',
        })
        .expect(200);

      const skillVersions = await SkillVersion.find({ skillId }).sort({ createdAt: -1 });
      expect(skillVersions.length).toBe(0);

      const resourceVersions = await ResourceVersion.find({
        resourceId: skillId,
        resourceType: 'skill',
      }).sort({ createdAt: -1 });
      expect(resourceVersions.length).toBe(2);
      expect(resourceVersions[0].version).toBe('1.0.1');
    });

    it('should increment version correctly on multiple updates', async () => {
      await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({ name: 'multi-update', description: 'v1' })
        .expect(201);

      await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({ name: 'multi-update', description: 'v2' })
        .expect(200);

      const response = await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({ name: 'multi-update', description: 'v3' })
        .expect(200);

      expect(response.body.currentVersion).toBe('1.0.2');
    });

    it('should set visibility to enterprise for enterprise agent', async () => {
      const response = await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'enterprise-skill',
          description: 'Enterprise skill',
        })
        .expect(201);

      expect(response.body.visibility).toBe('enterprise');
      expect(response.body.skill.visibility).toBe('enterprise');
    });
  });

  describe('POST /api/agent/prompts', () => {
    it('should create new prompt when name is unique', async () => {
      const response = await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'unique-prompt',
          description: 'Test prompt description',
          content: 'This is a test prompt content',
          updateDescription: 'Initial version',
        })
        .expect(201);

      expect(response.body.isNew).toBe(true);
      expect(response.body.prompt.name).toBe('unique-prompt');
      expect(response.body.prompt.version).toBe('1.0.0');
      expect(response.body.message).toBe('Prompt created successfully');
    });

    it('should create new version when prompt name exists', async () => {
      await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'duplicate-prompt',
          description: 'First version',
          content: 'First content',
          updateDescription: 'Initial version',
        })
        .expect(201);

      const response = await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'duplicate-prompt',
          description: 'Second version',
          content: 'Second content',
          updateDescription: 'Updated version',
        })
        .expect(200);

      expect(response.body.isNew).toBe(false);
      expect(response.body.previousVersion).toBe('1.0.0');
      expect(response.body.currentVersion).toBe('1.0.1');
      expect(response.body.message).toBe('Prompt version updated successfully');
    });

    it('should create PromptVersion and ResourceVersion records for new prompt', async () => {
      const response = await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'version-test-prompt',
          description: 'Test prompt',
          content: 'Test content',
          updateDescription: 'Initial version',
        })
        .expect(201);

      const promptId = response.body.prompt._id;

      const promptVersions = await PromptVersion.find({ promptId });
      expect(promptVersions.length).toBe(1);
      expect(promptVersions[0].version).toBe('1.0.0');

      const resourceVersions = await ResourceVersion.find({
        resourceId: promptId,
        resourceType: 'prompt',
      });
      expect(resourceVersions.length).toBe(1);
      expect(resourceVersions[0].version).toBe('1.0.0');
    });

    it('should create PromptVersion and ResourceVersion records when updating version', async () => {
      const createResponse = await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'version-update-test',
          description: 'First version',
          content: 'First content',
          updateDescription: 'Initial version',
        })
        .expect(201);

      const promptId = createResponse.body.prompt._id;

      await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'version-update-test',
          description: 'Second version',
          content: 'Second content',
          updateDescription: 'Updated version',
        })
        .expect(200);

      const promptVersions = await PromptVersion.find({ promptId }).sort({ createdAt: -1 });
      expect(promptVersions.length).toBe(2);
      expect(promptVersions[0].version).toBe('1.0.1');

      const resourceVersions = await ResourceVersion.find({
        resourceId: promptId,
        resourceType: 'prompt',
      }).sort({ createdAt: -1 });
      expect(resourceVersions.length).toBe(2);
      expect(resourceVersions[0].version).toBe('1.0.1');
    });

    it('should increment version correctly on multiple updates', async () => {
      await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({ name: 'multi-update', description: 'v1', content: 'c1', updateDescription: 'v1' })
        .expect(201);

      await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({ name: 'multi-update', description: 'v2', content: 'c2', updateDescription: 'v2' })
        .expect(200);

      const response = await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({ name: 'multi-update', description: 'v3', content: 'c3', updateDescription: 'v3' })
        .expect(200);

      expect(response.body.currentVersion).toBe('1.0.2');
    });

    it('should set visibility to enterprise for enterprise agent', async () => {
      const response = await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'enterprise-prompt',
          description: 'Enterprise prompt',
          content: 'Enterprise prompt content',
          updateDescription: 'Initial',
        })
        .expect(201);

      expect(response.body.visibility).toBe('enterprise');
      expect(response.body.prompt.visibility).toBe('enterprise');
    });

    it('should update prompt content when creating new version', async () => {
      await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'content-test',
          description: 'Original description',
          content: 'Original content',
          updateDescription: 'Initial',
        })
        .expect(201);

      const response = await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'content-test',
          description: 'Updated description',
          content: 'Updated content',
          updateDescription: 'Updated',
        })
        .expect(200);

      expect(response.body.prompt.content).toBe('Updated content');
      expect(response.body.prompt.description).toBe('Updated description');
    });
  });

  describe('GET /api/agent/skills', () => {
    it('should return skills for enterprise agent', async () => {
      await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({ name: 'skill1', description: 'desc1' })
        .expect(201);

      await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({ name: 'skill2', description: 'desc2' })
        .expect(201);

      const response = await request(app)
        .get('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .expect(200);

      expect(response.body.skills.length).toBe(2);
      expect(response.body.pagination.total).toBe(2);
    });
  });

  describe('GET /api/agent/prompts', () => {
    it('should return prompts for enterprise agent', async () => {
      await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'prompt1',
          description: 'desc1',
          content: 'c1',
          updateDescription: 'v1',
        })
        .expect(201);

      await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'prompt2',
          description: 'desc2',
          content: 'c2',
          updateDescription: 'v2',
        })
        .expect(201);

      const response = await request(app)
        .get('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .expect(200);

      expect(response.body.prompts.length).toBe(2);
      expect(response.body.pagination.total).toBe(2);
    });
  });

  describe('GET /api/agent/check-update', () => {
    it('should return update info when newer version exists', async () => {
      await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'update-test-skill',
          description: 'First version',
          updateDescription: 'Initial version',
        })
        .expect(201);

      await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'update-test-skill',
          description: 'Second version',
          updateDescription: 'Bug fixes',
        })
        .expect(200);

      const response = await request(app)
        .get('/api/agent/check-update')
        .query({ resourceType: 'skill', name: 'update-test-skill', version: '1.0.0' })
        .set('X-API-Key', agentApiKey)
        .expect(200);

      expect(response.body.hasUpdate).toBe(true);
      expect(response.body.latestVersion).toBe('1.0.1');
      expect(response.body.currentVersion).toBe('1.0.0');
      expect(response.body.updateAvailable).toBe(true);
      expect(response.body.changelog).toBe('Bug fixes');
    });

    it('should return no update when already on latest version', async () => {
      await request(app)
        .post('/api/agent/skills')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'latest-test-skill',
          description: 'Test skill',
          updateDescription: 'First version',
        })
        .expect(201);

      const response = await request(app)
        .get('/api/agent/check-update')
        .query({ resourceType: 'skill', name: 'latest-test-skill', version: '1.0.0' })
        .set('X-API-Key', agentApiKey)
        .expect(200);

      expect(response.body.hasUpdate).toBe(false);
      expect(response.body.updateAvailable).toBe(false);
    });

    it('should check prompt updates', async () => {
      await request(app)
        .post('/api/agent/prompts')
        .set('X-API-Key', agentApiKey)
        .send({
          name: 'update-test-prompt',
          description: 'Test prompt',
          content: 'Test content',
          updateDescription: 'Initial version',
        })
        .expect(201);

      const response = await request(app)
        .get('/api/agent/check-update')
        .query({ resourceType: 'prompt', name: 'update-test-prompt', version: '1.0.0' })
        .set('X-API-Key', agentApiKey)
        .expect(200);

      expect(response.body.hasUpdate).toBe(false);
      expect(response.body.latestVersion).toBe('1.0.0');
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/api/agent/check-update')
        .query({ resourceType: 'skill' })
        .set('X-API-Key', agentApiKey)
        .expect(400);

      expect(response.body.error).toBe('MISSING_PARAMETERS');
    });

    it('should return 400 for invalid resource type', async () => {
      const response = await request(app)
        .get('/api/agent/check-update')
        .query({ resourceType: 'invalid', name: 'test', version: '1.0.0' })
        .set('X-API-Key', agentApiKey)
        .expect(400);

      expect(response.body.error).toBe('INVALID_RESOURCE_TYPE');
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/agent/check-update')
        .query({ resourceType: 'skill', name: 'NonExistent', version: '1.0.0' })
        .set('X-API-Key', agentApiKey)
        .expect(404);

      expect(response.body.error).toBe('RESOURCE_NOT_FOUND');
    });
  });
});
