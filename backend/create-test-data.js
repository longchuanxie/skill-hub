const mongoose = require('mongoose');

async function createTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/agent-browser');
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      role: String
    }));

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

    let user = await User.findOne({ username: 'testuser' });
    if (!user) {
      user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user'
      });
      await user.save();
      console.log('Created test user:', user._id);
    } else {
      console.log('Using existing user:', user._id);
    }

    let prompt = await Prompt.findOne({ name: '测试提示词' });
    if (!prompt) {
      prompt = new Prompt({
        name: '测试提示词',
        description: '这是一个测试提示词，用于验证多版本控制功能',
        content: '这是初始版本的提示词内容',
        variables: [
          {
            name: 'topic',
            type: 'string',
            required: true,
            description: '主题'
          }
        ],
        category: 'technical',
        tags: ['test', 'version-control'],
        owner: user._id,
        visibility: 'public',
        status: 'approved',
        version: '1.0.0',
        versions: [
          {
            version: '1.0.0',
            content: '这是初始版本的提示词内容',
            description: '这是一个测试提示词，用于验证多版本控制功能',
            variables: [
              {
                name: 'topic',
                type: 'string',
                required: true,
                description: '主题'
              }
            ],
            createdAt: new Date('2024-01-01T10:00:00Z')
          }
        ]
      });
      await prompt.save();
      console.log('Created test prompt:', prompt._id);
    } else {
      console.log('Using existing prompt:', prompt._id);
    }

    console.log('\n=== Test Data Created Successfully ===');
    console.log('User ID:', user._id);
    console.log('Prompt ID:', prompt._id);
    console.log('Prompt Version:', prompt.version);
    console.log('Versions Count:', prompt.versions.length);

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestData();