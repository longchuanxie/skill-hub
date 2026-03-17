const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/agent-browser')
  .then(async () => {
    const promptSchema = new mongoose.Schema({
      name: String,
      versions: [{
        version: String,
        content: String,
        description: String,
        variables: Array,
        createdAt: Date
      }],
      version: String
    });

    const Prompt = mongoose.model('Prompt', promptSchema);

    const prompt = await Prompt.findById('69b81beeee53ede65c6ffa29');
    
    if (!prompt) {
      console.log('Prompt not found!');
    } else {
      console.log('Prompt Name:', prompt.name);
      console.log('Current Version:', prompt.version);
      console.log('\nAll Versions:');
      prompt.versions.forEach((v, i) => {
        console.log(`${i+1}. Version String: "${v.version}"`);
        console.log(`   Created At: ${v.createdAt}`);
        console.log(`   Content Length: ${v.content.length}`);
        console.log(`   Description: ${v.description.substring(0, 50)}...`);
        console.log('');
      });
    }
    
    mongoose.connection.close();
  })
  .catch(console.error);