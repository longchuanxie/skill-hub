const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3002/api/agent';
const API_KEY = 'test-api-key-12345';

async function testSkillMdUpload() {
  console.log('开始测试SKILL.md格式ZIP包上传...\n');

  const form = new FormData();
  
  const zipFilePath = path.join(__dirname, 'test-skill-md.zip');
  if (!fs.existsSync(zipFilePath)) {
    console.error('✗ 测试ZIP包不存在，请先运行 test-skill-md-zip.js');
    process.exit(1);
  }

  form.append('file', fs.createReadStream(zipFilePath), {
    filename: 'test-skill-md.zip',
    contentType: 'application/zip'
  });
  form.append('name', 'test-skill-md');
  form.append('description', 'Test skill with SKILL.md format');
  form.append('category', 'testing');
  form.append('tags', 'test,validation,demo');

  try {
    const response = await fetch(`${API_BASE_URL}/skills`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        ...form.getHeaders()
      },
      body: form
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✓ 测试成功: SKILL.md格式ZIP包上传成功');
      console.log('✓ 返回数据:', JSON.stringify(result, null, 2));
      
      if (result.data && result.data.status) {
        console.log(`✓ 资源状态: ${result.data.status}`);
      }
    } else {
      console.error('✗ 测试失败:', result);
    }
  } catch (error) {
    console.error('✗ 测试失败:', error.message);
  }
}

testSkillMdUpload();
