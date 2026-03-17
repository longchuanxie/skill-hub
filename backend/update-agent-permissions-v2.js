const mongoose = require('mongoose');

async function updateAgentPermissions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/skillhub');
    console.log('Connected to MongoDB');

    const result = await mongoose.connection.db.collection('agents').updateOne(
      { apiKey: '045c5f27fa20ba4630f64d005fc363e64eadd6bdd58c19340506cd662ec84d63' },
      { $set: { 'permissions.canWrite': true } }
    );

    console.log('Update result:', result);
    
    if (result.modifiedCount > 0) {
      console.log('✓ Agent permissions updated successfully');
    } else {
      console.log('✗ No agent found or no changes made');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateAgentPermissions();
