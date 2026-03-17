const mongoose = require('mongoose');

async function testAPIEndpoint() {
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
    const prompt = await Prompt.findById(promptId).populate('owner', 'username avatar');
    
    if (!prompt) {
      console.log('❌ Prompt not found in database');
      return;
    }

    console.log('✅ Prompt found in database:');
    console.log('   ID:', prompt._id);
    console.log('   Name:', prompt.name);
    console.log('   Visibility:', prompt.visibility);
    console.log('   Status:', prompt.status);
    console.log('   Version:', prompt.version);
    console.log('   Owner:', prompt.owner ? prompt.owner.username : 'N/A');

    const ownerId = prompt.owner && prompt.owner._id ? prompt.owner._id : prompt.owner;
    console.log('   Owner ID:', ownerId);
    
    const hasAccess = 
      prompt.visibility === 'public' || 
      String(ownerId) === 'test-user-id';

    console.log('   Has Access:', hasAccess);

  } catch (error) {
    console.error('Error testing API endpoint:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAPIEndpoint();