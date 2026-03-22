import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createLogger } from '../utils/logger';

const logger = createLogger('ZipAnalyzerService');

export class ZipAnalyzerError extends Error {
  constructor(
    message: string,
    public code: 'ZIP_NOT_FOUND' | 'INVALID_ZIP' | 'CORRUPTED_ZIP' | 'FILE_NOT_FOUND' | 'EXTRACTION_FAILED',
    public details?: any
  ) {
    super(message);
    this.name = 'ZipAnalyzerError';
  }
}

export interface ProgressCallback {
  (stage: 'reading' | 'extracting' | 'comparing' | 'complete', progress: number, message?: string): void;
}

export interface FileEntry {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  checksum?: string;
  content?: string;
}

export interface ZipManifest {
  version: string;
  totalFiles: number;
  totalSize: number;
  files: FileEntry[];
  checksum: string;
  createdAt: Date;
}

export interface DiffResult {
  added: FileEntry[];
  deleted: FileEntry[];
  modified: FileEntry[];
  unchanged: FileEntry[];
  summary: {
    addedCount: number;
    deletedCount: number;
    modifiedCount: number;
    unchangedCount: number;
  };
}

export class ZipAnalyzerService {
  private cache: Map<string, { manifest: ZipManifest; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000;

  async extractManifest(zipPath: string, forceRefresh = false): Promise<ZipManifest> {
    const cached = this.cache.get(zipPath);
    if (cached && !forceRefresh && Date.now() - cached.timestamp < this.CACHE_TTL) {
      logger.debug('Using cached manifest', { zipPath });
      return cached.manifest;
    }

    logger.debug('Extracting zip manifest', { zipPath });

    if (!fs.existsSync(zipPath)) {
      throw new Error(`Zip file not found: ${zipPath}`);
    }

    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    const files: FileEntry[] = [];
    let totalSize = 0;

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const content = zip.readAsText(entry);
      const checksum = crypto.createHash('md5').update(content).digest('hex');

      files.push({
        path: entry.entryName,
        name: path.basename(entry.entryName),
        size: entry.header.size,
        isDirectory: entry.isDirectory,
        checksum,
      });
      totalSize += entry.header.size;
    }

    const manifest: ZipManifest = {
      version: '1.0',
      totalFiles: files.length,
      totalSize,
      files,
      checksum: crypto.createHash('md5').update(JSON.stringify(files)).digest('hex'),
      createdAt: new Date(),
    };

    this.cache.set(zipPath, { manifest, timestamp: Date.now() });
    return manifest;
  }

  async compareZips(oldZipPath: string, newZipPath: string): Promise<DiffResult> {
    const [oldManifest, newManifest] = await Promise.all([
      this.extractManifest(oldZipPath),
      this.extractManifest(newZipPath),
    ]);

    return this.compareManifests(oldManifest, newManifest);
  }

  compareManifests(oldManifest: ZipManifest, newManifest: ZipManifest): DiffResult {
    const oldFiles = new Map(oldManifest.files.map(f => [f.path, f]));
    const newFiles = new Map(newManifest.files.map(f => [f.path, f]));

    const result: DiffResult = {
      added: [],
      deleted: [],
      modified: [],
      unchanged: [],
      summary: { addedCount: 0, deletedCount: 0, modifiedCount: 0, unchangedCount: 0 },
    };

    for (const [filePath, oldFile] of oldFiles) {
      if (!newFiles.has(filePath)) {
        result.deleted.push(oldFile);
        result.summary.deletedCount++;
      } else {
        const newFile = newFiles.get(filePath)!;
        if (oldFile.checksum !== newFile.checksum) {
          result.modified.push({ ...newFile, checksum: newFile.checksum });
          result.summary.modifiedCount++;
        } else {
          result.unchanged.push(newFile);
          result.summary.unchangedCount++;
        }
      }
    }

    for (const [filePath, newFile] of newFiles) {
      if (!oldFiles.has(filePath)) {
        result.added.push(newFile);
        result.summary.addedCount++;
      }
    }

    return result;
  }

  async extractFileContent(zipPath: string, filePath: string): Promise<string | null> {
    try {
      const zip = new AdmZip(zipPath);
      const entry = zip.getEntry(filePath);
      if (!entry) return null;
      return zip.readAsText(entry);
    } catch (error) {
      logger.error('Failed to extract file content', { zipPath, filePath, error });
      return null;
    }
  }

  async extractFiles(zipPath: string, filePaths: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    await Promise.all(
      filePaths.map(async (fp) => {
        const content = await this.extractFileContent(zipPath, fp);
        if (content !== null) {
          results.set(fp, content);
        }
      })
    );
    return results;
  }

  clearCache(zipPath?: string): void {
    if (zipPath) {
      this.cache.delete(zipPath);
    } else {
      this.cache.clear();
    }
  }

  async safeExtractManifest(
    zipPath: string,
    onProgress?: ProgressCallback
  ): Promise<ZipManifest> {
    if (!fs.existsSync(zipPath)) {
      throw new ZipAnalyzerError('Zip file not found', 'ZIP_NOT_FOUND', { zipPath });
    }

    onProgress?.('reading', 10, 'Reading zip file...');

    try {
      const zip = new AdmZip(zipPath);
      onProgress?.('reading', 30, 'Parsing entries...');

      const entries = zip.getEntries();
      const totalEntries = entries.length;
      const files: FileEntry[] = [];
      let processed = 0;

      for (const entry of entries) {
        if (entry.isDirectory) continue;

        const content = zip.readAsText(entry);
        const checksum = crypto.createHash('md5').update(content).digest('hex');

        files.push({
          path: entry.entryName,
          name: path.basename(entry.entryName),
          size: entry.header.size,
          isDirectory: entry.isDirectory,
          checksum,
        });

        processed++;
        if (processed % 50 === 0) {
          onProgress?.('extracting', 30 + (processed / totalEntries) * 40, `Processing ${processed}/${totalEntries}...`);
        }
      }

      onProgress?.('extracting', 70, 'Computing checksums...');

      const manifest: ZipManifest = {
        version: '1.0',
        totalFiles: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        files,
        checksum: crypto.createHash('md5').update(JSON.stringify(files)).digest('hex'),
        createdAt: new Date(),
      };

      onProgress?.('complete', 100, 'Done');
      return manifest;
    } catch (error: any) {
      if (error instanceof ZipAnalyzerError) throw error;
      throw new ZipAnalyzerError(
        'Failed to extract zip manifest',
        'EXTRACTION_FAILED',
        { zipPath, error: error.message }
      );
    }
  }
}

export const zipAnalyzerService = new ZipAnalyzerService();
