const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 测试API接口
async function testAPI() {
  console.log('开始测试API接口...\n');

  // 1. 测试健康检查接口
  try {
    console.log('1. 测试健康检查接口...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查接口正常:', healthResponse.data);
  } catch (error) {
    console.log('❌ 健康检查接口失败:', error.message);
  }

  // 2. 测试注册接口
  try {
    console.log('\n2. 测试注册接口...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      username: 'testuser123',
      email: 'testuser123@example.com',
      password: 'TestPassword123!'
    });
    console.log('✅ 注册接口正常:', registerResponse.data.user);
  } catch (error) {
    console.log('❌ 注册接口失败:', error.response?.data?.message || error.message);
  }

  // 3. 测试登录接口
  let token = null;
  try {
    console.log('\n3. 测试登录接口...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser123@example.com',
      password: 'TestPassword123!'
    });
    token = loginResponse.data.token;
    console.log('✅ 登录接口正常:', loginResponse.data.user);
  } catch (error) {
    console.log('❌ 登录接口失败:', error.response?.data?.message || error.message);
  }

  // 4. 测试获取当前用户信息
  if (token) {
    try {
      console.log('\n4. 测试获取当前用户信息...');
      const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ 获取用户信息接口正常:', meResponse.data);
    } catch (error) {
      console.log('❌ 获取用户信息接口失败:', error.response?.data?.message || error.message);
    }
  }

  // 5. 测试管理员邀请验证接口（无需认证）
  try {
    console.log('\n5. 测试管理员邀请验证接口...');
    const verifyResponse = await axios.get(`${BASE_URL}/admin/invitations/verify?code=invalidcode`);
    console.log('✅ 邀请验证接口正常:', verifyResponse.data);
  } catch (error) {
    console.log('❌ 邀请验证接口失败:', error.response?.data?.message || error.message);
  }

  // 6. 测试管理员仪表盘接口（需要管理员权限）
  if (token) {
    try {
      console.log('\n6. 测试管理员仪表盘接口...');
      const dashboardResponse = await axios.get(`${BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ 管理员仪表盘接口正常:', dashboardResponse.data);
    } catch (error) {
      console.log('❌ 管理员仪表盘接口失败:', error.response?.data?.message || error.message);
    }
  }

  // 7. 测试用户列表接口（需要管理员权限）
  if (token) {
    try {
      console.log('\n7. 测试用户列表接口...');
      const usersResponse = await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ 用户列表接口正常，用户数量:', usersResponse.data.users?.length);
    } catch (error) {
      console.log('❌ 用户列表接口失败:', error.response?.data?.message || error.message);
    }
  }

  // 8. 测试企业列表接口（需要管理员权限）
  if (token) {
    try {
      console.log('\n8. 测试企业列表接口...');
      const enterprisesResponse = await axios.get(`${BASE_URL}/admin/enterprises`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ 企业列表接口正常，企业数量:', enterprisesResponse.data.enterprises?.length);
    } catch (error) {
      console.log('❌ 企业列表接口失败:', error.response?.data?.message || error.message);
    }
  }

  console.log('\n===================');
  console.log('API测试完成');
  console.log('===================');
}

testAPI().catch(console.error);
