const mongoose = require('mongoose');

async function checkAllData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agent-browser');
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // 检查所有集合
    const collections = await db.listCollections().toArray();
    console.log('=== Collections ===');
    collections.forEach(c => console.log(`  - ${c.name}`));
    
    // 检查 skills
    const skills = await db.collection('skills').find({}).toArray();
    console.log(`\n=== Skills (${skills.length}) ===`);
    skills.forEach(s => {
      console.log(`  - ${s.name}: owner=${s.owner}`);
    });
    
    // 检查 prompts
    const prompts = await db.collection('prompts').find({}).toArray();
    console.log(`\n=== Prompts (${prompts.length}) ===`);
    prompts.forEach(p => {
      console.log(`  - ${p.name}: owner=${p.owner}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllData();
