const mongoose = require('mongoose');

async function checkPrompts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agent-browser');
    console.log('Connected to MongoDB');

    const prompts = await mongoose.connection.db.collection('prompts').find({}).toArray();
    console.log('\n=== All Prompts in Database ===');
    console.log('Total:', prompts.length);
    
    prompts.forEach((prompt, i) => {
      console.log(`\n${i + 1}. ${prompt.name}`);
      console.log(`   ID: ${prompt._id}`);
      console.log(`   Version: ${prompt.version}`);
      console.log(`   Status: ${prompt.status}`);
      console.log(`   Versions: ${prompt.versions ? prompt.versions.length : 0}`);
    });

  } catch (error) {
    console.error('Error checking prompts:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkPrompts();