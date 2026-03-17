const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/agent-browser')
  .then(async () => {
    const promptSchema = new mongoose.Schema({
      name: String,
      version: String,
      versions: [{
        version: String,
        content: String,
        description: String,
        variables: Array,
        createdAt: Date
      }]
    });

    const Prompt = mongoose.model('Prompt', promptSchema);

    const prompt = await Prompt.findById('69b81beeee53ede65c6ffa29');
    
    if (!prompt) {
      console.log('Prompt not found!');
    } else {
      console.log('Prompt Name:', prompt.name);
      console.log('Current Version:', prompt.version);
      console.log('\nAll Versions in History:');
      prompt.versions.forEach((v, i) => {
        console.log(`${i+1}. "${v.version}"`);
      });
      console.log('\nNote: The current version "' + prompt.version + '" may not be in the versions array if it was just updated.');
    }
    
    mongoose.connection.close();
  })
  .catch(console.error);
