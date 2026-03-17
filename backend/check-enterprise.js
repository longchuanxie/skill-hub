const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/agent-browser')
  .then(async () => {
    const promptSchema = new mongoose.Schema({
      name: String,
      version: String,
      enterpriseId: mongoose.Schema.Types.ObjectId,
      content: String,
      description: String,
      variables: Array,
      createdAt: Date,
      updatedAt: Date,
      visibility: String,
      owner: mongoose.Schema.Types.ObjectId,
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
      console.log(`   EnterpriseId: ${p.enterpriseId || 'null'}`);
      console.log(`   Visibility: ${p.visibility}`);
      console.log(`   Owner: ${p.owner}`);
      console.log('');
    });
    
    mongoose.connection.close();
  })
  .catch(console.error);
