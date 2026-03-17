const mongoose = require('mongoose');

async function checkApiResponse() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agent-browser');
    console.log('Connected to MongoDB\n');

    // 加载实际的模型
    const Skill = require('./dist/models/Skill').Skill;
    const Prompt = require('./dist/models/Prompt').Prompt;

    // 获取所有 skills（模拟 API 的行为）
    const skills = await Skill.find({}).populate('owner', 'username avatar');
    
    console.log('=== Skills from API simulation ===');
    skills.forEach(s => {
      console.log(`\nSkill: ${s.name}`);
      console.log(`  _id: ${s._id}`);
      console.log(`  owner: ${JSON.stringify(s.owner)}`);
      console.log(`  owner type: ${typeof s.owner}`);
      if (s.owner && typeof s.owner === 'object') {
        console.log(`  owner._id: ${s.owner._id}`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkApiResponse();
