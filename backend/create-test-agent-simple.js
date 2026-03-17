const mongoose = require('mongoose');
const Agent = require('./dist/models/Agent.js').Agent;

async function createTestAgent() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agent-browser');
    console.log('✓ 连接到MongoDB成功');

    const agent = new Agent({
      description: 'Test agent for skill upload',
      apiKey: 'test-api-key-12345',
      endpoint: 'https://api.anthropic.com/v1/messages',
      createdBy: new mongoose.Types.ObjectId(),
      enterpriseId: null,
      permissions: {
        canRead: true,
        canWrite: true,
        allowedResources: ['skills', 'prompts']
      }
    });

    await agent.save();
    console.log('✓ 测试Agent创建成功');
    console.log('✓ API Key:', agent.apiKey);
    console.log('✓ Agent ID:', agent._id);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('✗ 错误:', error.message);
  }
}

createTestAgent();
