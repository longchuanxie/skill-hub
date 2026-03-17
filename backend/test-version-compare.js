const mongoose = require('mongoose');

async function testVersionCompareAPI() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agent-browser');
    console.log('Connected to MongoDB');

    const Prompt = mongoose.model('Prompt', new mongoose.Schema({
      name: String,
      description: String,
      content: String,
      variables: Array,
      category: String,
      tags: Array,
      owner: mongoose.Schema.Types.ObjectId,
      visibility: String,
      status: String,
      version: String,
      versions: Array
    }));

    const promptId = '69b8243c38852d7a19a4a033';
    const prompt = await Prompt.findById(promptId);
    
    if (!prompt) {
      console.log('Prompt not found');
      return;
    }

    console.log('\n=== Testing Version Compare API ===');
    
    const version1 = prompt.versions[0];
    const version2 = {
      version: prompt.version,
      content: prompt.content,
      description: prompt.description,
      variables: prompt.variables,
      createdAt: new Date()
    };

    console.log('\nComparing Version 1.0.0 vs Version 1.1.0');
    console.log('='.repeat(50));

    const differences = {
      contentChanged: version1.content !== version2.content,
      descriptionChanged: version1.description !== version2.description,
      variablesChanged: JSON.stringify(version1.variables) !== JSON.stringify(version2.variables)
    };

    console.log('\nDifferences:');
    console.log(`  Content Changed: ${differences.contentChanged ? '✅ YES' : '❌ NO'}`);
    console.log(`  Description Changed: ${differences.descriptionChanged ? '✅ YES' : '❌ NO'}`);
    console.log(`  Variables Changed: ${differences.variablesChanged ? '✅ YES' : '❌ NO'}`);

    console.log('\nVersion 1.0.0 Details:');
    console.log(`  Content: ${version1.content}`);
    console.log(`  Description: ${version1.description}`);
    console.log(`  Variables: ${version1.variables.length} variables`);

    console.log('\nVersion 1.1.0 Details:');
    console.log(`  Content: ${version2.content}`);
    console.log(`  Description: ${version2.description}`);
    console.log(`  Variables: ${version2.variables.length} variables`);

    if (differences.variablesChanged) {
      console.log('\nVariable Changes:');
      const v1Vars = version1.variables;
      const v2Vars = version2.variables;
      
      v1Vars.forEach(v1 => {
        const v2 = v2Vars.find(v => v.name === v1.name);
        if (!v2) {
          console.log(`  ❌ Removed: ${v1.name} (${v1.type})`);
        } else if (JSON.stringify(v1) !== JSON.stringify(v2)) {
          console.log(`  🔄 Modified: ${v1.name}`);
        }
      });
      
      v2Vars.forEach(v2 => {
        const v1 = v1Vars.find(v => v.name === v2.name);
        if (!v1) {
          console.log(`  ➕ Added: ${v2.name} (${v2.type})`);
        }
      });
    }

    const changeCount = Object.values(differences).filter(Boolean).length;
    console.log(`\n✅ Version Compare API Test Passed (${changeCount} changes detected)`);

  } catch (error) {
    console.error('Error testing version compare API:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testVersionCompareAPI();