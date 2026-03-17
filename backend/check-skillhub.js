const mongoose = require('mongoose');

console.log('Connecting to skillhub database...');

mongoose.connect('mongodb://localhost:27017/skillhub')
  .then(async () => {
    console.log('Connected to skillhub database');
    
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
    console.log(`\nFound ${prompts.length} prompts in skillhub database:\n`);
    
    prompts.forEach((p, i) => {
      console.log(`${i+1}. ID: ${p._id}`);
      console.log(`   Name: ${p.name}`);
      console.log(`   Current Version: ${p.version}`);
      console.log('');
    });
    
    // Try to find the specific prompt
    const id = '69b8243c38852d7a19a4a033';
    const prompt = await Prompt.findById(id);
    console.log(`\nLooking for prompt with ID ${id}:`, prompt ? 'Found' : 'Not found');
    
    mongoose.connection.close();
    console.log('\nConnection closed');
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
