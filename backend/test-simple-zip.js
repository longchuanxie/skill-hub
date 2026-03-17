const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3002';
const API_KEY = '045c5f27fa20ba4630f64d005fc363e64eadd6bdd58c19340506cd662ec84d63';

async function createSimpleSkillZip(testDir, skillName) {
  const zipPath = path.join(testDir, `${skillName}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(zipPath));
    archive.on('error', reject);
    
    archive.pipe(output);
    
    const skillJson = {
      name: skillName,
      version: '1.0.0',
      description: '这是一个正常的测试技能',
      main: 'index.js'
    };
    
    archive.append(JSON.stringify(skillJson, null, 2), { name: 'skill.json' });
    
    const jsContent = `
const axios = require('axios');

async function execute(input) {
  console.log('Executing skill: ${skillName}');
  return { result: 'success', data: input };
}

module.exports = { execute };
`;
    
    archive.append(jsContent, { name: 'index.js' });
    
    archive.finalize();
  });
}

async function testSimpleZipUpload() {
  console.log('=== 简单ZIP包上传测试 ===\n');

  try {
    const testDir = path.join(__dirname, 'test-zips');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    console.log('1. 创建测试ZIP包');
    const zipPath = await createSimpleSkillZip(testDir, 'simple-skill');
    console.log('✓ ZIP包创建成功:', zipPath);
    console.log();

    console.log('2. 准备上传数据');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(zipPath));
    formData.append('name', '简单技能');
    formData.append('description', '这是一个简单的测试技能');
    formData.append('category', 'test');
    formData.append('tags', JSON.stringify(['test']));
    formData.append('version', '1.0.0');
    console.log('✓ 表单数据准备完成');
    console.log();

    console.log('3. 发送上传请求');
    try {
      const response = await axios.post(`${BASE_URL}/api/agent/skills`, formData, {
        headers: {
          'X-API-Key': API_KEY,
          ...formData.getHeaders()
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });
      console.log('✓ ZIP包上传成功');
      console.log('  - Status:', response.data.status);
      console.log('  - Message:', response.data.message);
      console.log('  - AutoReview:', JSON.stringify(response.data.autoReviewResult, null, 2));
    } catch (error) {
      console.log('✗ ZIP包上传失败');
      if (error.response) {
        console.log('  - Status:', error.response.status);
        console.log('  - Status Text:', error.response.statusText);
        console.log('  - Error:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.log('  - No response received');
        console.log('  - Error:', error.message);
      } else {
        console.log('  - Error:', error.message);
      }
    }
    console.log();

    console.log('=== 测试完成 ===');

  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testSimpleZipUpload();
