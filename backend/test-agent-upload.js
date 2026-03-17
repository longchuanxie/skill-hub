const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const API_KEY = '045c5f27fa20ba4630f64d005fc363e64eadd6bdd58c19340506cd662ec84d63';

async function testAgentUpload() {
  console.log('=== 测试Agent API上传功能 ===\n');

  try {
    console.log('1. 测试POST /api/agent/skills (非企业用户)');
    const skillResponse = await axios.post(`${BASE_URL}/api/agent/skills`, {
      name: '测试技能',
      description: '这是一个测试技能，用于验证API上传功能',
      category: 'test',
      tags: ['test', 'api'],
      version: '1.0.0'
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✓ Skill上传成功:', skillResponse.data);
    console.log('  - Visibility:', skillResponse.data.visibility);
    console.log('  - Status:', skillResponse.data.status);
    console.log('  - AutoReview:', skillResponse.data.autoReviewResult);
    console.log();

    console.log('2. 测试POST /api/agent/prompts (非企业用户)');
    const promptResponse = await axios.post(`${BASE_URL}/api/agent/prompts`, {
      name: '测试提示词',
      description: '这是一个测试提示词',
      content: '你是一个有用的助手，请帮助用户解决问题。',
      variables: [],
      category: 'test',
      tags: ['test', 'api'],
      version: '1.0.0'
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✓ Prompt上传成功:', promptResponse.data);
    console.log('  - Visibility:', promptResponse.data.visibility);
    console.log('  - Status:', promptResponse.data.status);
    console.log('  - AutoReview:', promptResponse.data.autoReviewResult);
    console.log();

    console.log('3. 测试包含敏感词的内容');
    const sensitiveResponse = await axios.post(`${BASE_URL}/api/agent/skills`, {
      name: '测试敏感词',
      description: '包含暴力内容的测试',
      category: 'test',
      tags: ['test'],
      version: '1.0.0'
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.log('✓ 敏感词检测正常:', error.response?.data || error.message);
      console.log();
    });

    console.log('4. 测试GET /api/agent/skills');
    const getSkillsResponse = await axios.get(`${BASE_URL}/api/agent/skills`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    console.log('✓ 获取Skills成功:', getSkillsResponse.data.skills.length, '个技能');
    console.log();

    console.log('5. 测试GET /api/agent/prompts');
    const getPromptsResponse = await axios.get(`${BASE_URL}/api/agent/prompts`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    console.log('✓ 获取Prompts成功:', getPromptsResponse.data.prompts.length, '个提示词');
    console.log();

  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message);
  }
}

async function testEnterpriseSettings() {
  console.log('=== 测试企业资源审核配置 ===\n');

  try {
    console.log('1. 测试GET /api/enterprises/:id/resource-review-settings');
    const getSettingsResponse = await axios.get(`${BASE_URL}/api/enterprises/test-enterprise-id/resource-review-settings`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✓ 获取资源审核配置成功:', getSettingsResponse.data);
    console.log();

    console.log('2. 测试PUT /api/enterprises/:id/resource-review-settings');
    const updateSettingsResponse = await axios.put(`${BASE_URL}/api/enterprises/test-enterprise-id/resource-review-settings`, {
      autoApprove: true,
      enableContentFilter: false
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('✓ 更新资源审核配置成功:', updateSettingsResponse.data);
    console.log();

  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message);
    console.log('  (这可能是因为需要有效的企业ID和认证token)');
  }
}

async function runTests() {
  await testAgentUpload();
  await testEnterpriseSettings();
  console.log('=== 测试完成 ===');
}

runTests();
