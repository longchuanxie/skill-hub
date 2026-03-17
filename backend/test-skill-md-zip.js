const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 创建测试用的SKILL.md文件
const skillMdContent = `---
name: test-skill
description: This is a test skill for validation
version: 1.0.0
category: testing
tags: test, validation, demo
author: Test Author
license: MIT
compatibility: claude-3.5, claude-4.0
---

# Test Skill

This is a test skill description.

## Instructions

1. First instruction
2. Second instruction
3. Third instruction

## Notes

Additional notes about the skill.
`;

// 创建一个简单的脚本文件
const scriptContent = `console.log('Hello from test skill');`;

// 创建临时目录
const tempDir = path.join(__dirname, 'temp-test-skill');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 写入SKILL.md文件
fs.writeFileSync(path.join(tempDir, 'SKILL.md'), skillMdContent);

// 创建scripts目录并写入脚本
const scriptsDir = path.join(tempDir, 'scripts');
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}
fs.writeFileSync(path.join(scriptsDir, 'test.js'), scriptContent);

// 创建ZIP文件
const output = fs.createWriteStream(path.join(__dirname, 'test-skill-md.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`✓ 测试ZIP包创建成功: ${archive.pointer()} bytes`);
  console.log('✓ 文件路径: test-skill-md.zip');
  console.log('✓ 包含: SKILL.md (标准格式)');
  
  // 清理临时目录
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('✓ 临时目录已清理');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(tempDir, false);
archive.finalize();
