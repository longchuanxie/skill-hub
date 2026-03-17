const mongoose = require('mongoose');

async function recreateAgent() {
  try {
    await mongoose.connect('mongodb://localhost:27017/skillhub');
    console.log('✓ 连接到MongoDB成功');

    const db = mongoose.connection.db;
    const agentsCollection = db.collection('agents');
    
    // 删除所有现有的agent
    await agentsCollection.deleteMany({});
    console.log('✓ 清空agents集合');

    // 创建新的测试agent
    const agent = {
      description: 'Test agent for skill upload',
      apiKey: 'test-api-key-12345',
      endpoint: 'https://api.anthropic.com/v1/messages',
      isEnabled: true,
      createdBy: new mongoose.Types.ObjectId(),
      owner: new mongoose.Types.ObjectId(),
      enterpriseId: null,
      permissions: {
        canRead: true,
        canWrite: true,
        allowedResources: ['skills', 'prompts']
      },
      usage: {
        totalRequests: 0,
        lastUsed: null
      }
    };

    const result = await agentsCollection.insertOne(agent);
    console.log('✓ 测试Agent创建成功');
    console.log('✓ API Key:', agent.apiKey);
    console.log('✓ Agent ID:', result.insertedId);
    console.log('✓ Permissions:', JSON.stringify(agent.permissions));
    
    // 验证agent是否可以查询到
    const foundAgent = await agentsCollection.findOne({ apiKey: 'test-api-key-12345', isEnabled: true });
    if (foundAgent) {
      console.log('✓ Agent查询成功');
      console.log('✓ 查询结果:', JSON.stringify(foundAgent, null, 2));
    } else {
      console.log('✗ Agent查询失败');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('✗ 错误:', error.message);
  }
}

recreateAgent();
