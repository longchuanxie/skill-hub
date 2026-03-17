const mongoose = require('mongoose');

console.log('Connecting to MongoDB...');

mongoose.connect('mongodb://localhost:27017/agent-browser')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const promptSchema = new mongoose.Schema({
      name: String,
      version: String,
      content: String,
      description: String,
      variables: Array,
      createdAt: Date,
      updatedAt: Date,
      versions: [{
        version: String,
        content: String,
        description: String,
        variables: Array,
        createdAt: Date
      }]
    });

    const Prompt = mongoose.model('Prompt', promptSchema);

    const id = '69b8243c38852d7a19a4a033';
    console.log('Looking for prompt with ID:', id);

    // Try to find by ID
    const prompt = await Prompt.findById(id);
    console.log('findById result:', prompt ? 'Found' : 'Not found');
    
    if (!prompt) {
      // List all prompts
      const allPrompts = await Prompt.find({});
      console.log('\nAll prompts in database:', allPrompts.length);
      allPrompts.forEach((p, i) => {
        console.log(`${i+1}. ID: ${p._id}, Name: ${p.name}`);
      });
    } else {
      console.log('Prompt found:', prompt.name);
    }
    
    mongoose.connection.close();
    console.log('Connection closed');
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
