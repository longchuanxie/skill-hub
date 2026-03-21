import { Prompt } from '../models/Prompt';
import { PromptVersion } from '../models/PromptVersion';
import { User } from '../models/User';
import { generateNextVersion } from '../controllers/PromptController';

describe('Prompt Name Version Management', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    await testUser.save();
  });

  describe('generateNextVersion', () => {
    it('should return 1.0.0 for prompt with no versions', async () => {
      const prompt = new Prompt({
        name: 'Test Prompt',
        description: 'A test prompt',
        content: 'Hello {{name}}',
        owner: testUser._id,
        category: 'general',
        visibility: 'private',
      });
      await prompt.save();

      const nextVersion = await generateNextVersion(prompt._id);
      expect(nextVersion).toBe('1.0.0');
    });

    it('should increment patch version correctly', async () => {
      const prompt = new Prompt({
        name: 'Test Prompt',
        description: 'A test prompt',
        content: 'Hello {{name}}',
        owner: testUser._id,
        category: 'general',
        visibility: 'private',
        version: '1.0.0',
      });
      await prompt.save();

      const promptVersion = new PromptVersion({
        promptId: prompt._id,
        version: '1.0.0',
        content: 'Hello {{name}}',
        description: 'A test prompt',
        variables: [],
        updateDescription: 'Initial version',
      });
      await promptVersion.save();

      const nextVersion = await generateNextVersion(prompt._id);
      expect(nextVersion).toBe('1.0.1');
    });

    it('should handle version overflow correctly', async () => {
      const prompt = new Prompt({
        name: 'Test Prompt',
        description: 'A test prompt',
        content: 'Hello {{name}}',
        owner: testUser._id,
        category: 'general',
        visibility: 'private',
        version: '1.0.99',
      });
      await prompt.save();

      const promptVersion = new PromptVersion({
        promptId: prompt._id,
        version: '1.0.99',
        content: 'Hello {{name}}',
        description: 'A test prompt',
        variables: [],
        updateDescription: 'Version 1.0.99',
      });
      await promptVersion.save();

      const nextVersion = await generateNextVersion(prompt._id);
      expect(nextVersion).toBe('1.1.0');
    });
  });

  describe('Same name prompt creation', () => {
    it('should find existing prompt by owner and name', async () => {
      const prompt = new Prompt({
        name: 'Existing Prompt',
        description: 'A test prompt',
        content: 'Hello {{name}}',
        owner: testUser._id,
        category: 'general',
        visibility: 'private',
        version: '1.0.0',
      });
      await prompt.save();

      const found = await Prompt.findOne({ owner: testUser._id, name: 'Existing Prompt' });
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Existing Prompt');
    });

    it('should not find prompt with different owner', async () => {
      const otherUser = new User({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123',
      });
      await otherUser.save();

      const prompt = new Prompt({
        name: 'Other Prompt',
        description: 'A test prompt',
        content: 'Hello {{name}}',
        owner: otherUser._id,
        category: 'general',
        visibility: 'private',
        version: '1.0.0',
      });
      await prompt.save();

      const found = await Prompt.findOne({ owner: testUser._id, name: 'Other Prompt' });
      expect(found).toBeNull();
    });

    it('should create new version when same user creates same name', async () => {
      const prompt = new Prompt({
        name: 'Version Test Prompt',
        description: 'A test prompt',
        content: 'Hello {{name}}',
        owner: testUser._id,
        category: 'general',
        visibility: 'private',
        version: '1.0.0',
      });
      await prompt.save();

      const promptVersion = new PromptVersion({
        promptId: prompt._id,
        version: '1.0.0',
        content: 'Hello {{name}}',
        description: 'A test prompt',
        variables: [],
        updateDescription: 'Initial version',
      });
      await promptVersion.save();

      const newVersion = await generateNextVersion(prompt._id);
      expect(newVersion).toBe('1.0.1');

      const newPromptVersion = new PromptVersion({
        promptId: prompt._id,
        version: newVersion,
        content: 'Hello {{name}}, welcome!',
        description: 'Updated prompt',
        variables: [],
        updateDescription: 'Update to version 1.0.1',
      });
      await newPromptVersion.save();

      const versions = await PromptVersion.find({ promptId: prompt._id }).sort({ createdAt: 1 });
      expect(versions.length).toBe(2);
      expect(versions[0].version).toBe('1.0.0');
      expect(versions[1].version).toBe('1.0.1');
    });
  });

  describe('Prompt model unique index', () => {
    it('should allow same name with different owners', async () => {
      const otherUser = new User({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123',
      });
      await otherUser.save();

      const prompt1 = new Prompt({
        name: 'Shared Name',
        description: 'A test prompt',
        content: 'Hello {{name}}',
        owner: testUser._id,
        category: 'general',
        visibility: 'private',
      });
      await prompt1.save();

      const prompt2 = new Prompt({
        name: 'Shared Name',
        description: 'Another test prompt',
        content: 'Hi {{name}}',
        owner: otherUser._id,
        category: 'general',
        visibility: 'private',
      });
      await prompt2.save();

      const prompts = await Prompt.find({ name: 'Shared Name' });
      expect(prompts.length).toBe(2);
    });
  });
});
