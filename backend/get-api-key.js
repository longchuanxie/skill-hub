const mongoose = require('mongoose');
const Agent = require('./dist/models/Agent.js').Agent;

async function getValidApiKey() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agent-browser');
    console.log('✓ 连接到MongoDB成功');

    const agent = await Agent.findOne({ apiKey: { $exists: true, $ne: null } });
    
    if (agent) {
      console.log('✓ 找到有效的API key:', agent.apiKey);
      console.log('✓ Agent名称:', agent.name);
      console.log('✓ Agent ID:', agent._id);
    } else {
      console.log('✗ 未找到有效的API key');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('✗ 错误:', error.message);
  }
}

getValidApiKey();
