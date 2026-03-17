const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/agent-browser')
  .then(async () => {
    const Prompt = mongoose.model('Prompt', new mongoose.Schema({
      versions: [{
        version: String,
        content: String,
        description: String,
        variables: Array,
        createdAt: Date
      }],
      version: String
    }));

    const prompt = await Prompt.findById('69b81beeee53ede65c6ffa29');
    console.log('Current version:', prompt.version);
    console.log('All versions:');
    prompt.versions.forEach((v, i) => {
      console.log(`${i+1}. ${v.version} - ${v.createdAt}`);
    });
    
    mongoose.connection.close();
  })
  .catch(console.error);