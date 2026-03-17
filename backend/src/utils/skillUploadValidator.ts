import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

export interface SkillManifest {
  name: string;
  description: string;
  version?: string;
  category?: string;
  tags?: string[];
  author?: string;
  license?: string;
  compatibility?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  structure?: SkillManifest;
  format?: 'SKILL.md';
}

// 检查目录是否存在
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

// 读取并解析SKILL.md文件
async function readSkillMd(skillDir: string): Promise<SkillManifest | null> {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  try {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/s);
    if (!frontmatterMatch) {
      return null;
    }
    
    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2];
    
    let manifest: SkillManifest = {
      name: '',
      description: '',
    };
    
    const lines = frontmatter.split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        
        if (key === 'name') manifest.name = value;
        else if (key === 'description') manifest.description = value;
        else if (key === 'version') manifest.version = value;
        else if (key === 'category') manifest.category = value;
        else if (key === 'tags') {
          manifest.tags = value.split(',').map(tag => tag.trim());
        }
        else if (key === 'author') manifest.author = value;
        else if (key === 'license') manifest.license = value;
        else if (key === 'compatibility') {
          manifest.compatibility = value.split(',').map(comp => comp.trim());
        }
      }
    }
    
    if (!manifest.name || !manifest.description) {
      return null;
    }
    
    return manifest;
  } catch {
    return null;
  }
}

// 验证SKILL.md结构
function validateSkillMd(manifest: SkillManifest): string[] {
  const errors: string[] = [];
  
  if (!manifest.name || typeof manifest.name !== 'string' || manifest.name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }
  
  if (!manifest.description || typeof manifest.description !== 'string' || manifest.description.trim() === '') {
    errors.push('description is required and must be a non-empty string');
  }
  
  if (manifest.description.length < 10) {
    errors.push('description must be at least 10 characters long');
  }
  
  if (manifest.description.length > 500) {
    errors.push('description must be less than 500 characters');
  }
  
  if (manifest.tags && !Array.isArray(manifest.tags)) {
    errors.push('tags must be an array if provided');
  }
  
  if (manifest.compatibility && !Array.isArray(manifest.compatibility)) {
    errors.push('compatibility must be an array if provided');
  }
  
  return errors;
}

// 检查是否包含恶意文件
async function checkForMaliciousFiles(skillDir: string): Promise<string[]> {
  const maliciousExtensions = ['.exe', '.bat', '.cmd', '.sh'];
  const errors: string[] = [];
  
  async function scanDirectory(dir: string): Promise<void> {
    const files = await readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        await scanDirectory(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (maliciousExtensions.includes(ext)) {
          errors.push(`Potentially malicious file detected: ${filePath}`);
        }
      }
    }
  }
  
  await scanDirectory(skillDir);
  return errors;
}

