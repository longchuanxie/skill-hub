import { Response } from 'express';
import { Skill } from '../models/Skill';
import { SkillVersion } from '../models/SkillVersion';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import unzipper from 'unzipper';
import { cache } from '../utils/cache';
import { canReadResource } from '../utils/resourceAccess';
import crypto from 'crypto';
import { ErrorCode, createErrorResponse } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('PreviewController');

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
      res.status(404).json(createErrorResponse(ErrorCode.SKILL_NOT_FOUND));
      return;
    }

    const hasAccess = await canReadResource(skill, {
      userId: req.user?.userId,
      enterpriseId: req.user?.enterpriseId,
    });

    if (!hasAccess) {
      res.status(403).json(createErrorResponse(ErrorCode.ACCESS_DENIED));
      return;
    }

    const latestVersion = await SkillVersion.findOne({ skillId: skill._id }).sort({
      createdAt: -1,
    });
    if (!latestVersion || !latestVersion.url) {
      res.status(400).json(createErrorResponse(ErrorCode.NO_FILE_AVAILABLE));
      return;
    }

    const zipPath = path.join(process.cwd(), latestVersion.url);
    if (!fs.existsSync(zipPath)) {
      res.status(404).json(createErrorResponse(ErrorCode.FILE_NOT_FOUND));
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
        data: fileTree,
      });

      res.json({ fileTree });
    } finally {
      // Don't clean up extracted dir because it's in cache
    }
  } catch (error) {
    logger.error('Get skill file tree error:', error);
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
  }
};

export const previewSkillFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const skillId = req.params.id;
    const filePath = (req.query.path as string) || '';

    if (!skillId) {
      res.status(400).json(createErrorResponse(ErrorCode.MISSING_REQUIRED_FIELD));
      return;
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
      res.status(404).json(createErrorResponse(ErrorCode.SKILL_NOT_FOUND));
      return;
    }

    const hasAccess = await canReadResource(skill, {
      userId: req.user?.userId,
      enterpriseId: req.user?.enterpriseId,
    });

    if (!hasAccess) {
      res.status(403).json(createErrorResponse(ErrorCode.ACCESS_DENIED));
      return;
    }

    const latestVersion = await SkillVersion.findOne({ skillId: skill._id }).sort({
      createdAt: -1,
    });
    if (!latestVersion || !latestVersion.url) {
      res.status(400).json(createErrorResponse(ErrorCode.NO_FILE_AVAILABLE));
      return;
    }

    const zipPath = path.join(process.cwd(), latestVersion.url);
    if (!fs.existsSync(zipPath)) {
      res.status(404).json(createErrorResponse(ErrorCode.FILE_NOT_FOUND));
      return;
    }

    // Extract ZIP file or use cached version
    const extractedDir = await getOrExtractZip(zipPath);

    try {
      const fullPath = resolveWithinDir(extractedDir, filePath);
      if (!fullPath || !fs.existsSync(fullPath)) {
        res.status(404).json(createErrorResponse(ErrorCode.FILE_NOT_FOUND));
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
    logger.error('Preview skill file error:', error);
    res.status(500).json(createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR));
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

// Resolve a user-supplied relative path inside baseDir, rejecting traversal
// outside of it. Returns null when the path escapes baseDir.
function resolveWithinDir(baseDir: string, relativePath: string): string | null {
  const resolvedBase = path.resolve(baseDir);
  const resolved = path.resolve(resolvedBase, relativePath);
  if (resolved !== resolvedBase && !resolved.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return resolved;
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
  const binaryExtensions = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.pdf',
    '.zip',
    '.exe',
    '.dll',
    '.bin',
  ];
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
const EXTRACTED_DIR = path.join(process.cwd(), 'temp', 'extracted');
const EXTRACT_TTL_MS = 30 * 60 * 1000; // keep in sync with the cache TTL
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
let lastSweepAt = 0;

// Extracted archives used to live forever: cache entries expire after 30
// minutes but their directories were never removed. Sweep the extraction
// dir for anything older than the TTL (throttled to once per interval).
function sweepExtractedDirs(): void {
  const now = Date.now();
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;

  try {
    if (!fs.existsSync(EXTRACTED_DIR)) return;
    for (const entry of fs.readdirSync(EXTRACTED_DIR)) {
      const dir = path.join(EXTRACTED_DIR, entry);
      try {
        const stats = fs.statSync(dir);
        if (now - stats.mtimeMs > EXTRACT_TTL_MS) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      } catch {
        // unreadable entry - skip this sweep
      }
    }
  } catch {
    // sweeping must never break previewing
  }
}

async function getOrExtractZip(zipPath: string): Promise<string> {
  sweepExtractedDirs();

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
