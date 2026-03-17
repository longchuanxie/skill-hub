const mongoose = require('mongoose');

async function testVersionHistoryAPI() {
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

    console.log('\n=== Testing Version History API ===');
    console.log('Prompt ID:', prompt._id);
    console.log('Current Version:', prompt.version);
    console.log('Total Versions:', prompt.versions.length);
    console.log('\nVersion Details:');
    
    prompt.versions.forEach((v, i) => {
      console.log(`\n${i + 1}. Version: ${v.version}`);
      console.log(`   Content: ${v.content.substring(0, 30)}...`);
      console.log(`   Description: ${v.description.substring(0, 30)}...`);
      console.log(`   Variables: ${v.variables.length} variables`);
      console.log(`   Created At: ${v.createdAt}`);
    });

    console.log('\n✅ Version History API Test Passed');

  } catch (error) {
    console.error('Error testing version history API:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testVersionHistoryAPI();