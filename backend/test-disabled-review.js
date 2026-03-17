const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3002/api/agent';
const API_KEY = 'test-api-key-12345';

async function testDisabledReview() {
  console.log('开始测试禁用审核功能...\n');

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
  body += `Content-Disposition: form-data; name="file"; filename="test-skill-disabled-review.zip"\r\n`;
  body += `Content-Type: application/zip\r\n\r\n`;
  body += fileBuffer.toString('binary');
  body += `\r\n`;
  
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="name"\r\n\r\n`;
  body += `test-skill-disabled-review\r\n`;
  
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="description"\r\n\r\n`;
  body += `Test skill with review disabled\r\n`;
  
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="category"\r\n\r\n`;
  body += `testing\r\n`;
  
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="tags"\r\n\r\n`;
  body += `test,disabled-review\r\n`;
  
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
      console.log('✓ 测试成功: 禁用审核时资源上传成功');
      console.log('✓ 返回数据:', JSON.stringify(result, null, 2));
      
      if (result.status === 'approved') {
        console.log('✓ 资源状态: approved (审核已禁用，自动通过)');
      } else {
        console.log('✗ 资源状态:', result.status, '(预期为approved)');
      }
      
      if (result.autoReviewResult && result.autoReviewResult.warnings) {
        console.log('✓ 审核警告:', result.autoReviewResult.warnings);
        const hasDisabledWarning = result.autoReviewResult.warnings.some(w => 
          w.includes('内容审核已禁用') || w.includes('自动通过')
        );
        if (hasDisabledWarning) {
          console.log('✓ 检测到审核已禁用的警告信息');
        }
      }
    } else {
      console.error('✗ 测试失败:', result);
    }
  } catch (error) {
    console.error('✗ 测试失败:', error.message);
  }
}

testDisabledReview();
