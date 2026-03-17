const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/agent-browser')
  .then(async () => {
    const Prompt = mongoose.model('Prompt', new mongoose.Schema({
      name: String,
      versions: [{
        version: String,
        content: String,
        description: String,
        variables: Array,
        createdAt: Date
      }],
      version: String
    }));

    const prompts = await Prompt.find({});
    console.log(`Found ${prompts.length} prompts:`);
    prompts.forEach((p, i) => {
      console.log(`${i+1}. ID: ${p._id}, Name: ${p.name}, Current Version: ${p.version}, Versions Count: ${p.versions.length}`);
    });
    
    mongoose.connection.close();
  })
  .catch(console.error);