import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

export async function createTestZipFile(zipPath: string, files: { [key: string]: string | Buffer }): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      const dirPath = path.dirname(fullPath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      if (typeof content === 'string') {
        archive.append(content, { name: filePath });
      } else {
        archive.append(content, { name: filePath });
      }
    }

    archive.finalize();
  });
}

export async function createTestSkillZip(zipPath: string): Promise<void> {
  const files = {
    'SKILL.md': `# Test Skill

This is a test skill for preview functionality.

## Features
- Feature 1
- Feature 2
`,
    'src/index.js': `// Main entry point
function hello() {
  console.log('Hello from test skill!');
  return 'Hello World';
}

module.exports = { hello };
`,
    'src/utils.js': `// Utility functions
function formatDate(date) {
  return date.toISOString();
}

module.exports = { formatDate };
`,
    'package.json': JSON.stringify({
      name: 'test-skill',
      version: '1.0.0',
      description: 'A test skill',
    }, null, 2),
    'README.md': `# Test Skill

This is a test skill for preview functionality.

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`javascript
const skill = require('./src/index.js');
skill.hello();
\`\`\`
`,
    'image.png': Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
  };

  await createTestZipFile(zipPath, files);
}
