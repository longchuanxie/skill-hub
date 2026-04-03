const mongoose = require('mongoose');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/skillhub', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  // Update admin2 user role
  return User.findOneAndUpdate(
    { username: 'admin2' },
    { role: 'admin' },
    { new: true }
  );
}).then((user) => {
  if (user) {
    console.log('Updated user:', user);
  } else {
    console.log('User admin2 not found');
  }
  // Close connection
  return mongoose.connection.close();
}).then(() => {
  console.log('Connection closed');
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error);
  mongoose.connection.close();
  process.exit(1);
});
