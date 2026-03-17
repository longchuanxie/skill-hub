const mongoose = require('mongoose');

async function updatePromptWithNewVersion() {
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

    console.log('Current prompt version:', prompt.version);
    console.log('Current versions count:', prompt.versions.length);

    const newVersion = '1.1.0';
    const oldVersion = prompt.version;
    
    prompt.versions.push({
      version: oldVersion,
      content: prompt.content,
      description: prompt.description,
      variables: prompt.variables,
      createdAt: prompt.createdAt
    });

    prompt.content = '这是更新后的提示词内容，增加了新的功能和变量';
    prompt.description = '更新后的描述，增加了更多功能说明';
    prompt.variables = [
      {
        name: 'topic',
        type: 'string',
        required: true,
        description: '主题'
      },
      {
        name: 'language',
        type: 'string',
        required: false,
        defaultValue: '中文',
        description: '语言'
      }
    ];
    prompt.version = newVersion;

    await prompt.save();
    
    console.log('\n=== Prompt Updated Successfully ===');
    console.log('New version:', prompt.version);
    console.log('Total versions:', prompt.versions.length);
    console.log('Version history:');
    prompt.versions.forEach((v, i) => {
      console.log(`  ${i + 1}. v${v.version} - ${v.content.substring(0, 20)}...`);
    });

  } catch (error) {
    console.error('Error updating prompt:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updatePromptWithNewVersion();