const mongoose = require('mongoose');

async function checkSavedAgent() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agent-browser');
    console.log('✓ 连接到MongoDB成功');

    const db = mongoose.connection.db;
    const agentsCollection = db.collection('agents');
    
    const agents = await agentsCollection.find({}).toArray();
    
    console.log('\n数据库中的Agent:');
    if (agents.length === 0) {
      console.log('没有找到任何Agent');
    } else {
      agents.forEach((agent, index) => {
        console.log(`\nAgent ${index + 1}:`);
        console.log(`  _id: ${agent._id}`);
        console.log(`  apiKey: ${agent.apiKey}`);
        console.log(`  description: ${agent.description}`);
        console.log(`  isEnabled: ${agent.isEnabled}`);
        console.log(`  permissions: ${JSON.stringify(agent.permissions)}`);
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('✗ 错误:', error.message);
  }
}

checkSavedAgent();
