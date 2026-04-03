const mongoose = require('mongoose');
const { AdminInvitation } = require('./src/models/AdminInvitation');
const { User } = require('./src/models/User');

// 连接到 MongoDB
mongoose.connect('mongodb://localhost:27017/skillhub', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  return runTest();
}).catch((error) => {
  console.error('Connection error:', error);
  process.exit(1);
});

async function runTest() {
  try {
    // 1. 创建一个测试邀请
    console.log('Creating test invitation...');
    const invitation = new AdminInvitation({
      email: 'test-admin@example.com',
      inviterId: '60d0fe4f5311236168a109ca', // 假设的超级管理员ID
      role: 'admin',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await invitation.save();
    console.log('Invitation created:', invitation);

    // 2. 验证邀请是否有效
    console.log('\nVerifying invitation...');
    const isValid = invitation.isValid();
    console.log('Invitation is valid:', isValid);

    // 3. 模拟管理员注册
    console.log('\nSimulating admin registration...');
    // 这里可以添加模拟注册的逻辑

    // 4. 清理测试数据
    console.log('\nCleaning up test data...');
    await AdminInvitation.deleteOne({ _id: invitation._id });
    console.log('Test data cleaned up');

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // 关闭数据库连接
    mongoose.connection.close();
  }
}
