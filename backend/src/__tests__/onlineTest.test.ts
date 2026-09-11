import request from 'supertest';
import express from 'express';
import { Skill } from '../models/Skill';
import { User } from '../models/User';
import { TestCase } from '../models/TestCase';
import { TestResult } from '../models/TestResult';
import testRoutes from '../routes/test';

describe('Online Test API', () => {
  let app: express.Application;
  let testUser: any;
  let skillId: string;
  let testCaseId: string;
  let testResultId: string;

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
    app.use('/api/test', testRoutes);
  });

  describe('Test Case Management', () => {
    describe('POST /api/test/skills/:skillId/test-cases', () => {
      it('should create test case', async () => {
        const response = await request(app)
          .post(`/api/test/skills/${skillId}/test-cases`)
          .send({
            name: 'Test Case 1',
            description: 'Test case description',
            input: { param1: 'value1' },
            expectedOutput: { result: 'success' },
            timeout: 30000
          })
          .expect(401);
      });
    });

    describe('GET /api/test/skills/:skillId/test-cases', () => {
      it('should get test cases', async () => {
        const testCase = new TestCase({
          skillId,
          name: 'Test Case 1',
          description: 'Test case',
          input: {},
          expectedOutput: {},
          createdBy: testUser._id
        });
        await testCase.save();

        const response = await request(app)
          .get(`/api/test/skills/${skillId}/test-cases`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
      });
    });

    describe('PUT /api/test/skills/:skillId/test-cases/:testCaseId', () => {
      it('should update test case', async () => {
        const testCase = new TestCase({
          skillId,
          name: 'Test Case 1',
          description: 'Test case',
          input: {},
          expectedOutput: {},
          createdBy: testUser._id
        });
        await testCase.save();
        testCaseId = testCase._id.toString();

        const response = await request(app)
          .put(`/api/test/skills/${skillId}/test-cases/${testCaseId}`)
          .send({ name: 'Updated Test Case' })
          .expect(401);
      });
    });

    describe('DELETE /api/test/skills/:skillId/test-cases/:testCaseId', () => {
      it('should delete test case', async () => {
        const testCase = new TestCase({
          skillId,
          name: 'Test Case 1',
          description: 'Test case',
          input: {},
          expectedOutput: {},
          createdBy: testUser._id
        });
        await testCase.save();
        testCaseId = testCase._id.toString();

        const response = await request(app)
          .delete(`/api/test/skills/${skillId}/test-cases/${testCaseId}`)
          .expect(401);
      });
    });
  });

  describe('Test Execution', () => {
    describe('POST /api/test/skills/:skillId/test', () => {
      it('should execute test', async () => {
        const response = await request(app)
          .post(`/api/test/skills/${skillId}/test`)
          .expect(401);
      });
    });

    describe('GET /api/test/skills/:skillId/test-results/:testResultId', () => {
      it('should get test result', async () => {
        const testResult = new TestResult({
          skillId,
          version: '1.0.0',
          status: 'running',
          createdBy: testUser._id
        });
        await testResult.save();
        testResultId = testResult._id.toString();

        const response = await request(app)
          .get(`/api/test/skills/${skillId}/test-results/${testResultId}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('GET /api/test/skills/:skillId/test-results/:testResultId/logs', () => {
      it('should get test logs', async () => {
        const testResult = new TestResult({
          skillId,
          version: '1.0.0',
          status: 'running',
          createdBy: testUser._id
        });
        await testResult.save();
        testResultId = testResult._id.toString();

        const response = await request(app)
          .get(`/api/test/skills/${skillId}/test-results/${testResultId}/logs`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });
  });
});
