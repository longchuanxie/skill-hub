const mongoose = require('mongoose');

async function fixPromptOwner() {
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

    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      role: String
    }));

    const promptId = '69b8243c38852d7a19a4a033';
    const userId = '69b8243c38852d7a19a4a030';
    
    const user = await User.findById(userId);
    console.log('User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('User:', user.username, user.email);
    }

    const prompt = await Prompt.findById(promptId);
    console.log('Prompt found:', prompt ? 'YES' : 'NO');
    if (prompt) {
      console.log('Current owner:', prompt.owner);
      console.log('Owner type:', typeof prompt.owner);
      
      const updatedPrompt = await Prompt.findByIdAndUpdate(
        promptId,
        { owner: userId },
        { new: true }
      );
      
      console.log('✅ Prompt owner updated');
      console.log('New owner:', updatedPrompt.owner);
    }

  } catch (error) {
    console.error('Error fixing prompt owner:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixPromptOwner();