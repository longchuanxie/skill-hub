const mongoose = require('mongoose');
const { Agent } = require('./dist/models/Agent');
const { User } = require('./dist/models/User');

async function createTestAgent() {
  try {
    await mongoose.connect('mongodb://localhost:27017/skillhub');
    console.log('Connected to MongoDB');

    const user = await User.findOne({ username: 'admin' });
    if (!user) {
      console.log('No admin user found');
      return;
    }

    const existingAgent = await Agent.findOne({ owner: user._id });
    if (existingAgent) {
      console.log('Test agent already exists:', existingAgent.apiKey);
      return;
    }

    const agent = new Agent({
      description: 'Test agent for API upload functionality',
      owner: user._id,
      createdBy: user._id,
      permissions: { canRead: true, canWrite: true, allowedResources: [] },
    });
    agent.regenerateApiKey();

    await agent.save();
    console.log('Test agent created successfully!');
    console.log('API Key:', agent.apiKey);
    console.log('Agent ID:', agent._id);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestAgent();
