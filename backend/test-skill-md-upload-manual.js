const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3002/api/agent';
const API_KEY = 'test-api-key-12345';

async function testSkillMdUpload() {
  console.log('开始测试SKILL.md格式ZIP包上传...\n');

  const zipFilePath = path.join(__dirname, 'test-skill-md.zip');
  if (!fs.existsSync(zipFilePath)) {
    console.error('✗ 测试ZIP包不存在，请先运行 test-skill-md-zip.js');
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(zipFilePath);
  console.log('✓ ZIP文件读取成功，大小:', fileBuffer.length, 'bytes');

  const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
  
  let body = '';
  
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="test-skill-md.zip"\r\n`;
  body += `Content-Type: application/zip\r\n\r\n`;
  body += fileBuffer.toString('binary');
  body += `\r\n`;
  
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="name"\r\n\r\n`;
  body += `test-skill-md\r\n`;
  
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="description"\r\n\r\n`;
  body += `Test skill with SKILL.md format\r\n`;
  
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="category"\r\n\r\n`;
  body += `testing\r\n`;
  
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="tags"\r\n\r\n`;
  body += `test,validation,demo\r\n`;
  
  body += `--${boundary}--\r\n`;

  try {
    const response = await fetch(`${API_BASE_URL}/skills`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: Buffer.from(body, 'binary')
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
