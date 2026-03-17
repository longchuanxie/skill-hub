const mongoose = require('mongoose');

async function checkAgentSchema() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agent-browser');
    console.log('✓ 连接到MongoDB成功');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n数据库中的集合:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    const agentsCollection = db.collection('agents');
    const sampleAgent = await agentsCollection.findOne();
    
    if (sampleAgent) {
      console.log('\n示例Agent文档:');
      console.log(JSON.stringify(sampleAgent, null, 2));
    } else {
      console.log('\n没有找到Agent文档');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('✗ 错误:', error.message);
  }
}

checkAgentSchema();
