import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { promisify } from 'util';
import { createLogger } from './logger';

const logger = createLogger('skillUploadValidator');

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
  topLevelDir?: string;
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

// 检查SKILL.md是否存在
async function checkSkillMdExists(skillDir: string): Promise<{ exists: boolean; fileName: string }> {
  const possibleNames = ['SKILL.md'];
  for (const fileName of possibleNames) {
    const filePath = path.join(skillDir, fileName);
    try {
      const stats = await stat(filePath);
      if (stats.isFile()) {
        return { exists: true, fileName };
      }
    } catch {
      continue;
    }
  }
  return { exists: false, fileName: '' };
}

// 读取并解析SKILL.md文件
async function readSkillMd(skillDir: string, fileName: string = 'SKILL.md'): Promise<{ manifest: SkillManifest; hasFrontmatter: boolean }> {
  const skillMdPath = path.join(skillDir, fileName);
  try {
    const content = fs.readFileSync(skillMdPath, 'utf8');

    let manifest: SkillManifest = {
      name: '',
      description: '',
    };

    let hasFrontmatter = false;

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)/s);
    if (frontmatterMatch) {
      hasFrontmatter = true;
      const frontmatter = frontmatterMatch[1];

      const lines = frontmatter.split('\n');
      for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();

          if (key === 'name') manifest.name = value;
          else if (key === 'description') manifest.description = value;
          else if (key === 'license') manifest.license = value;
        }
      }
    }

    return { manifest, hasFrontmatter };
  } catch {
    return {
      manifest: {
        name: '',
        description: '',
      },
      hasFrontmatter: false,
    };
  }
}



// 验证SKILL.md结构（简化版，不再要求严格的格式）
function validateSkillMd(manifest: SkillManifest): string[] {
  return [];
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
  
  // JavaScript/TypeScript的恶意模式
  const JS_MALICIOUS_PATTERNS = [
    'eval(', 'exec(', 'system(', '__import__',
    '<script>', 'javascript:', 'data:',
    'document.cookie', 'window.location',
    'process.env', 'require(',
    'child_process', 'execSync', 'spawn',
    'fs.unlink', 'fs.rmdir', 'fs.rm',
    'os.exec', 'popen'
  ];
  
  // Python的真正恶意模式（只检测eval、exec等危险的动态执行）
  const PYTHON_MALICIOUS_PATTERNS = [
    'eval(',
    'exec('
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
            } else if (ext === '.py') {
              // 对于Python文件，只检测真正危险的动态执行
              for (const pattern of PYTHON_MALICIOUS_PATTERNS) {
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
            } else {
              // 对于其他文本文件，使用常规检测
              for (const pattern of JS_MALICIOUS_PATTERNS) {
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
    logger.debug('Starting skill upload validation', { zipPath, tempDir });
    
    // 解压ZIP文件
    await extractZip(zipPath, tempDir);
    logger.debug('ZIP file extracted successfully', { tempDir });
    
    // 检查解压后的目录结构
    const files = await readdir(tempDir);
    if (files.length === 0) {
      logger.warn('Validation failed - ZIP file is empty', { tempDir });
      errors.push('ZIP file is empty');
      return { valid: false, errors, format: 'SKILL.md' };
    }
    
    // 获取顶级目录名（如果只有一个顶级目录）
    let topLevelDir: string | undefined;
    if (files.length === 1) {
      const firstItemPath = path.join(tempDir, files[0]);
      const firstItemStats = await stat(firstItemPath);
      if (firstItemStats.isDirectory()) {
        topLevelDir = files[0];
        logger.debug('Found single top-level directory', { topLevelDir });
      }
    }
    
    // 直接在根目录检查SKILL.md
    const skillDir = tempDir;
    
    // 检查SKILL.md文件是否存在于根目录
    const skillMdCheck = await checkSkillMdExists(skillDir);
    if (!skillMdCheck.exists) {
      logger.warn('Validation failed - SKILL.md not found in root directory', { tempDir, files: files.join(', ') });
      errors.push('SKILL.md file must be in the root directory of the ZIP file');
      return { valid: false, errors, format: 'SKILL.md' };
    }
    
    // 读取SKILL.md
    const { manifest: skillMdManifest, hasFrontmatter } = await readSkillMd(skillDir, skillMdCheck.fileName);

    // SKILL.md必须有frontmatter元数据
    if (!hasFrontmatter) {
      logger.warn('Validation failed - SKILL.md must contain YAML frontmatter metadata');
      errors.push('SKILL.md must contain YAML frontmatter metadata with "name" and "description" fields. Example:\n\n---\nname: your-skill-name\ndescription: Your skill description\nlicense: MIT\n---');
      return { valid: false, errors, format: 'SKILL.md' };
    }

    // 验证必填字段
    if (!skillMdManifest.name || !skillMdManifest.description) {
      logger.warn('Validation failed - missing required fields in frontmatter', { 
        hasName: !!skillMdManifest.name, 
        hasDescription: !!skillMdManifest.description 
      });
      const missingFields = [];
      if (!skillMdManifest.name) missingFields.push('name');
      if (!skillMdManifest.description) missingFields.push('description');
      errors.push(`SKILL.md frontmatter is missing required fields: ${missingFields.join(', ')}`);
      return { valid: false, errors, format: 'SKILL.md' };
    }

    const finalManifest = skillMdManifest;
    logger.debug('SKILL.md parsed successfully', { name: finalManifest.name, version: finalManifest.version });

    // 检查是否包含恶意文件
    const maliciousErrors = await checkForMaliciousFiles(skillDir);
    if (maliciousErrors.length > 0) {
      logger.warn('Malicious files detected', { count: maliciousErrors.length, errors: maliciousErrors });
    }
    errors.push(...maliciousErrors);
    
    // 检查文件内容中的恶意模式
    const contentMaliciousErrors = await checkFileContentForMaliciousPatterns(skillDir);
    if (contentMaliciousErrors.length > 0) {
      logger.warn('Malicious patterns detected in file content', { count: contentMaliciousErrors.length, errors: contentMaliciousErrors });
    }
    errors.push(...contentMaliciousErrors);
    
    // 检查文件大小限制
    const sizeErrors = await checkFileSizeLimits(skillDir);
    if (sizeErrors.length > 0) {
      logger.warn('File size limit violations', { count: sizeErrors.length, errors: sizeErrors });
    }
    errors.push(...sizeErrors);
    
    // 检查敏感信息泄露
    const sensitiveInfoErrors = await checkForSensitiveInfo(skillDir);
    if (sensitiveInfoErrors.length > 0) {
      logger.warn('Sensitive information detected', { count: sensitiveInfoErrors.length, errors: sensitiveInfoErrors });
    }
    errors.push(...sensitiveInfoErrors);
    
    if (errors.length === 0) {
      logger.info('Skill validation passed successfully', { name: finalManifest?.name || '', version: finalManifest?.version, topLevelDir });
      return { valid: true, errors: [], structure: finalManifest, format: 'SKILL.md', topLevelDir };
    } else {
      logger.warn('Skill validation failed', { totalErrors: errors.length, errors });
      return { valid: false, errors, format: 'SKILL.md' };
    }
  } catch (error) {
    logger.error('Skill validation error', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      zipPath,
      tempDir
    });
    return { valid: false, errors: [error instanceof Error ? error.message : 'Failed to validate skill upload'], format: 'SKILL.md' };
  }
}
