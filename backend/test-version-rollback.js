const mongoose = require('mongoose');

async function testVersionRollbackAPI() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agent-browser');
    console.log('Connected to MongoDB');

    const Prompt = mongoose.model('Prompt', new mongoose.Schema({
      name: String,
      description: String,
      content: String,
      variables: Array,
      category: String,
      tags: Array,
      owner: mongoose.Schema.Types.ObjectId,
      visibility: String,
      status: String,
      version: String,
      versions: Array
    }));

    const promptId = '69b8243c38852d7a19a4a033';
    const prompt = await Prompt.findById(promptId);
    
    if (!prompt) {
      console.log('Prompt not found');
      return;
    }

    console.log('\n=== Testing Version Rollback API ===');
    console.log('Before Rollback:');
    console.log(`  Current Version: ${prompt.version}`);
    console.log(`  Content: ${prompt.content.substring(0, 30)}...`);
    console.log(`  Total Versions: ${prompt.versions.length}`);

    const targetVersion = '1.0.0';
    const targetVersionData = prompt.versions.find(v => v.version === targetVersion);
    
    if (!targetVersionData) {
      console.log('Target version not found');
      return;
    }

    const rollbackVersion = `${targetVersion}-rollback-${Date.now()}`;
    
    prompt.versions.push({
      version: rollbackVersion,
      content: prompt.content,
      description: prompt.description,
      variables: prompt.variables,
      createdAt: new Date()
    });

    prompt.content = targetVersionData.content;
    prompt.description = targetVersionData.description;
    prompt.variables = targetVersionData.variables;
    prompt.version = `${targetVersion}-restored`;

    await prompt.save();
    
    console.log('\nAfter Rollback:');
    console.log(`  New Version: ${prompt.version}`);
    console.log(`  Content: ${prompt.content.substring(0, 30)}...`);
    console.log(`  Rollback Version: ${rollbackVersion}`);
    console.log(`  Total Versions: ${prompt.versions.length}`);

    console.log('\nVersion History After Rollback:');
    prompt.versions.forEach((v, i) => {
      console.log(`  ${i + 1}. v${v.version} - ${v.content.substring(0, 20)}...`);
    });

    console.log('\n✅ Version Rollback API Test Passed');

  } catch (error) {
    console.error('Error testing version rollback API:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testVersionRollbackAPI();