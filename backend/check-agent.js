const mongoose = require('mongoose');
const { Agent } = require('./dist/models/Agent');

async function checkAgentPermissions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/skillhub');
    console.log('Connected to MongoDB');

    const agent = await Agent.findOne({ apiKey: '045c5f27fa20ba4630f64d005fc363e64eadd6bdd58c19340506cd662ec84d63' });
    if (agent) {
      console.log('Agent found:');
      console.log('- ID:', agent._id);
      console.log('- Owner:', agent.owner);
      console.log('- Enterprise ID:', agent.enterpriseId);
      console.log('- Permissions:', agent.permissions);
      console.log('- API Key:', agent.apiKey);
    } else {
      console.log('Agent not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAgentPermissions();
