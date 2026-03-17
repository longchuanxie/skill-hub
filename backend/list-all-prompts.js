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

    const prompts = await Prompt.find({});
    console.log(`Found ${prompts.length} prompts:\n`);
    
    prompts.forEach((p, i) => {
      console.log(`${i+1}. ID: ${p._id}`);
      console.log(`   Name: ${p.name}`);
      console.log(`   Current Version: ${p.version}`);
      console.log(`   Versions Count: ${p.versions?.length || 0}`);
      if (p.versions && p.versions.length > 0) {
        console.log(`   Version List: ${p.versions.map(v => v.version).join(', ')}`);
      }
      console.log('');
    });
    
    mongoose.connection.close();
  })
  .catch(console.error);
