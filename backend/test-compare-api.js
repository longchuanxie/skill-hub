const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/agent-browser')
  .then(async () => {
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
    const version1 = '1.0.0-restored';
    const version2 = '1.0.0';

    console.log('Testing comparison for prompt:', id);
    console.log('Version 1:', version1);
    console.log('Version 2:', version2);

    const prompt = await Prompt.findById(id);
    
    if (!prompt) {
      console.log('Prompt not found!');
      mongoose.connection.close();
      return;
    }

    console.log('\nPrompt found:', prompt.name);
    console.log('Current version:', prompt.version);
    console.log('Versions in history:', prompt.versions.map(v => v.version));

    // Test getVersionData logic
    const getVersionData = (version) => {
      const versionFromHistory = prompt.versions.find(v => v.version === version);
      if (versionFromHistory) {
        console.log(`Found ${version} in history`);
        return versionFromHistory;
      }
      
      if (version === prompt.version) {
        console.log(`Found ${version} as current version`);
        return {
          version: prompt.version,
          content: prompt.content,
          description: prompt.description,
          variables: prompt.variables,
          createdAt: prompt.updatedAt || prompt.createdAt,
        };
      }
      
      console.log(`Version ${version} not found`);
      return null;
    };

    console.log('\n--- Testing version lookup ---');
    const v1 = getVersionData(version1);
    const v2 = getVersionData(version2);

    console.log('\nVersion 1 found:', !!v1);
    console.log('Version 2 found:', !!v2);

    if (v1 && v2) {
      console.log('\n--- Comparison would succeed ---');
    } else {
      console.log('\n--- Comparison would fail ---');
    }
    
    mongoose.connection.close();
  })
  .catch(console.error);
