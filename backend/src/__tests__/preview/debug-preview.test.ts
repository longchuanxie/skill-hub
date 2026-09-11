import request from 'supertest';
import express from 'express';
import { Skill } from '../../models/Skill';
import { User } from '../../models/User';
import { createTestSkillZip } from '../helpers/testZip';
import skillsRoutes from '../../routes/skills';

const app = express();
app.use(express.json());
app.use('/api/skills', skillsRoutes);

describe('Debug Preview Test', () => {
  let publicSkillId: string;
  let testUser: any;

  beforeAll(async () => {
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    await testUser.save();

    await createTestSkillZip('uploads/test-skill-public.zip');

    const publicSkill = new Skill({
      name: 'Public Test Skill',
      description: 'A public skill for testing',
      owner: testUser._id,
      category: 'test',
      visibility: 'public',
      version: '1.0.0',
      versions: [{
        version: '1.0.0',
        url: 'uploads/test-skill-public.zip',
        createdAt: new Date(),
      }],
    });
    await publicSkill.save();
    publicSkillId = publicSkill._id.toString();
  });

  it('should preview text file content', async () => {
    console.log('Testing preview with publicSkillId:', publicSkillId);
    const response = await request(app)
      .get(`/api/skills/${publicSkillId}/preview`)
      .query({ path: 'README.md' });

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
  });
});
