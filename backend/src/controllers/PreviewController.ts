import { Response } from 'express';
import { Skill } from '../models/Skill';
import { SkillVersion } from '../models/SkillVersion';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import unzipper from 'unzipper';
import { cache } from '../utils/cache';
import crypto from 'crypto';

interface FileTreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  mimeType?: string;
  isBinary?: boolean;
  children?: FileTreeNode[];
}

export const getSkillFileTree = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: skillId } = req.params;

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    const hasAccess = 
      skill.visibility === 'public' || 
      String(skill.owner) === req.user?.userId;

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const latestVersion = await SkillVersion.findOne({ skillId: skill._id }).sort({ createdAt: -1 });
    if (!latestVersion || !latestVersion.url) {
      res.status(400).json({ error: 'No file available' });
      return;
    }

    const zipPath = path.join(process.cwd(), latestVersion.url);
    if (!fs.existsSync(zipPath)) {
      res.status(400).json({ error: 'File not found' });
      return;
    }

    // Check file tree cache first
    const fileTreeCacheKey = generateCacheKey(zipPath, 'filetree');
    const cachedFileTree = cache.get(fileTreeCacheKey);
    
    if (cachedFileTree && cachedFileTree.data) {
      res.json({ fileTree: cachedFileTree.data });
      return;
    }

    // Extract ZIP file or use cached version
    const extractedDir = await getOrExtractZip(zipPath);

    try {
      const fileTree = buildFileTree(extractedDir);
      
      // Cache the file tree
      cache.set(fileTreeCacheKey, { 
        filePath: '', 
        data: fileTree 
      });

      res.json({ fileTree });
    } finally {
      // Don't clean up extracted dir because it's in cache
    }
  } catch (error) {
    console.error('Get skill file tree error:', error);
    res.status(500).json({ error: 'Failed to get file tree' });
  }
};

export const previewSkillFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const skillId = req.params.id;
    const filePath = req.query.path as string || '';

    if (!skillId) {
      res.status(400).json({ error: 'Skill ID is required' });
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    const hasAccess = 
      skill.visibility === 'public' || 
      String(skill.owner) === req.user?.userId;

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const latestVersion = await SkillVersion.findOne({ skillId: skill._id }).sort({ createdAt: -1 });
    if (!latestVersion || !latestVersion.url) {
      res.status(400).json({ error: 'No file available' });
      return;
    }

    const zipPath = path.join(process.cwd(), latestVersion.url);
    if (!fs.existsSync(zipPath)) {
      res.status(400).json({ error: 'File not found' });
      return;
    }

    // Extract ZIP file or use cached version
    const extractedDir = await getOrExtractZip(zipPath);

    try {
      const fullPath = path.join(extractedDir, filePath);
      if (!fs.existsSync(fullPath)) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const stats = fs.statSync(fullPath);
      const mimeType = getMimeType(filePath);
      const isBinary = isBinaryFile(filePath);

      let content: string;
      if (isBinary) {
        content = '';
      } else {
        // Stream file content for large files
        const MAX_INLINE_SIZE = 10 * 1024 * 1024; // 10MB
        if (stats.size > MAX_INLINE_SIZE) {
          content = '[File too large to display inline]';
        } else {
          content = fs.readFileSync(fullPath, 'utf8');
        }
      }

      res.json({
        content,
        size: stats.size,
        mimeType,
        isBinary,
      });
    } finally {
      // Don't clean up extracted dir because it's in cache
    }
  } catch (error) {
    console.error('Preview skill file error:', error);
    res.status(500).json({ error: 'Failed to preview file' });
  }
};

const MAX_DEPTH = 20; // 最大文件树深度
const MAX_FILES_PER_DIR = 1000; // 单个目录最大文件数

function buildFileTree(dirPath: string, basePath: string = '', depth: number = 0): FileTreeNode[] {
  if (depth > MAX_DEPTH) {
    return [];
  }

  const items = fs.readdirSync(dirPath);
  const tree: FileTreeNode[] = [];
  
  // 限制处理文件数量，防止超大目录导致性能问题
  const limitedItems = items.slice(0, MAX_FILES_PER_DIR);

  for (const item of limitedItems) {
    const fullPath = path.join(dirPath, item);
    const stats = fs.statSync(fullPath);
    const relativePath = basePath ? path.join(basePath, item) : item;

    if (stats.isDirectory()) {
      tree.push({
        name: item,
        type: 'directory',
        path: relativePath,
        children: buildFileTree(fullPath, relativePath, depth + 1),
      });
    } else {
      tree.push({
        name: item,
        type: 'file',
        path: relativePath,
        size: stats.size,
        mimeType: getMimeType(item),
        isBinary: isBinaryFile(item),
      });
    }
  }

  return tree.sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.css': 'text/css',
    '.txt': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.py': 'text/x-python',
    '.java': 'text/x-java-source',
    '.go': 'text/x-go',
    '.rs': 'text/x-rust',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.zip', '.exe', '.dll', '.bin'];
  return binaryExtensions.includes(ext);
}

/**
 * Generate cache key for ZIP file based on file path and modification time
 */
function generateCacheKey(zipPath: string, prefix: string = ''): string {
  const stats = fs.statSync(zipPath);
  const keyData = `${prefix}-${zipPath}-${stats.mtime.getTime()}`;
  return crypto.createHash('md5').update(keyData).digest('hex');
}

/**
 * Extract ZIP file to cache or use cached version
 */
async function getOrExtractZip(zipPath: string): Promise<string> {
  const cacheKey = generateCacheKey(zipPath, 'zip');
  const cached = cache.get(cacheKey);
  
  if (cached && fs.existsSync(cached.filePath)) {
    return cached.filePath;
  }
  
  const tempDir = path.join(process.cwd(), 'temp', 'extracted', cacheKey);
  fs.mkdirSync(tempDir, { recursive: true });
  
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: tempDir }))
      .on('close', resolve)
      .on('error', reject);
  });
  
  cache.set(cacheKey, { filePath: tempDir });
  
  return tempDir;
}
