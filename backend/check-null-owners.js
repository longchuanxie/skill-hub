const mongoose = require('mongoose');

async function checkNullOwners() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agent-browser');
    console.log('Connected to MongoDB\n');

    // 直接使用原生的 MongoDB 查询来检查
    const db = mongoose.connection.db;
    
    // 检查 skills
    const skillsCollection = db.collection('skills');
    const nullOwnerSkills = await skillsCollection.find({ 
      $or: [
        { owner: null },
        { owner: { $exists: false } }
      ]
    }).toArray();
    
    console.log('=== Skills with null/missing owner ===');
    console.log(`Count: ${nullOwnerSkills.length}`);
    nullOwnerSkills.forEach(s => {
      console.log(`  - ${s.name} (${s._id})`);
    });
    
    // 检查 prompts
    const promptsCollection = db.collection('prompts');
    const nullOwnerPrompts = await promptsCollection.find({ 
      $or: [
        { owner: null },
        { owner: { $exists: false } }
      ]
    }).toArray();
    
    console.log('\n=== Prompts with null/missing owner ===');
    console.log(`Count: ${nullOwnerPrompts.length}`);
    nullOwnerPrompts.forEach(p => {
      console.log(`  - ${p.name} (${p._id})`);
    });

    // 显示所有 skills 的 owner 情况
    console.log('\n=== All Skills Owner Status ===');
    const allSkills = await skillsCollection.find({}).toArray();
    allSkills.forEach(s => {
      console.log(`  - ${s.name}: owner=${s.owner}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkNullOwners();
