const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 测试管理员API接口
async function testAdminAPI() {
  console.log('开始测试管理员API接口...\n');

  // 1. 注册一个管理员账户（使用admin@example.com）
  let adminToken = null;
  try {
    console.log('1. 注册管理员账户...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      username: 'admin_test',
      email: 'admin@example.com',
      password: 'AdminPassword123!'
    });
    console.log('✅ 管理员注册成功:', registerResponse.data.user);
    adminToken = registerResponse.data.token;
  } catch (error) {
    console.log('❌ 管理员注册失败:', error.response?.data?.message || error.message);
    // 如果注册失败，尝试登录
    try {
      console.log('尝试登录现有管理员账户...');
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@example.com',
        password: 'AdminPassword123!'
      });
      console.log('✅ 管理员登录成功');
      adminToken = loginResponse.data.token;
    } catch (loginError) {
      console.log('❌ 管理员登录失败:', loginError.response?.data?.message || loginError.message);
    }
  }

  // 2. 测试管理员仪表盘接口
  if (adminToken) {
    try {
      console.log('\n2. 测试管理员仪表盘接口...');
      const dashboardResponse = await axios.get(`${BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ 管理员仪表盘接口正常:');
      console.log('   - 总用户数:', dashboardResponse.data.totalUsers);
      console.log('   - 总企业数:', dashboardResponse.data.totalEnterprises);
      console.log('   - 总技能数:', dashboardResponse.data.totalSkills);
      console.log('   - 总提示词数:', dashboardResponse.data.totalPrompts);
      console.log('   - 待审核内容:', dashboardResponse.data.pendingContent);
    } catch (error) {
      console.log('❌ 管理员仪表盘接口失败:', error.response?.data?.message || error.message);
    }
  }

  // 3. 测试用户列表接口
  if (adminToken) {
    try {
      console.log('\n3. 测试用户列表接口...');
      const usersResponse = await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ 用户列表接口正常:');
      console.log('   - 用户数量:', usersResponse.data.users?.length);
      console.log('   - 总用户数:', usersResponse.data.pagination?.total);
    } catch (error) {
      console.log('❌ 用户列表接口失败:', error.response?.data?.message || error.message);
    }
  }

  // 4. 测试企业列表接口
  if (adminToken) {
    try {
      console.log('\n4. 测试企业列表接口...');
      const enterprisesResponse = await axios.get(`${BASE_URL}/admin/enterprises`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ 企业列表接口正常:');
      console.log('   - 企业数量:', enterprisesResponse.data.enterprises?.length);
      console.log('   - 总企业数:', enterprisesResponse.data.pagination?.total);
    } catch (error) {
      console.log('❌ 企业列表接口失败:', error.response?.data?.message || error.message);
    }
  }

  // 5. 测试创建管理员邀请（需要超级管理员权限）
  if (adminToken) {
    try {
      console.log('\n5. 测试创建管理员邀请...');
      const invitationResponse = await axios.post(`${BASE_URL}/admin/invitations`, {
        email: 'newadmin@example.com',
        role: 'admin'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ 创建管理员邀请成功:', invitationResponse.data);
    } catch (error) {
      console.log('❌ 创建管理员邀请失败:', error.response?.data?.message || error.message);
      if (error.response?.status === 403) {
        console.log('   提示: 当前用户不是超级管理员，无法创建邀请');
      }
    }
  }

  // 6. 测试获取邀请列表
  if (adminToken) {
    try {
      console.log('\n6. 测试获取邀请列表...');
      const invitationsResponse = await axios.get(`${BASE_URL}/admin/invitations`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ 获取邀请列表成功:');
      console.log('   - 邀请数量:', invitationsResponse.data.invitations?.length);
      console.log('   - 总邀请数:', invitationsResponse.data.pagination?.total);
    } catch (error) {
      console.log('❌ 获取邀请列表失败:', error.response?.data?.message || error.message);
    }
  }

  console.log('\n===================');
  console.log('管理员API测试完成');
  console.log('===================');
}

testAdminAPI().catch(console.error);