// 检查文件内容中的恶意模式
async function checkFileContentForMaliciousPatterns(skillDir: string): Promise<string[]> {
  const textFileExtensions = ['.json', '.js', '.mjs', '.ts', '.py', '.txt', '.md', '.html', '.css'];
  const errors: string[] = [];
  
  const MALICIOUS_PATTERNS = [
    'eval(', 'exec(', 'system(', '__import__',
    '<script>', 'javascript:', 'data:',
    'document.cookie', 'window.location',
    'process.env', 'require(',
    'child_process', 'execSync', 'spawn',
    'fs.unlink', 'fs.rmdir', 'fs.rm',
    'os.exec', 'subprocess', 'popen'
  ];
  
  const AI_JAILBREAK_PATTERNS = [
    'ignore all instructions', 'bypass restrictions', 'override safety',
    '忽略所有指令', '绕过限制', '越狱',
    'system prompt', 'system override', '角色扮演',
    'as admin', 'admin mode', 'root access'
  ];
  
  async function scanDirectory(dir: string): Promise<void> {
    const files = await readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        await scanDirectory(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (textFileExtensions.includes(ext)) {
          try {
            const content = await readFile(filePath, 'utf8');
            const contentLower = content.toLowerCase();
            
            // 对于JavaScript文件，使用更智能的检测
            if (['.js', '.mjs', '.ts'].includes(ext)) {
              // 检查真正的恶意代码模式
              const evalPattern = /eval\s*\(\s*['"`].*['"`]\s*\)/gi;
              if (evalPattern.test(content)) {
                errors.push(`File ${file} contains potentially malicious eval usage`);
              }
              
              // 检查child_process的恶意使用
              const dangerousExecPattern = /(child_process|execSync|spawn)\s*\(\s*['"`].*['"`]\s*\)/gi;
              if (dangerousExecPattern.test(content)) {
                errors.push(`File ${file} contains potentially dangerous command execution`);
              }
              
              // 检查文件系统操作的恶意使用
              const dangerousFsPattern = /(fs\.(unlink|rmdir|rm))\s*\(\s*['"`].*['"`]\s*\)/gi;
              if (dangerousFsPattern.test(content)) {
                errors.push(`File ${file} contains potentially dangerous file system operations`);
              }
              
              // 检查AI越狱模式
              for (const pattern of AI_JAILBREAK_PATTERNS) {
                if (contentLower.includes(pattern.toLowerCase())) {
                  errors.push(`File ${file} contains AI jailbreak pattern: ${pattern}`);
                }
              }
            } else {
              // 对于非JavaScript文件，使用常规检测
              for (const pattern of MALICIOUS_PATTERNS) {
                if (contentLower.includes(pattern.toLowerCase())) {
                  errors.push(`File ${file} contains potentially malicious pattern: ${pattern}`);
                }
              }
              
              // 检查AI越狱模式
              for (const pattern of AI_JAILBREAK_PATTERNS) {
                if (contentLower.includes(pattern.toLowerCase())) {
                  errors.push(`File ${file} contains AI jailbreak pattern: ${pattern}`);
                }
              }
            }
          } catch (error) {
            // 忽略无法读取的文件
          }
        }
      }
    }
  }
  
  await scanDirectory(skillDir);
  return errors;
}

// 检查文件大小限制
async function checkFileSizeLimits(skillDir: string): Promise<string[]> {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
  const errors: string[] = [];
  let totalSize = 0;
  
  async function scanDirectory(dir: string): Promise<void> {
    const files = await readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        await scanDirectory(filePath);
      } else {
        const fileSize = stats.size;
        totalSize += fileSize;
        
        if (fileSize > MAX_FILE_SIZE) {
          errors.push(`File ${file} exceeds size limit (${fileSize} > ${MAX_FILE_SIZE} bytes)`);
        }
      }
    }
  }
  
  await scanDirectory(skillDir);
  
  if (totalSize > MAX_TOTAL_SIZE) {
    errors.push(`Total package size exceeds limit (${totalSize} > ${MAX_TOTAL_SIZE} bytes)`);
  }
  
  return errors;
}

// 检查敏感信息泄露
async function checkForSensitiveInfo(skillDir: string): Promise<string[]> {
  const textFileExtensions = ['.json', '.js', '.mjs', '.ts', '.py', '.txt', '.md', '.env', '.config'];
  const errors: string[] = [];
  
  const SENSITIVE_PATTERNS = [
    /password\s*[:=]\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
    /secret\s*[:=]\s*['"][^'"]+['"]/gi,
    /token\s*[:=]\s*['"][^'"]+['"]/gi,
    /private[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
    /access[_-]?token\s*[:=]\s*['"][^'"]+['"]/gi,
    /refresh[_-]?token\s*[:=]\s*['"][^'"]+['"]/gi,
    /client[_-]?secret\s*[:=]\s*['"][^'"]+['"]/gi
  ];
  
  async function scanDirectory(dir: string): Promise<void> {
    const files = await readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        await scanDirectory(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (textFileExtensions.includes(ext)) {
          try {
            const content = await readFile(filePath, 'utf8');
            
            for (const pattern of SENSITIVE_PATTERNS) {
              const matches = content.match(pattern);
              if (matches && matches.length > 0) {
                errors.push(`File ${file} may contain sensitive information (matches pattern: ${pattern.source})`);
                break;
              }
            }
          } catch (error) {
            // 忽略无法读取的文件
          }
        }
      }
    }
  }
  
  await scanDirectory(skillDir);
  return errors;
}

// 解压ZIP文件
async function extractZip(zipPath: string, extractPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .on('close', resolve)
      .on('error', reject);
  });
}

// 验证Skill上传结构
export async function validateSkillUpload(zipPath: string, tempDir: string): Promise<ValidationResult> {
  const errors: string[] = [];
  
  try {
    // 解压ZIP文件
    await extractZip(zipPath, tempDir);
    
    // 检查解压后的目录结构
    const files = await readdir(tempDir);
    if (files.length === 0) {
      errors.push('ZIP file is empty');
      return { valid: false, errors, format: 'SKILL.md' };
    }
    
    // 找到Skill目录（假设ZIP包中只有一个目录）
    let skillDir = tempDir;
    if (files.length === 1) {
      const firstItem = path.join(tempDir, files[0]);
      const stats = await stat(firstItem);
      if (stats.isDirectory()) {
        skillDir = firstItem;
      }
    }
    
    // 检查SKILL.md文件
    const skillMd = await readSkillMd(skillDir);
    if (!skillMd) {
      errors.push('SKILL.md file not found');
      return { valid: false, errors, format: 'SKILL.md' };
    }
    
    // 验证SKILL.md结构
    const mdErrors = validateSkillMd(skillMd);
    errors.push(...mdErrors);
    
    // 检查是否包含恶意文件
    const maliciousErrors = await checkForMaliciousFiles(skillDir);
    errors.push(...maliciousErrors);
    
    // 检查文件内容中的恶意模式
    const contentMaliciousErrors = await checkFileContentForMaliciousPatterns(skillDir);
    errors.push(...contentMaliciousErrors);
    
    // 检查文件大小限制
    const sizeErrors = await checkFileSizeLimits(skillDir);
    errors.push(...sizeErrors);
    
    // 检查敏感信息泄露
    const sensitiveInfoErrors = await checkForSensitiveInfo(skillDir);
    errors.push(...sensitiveInfoErrors);
    
    if (errors.length === 0) {
      return { valid: true, errors: [], structure: skillMd, format: 'SKILL.md' };
    } else {
      return { valid: false, errors, format: 'SKILL.md' };
    }
  } catch (error) {
    return { valid: false, errors: [error instanceof Error ? error.message : 'Failed to validate skill upload'], format: 'SKILL.md' };
  }
}
