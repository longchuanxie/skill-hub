import fs from 'fs';
import path from 'path';
import { ZipAnalyzerService, ZipAnalyzerError, FileEntry, ZipManifest } from '../services/ZipAnalyzerService';
import { createTestSkillZip, createTestZipFile } from './helpers/testZip';

describe('ZipAnalyzerService', () => {
  const zipAnalyzerService = new ZipAnalyzerService();
  const testZipDir = path.join(process.cwd(), 'uploads', 'test');

  beforeAll(async () => {
    if (!fs.existsSync(testZipDir)) {
      fs.mkdirSync(testZipDir, { recursive: true });
    }
  });

  afterEach(() => {
    zipAnalyzerService.clearCache();
  });

  describe('extractManifest', () => {
    it('should extract manifest from a valid zip file', async () => {
      const zipPath = path.join(testZipDir, 'test-valid.zip');
      await createTestSkillZip(zipPath);

      const manifest = await zipAnalyzerService.extractManifest(zipPath);

      expect(manifest).toBeDefined();
      expect(manifest.version).toBe('1.0');
      expect(manifest.totalFiles).toBeGreaterThan(0);
      expect(manifest.files.length).toBe(manifest.totalFiles);
      expect(manifest.checksum).toBeDefined();
    });

    it('should include file path, name, size and checksum for each file', async () => {
      const zipPath = path.join(testZipDir, 'test-manifest.zip');
      await createTestZipFile(zipPath, {
        'test.js': 'const x = 1;',
        'readme.txt': 'Hello World',
      });

      const manifest = await zipAnalyzerService.extractManifest(zipPath);

      const testJsFile = manifest.files.find(f => f.path === 'test.js');
      expect(testJsFile).toBeDefined();
      expect(testJsFile?.name).toBe('test.js');
      expect(testJsFile?.size).toBeGreaterThan(0);
      expect(testJsFile?.checksum).toBeDefined();
    });

    it('should throw error for non-existent zip file', async () => {
      const nonExistentPath = path.join(testZipDir, 'non-existent.zip');

      await expect(zipAnalyzerService.extractManifest(nonExistentPath))
        .rejects.toThrow();
    });

    it('should cache manifest and return cached version on subsequent calls', async () => {
      const zipPath = path.join(testZipDir, 'test-cache.zip');
      await createTestSkillZip(zipPath);

      const manifest1 = await zipAnalyzerService.extractManifest(zipPath);
      const manifest2 = await zipAnalyzerService.extractManifest(zipPath);

      expect(manifest1).toEqual(manifest2);
    });

    it('should refresh cache when forceRefresh is true', async () => {
      const zipPath = path.join(testZipDir, 'test-force-refresh.zip');
      await createTestSkillZip(zipPath);

      const manifest1 = await zipAnalyzerService.extractManifest(zipPath);
      const manifest2 = await zipAnalyzerService.extractManifest(zipPath, true);

      expect(manifest1.totalFiles).toEqual(manifest2.totalFiles);
      expect(manifest1.files).toEqual(manifest2.files);
    });
  });

  describe('compareManifests', () => {
    it('should identify added files', () => {
      const oldManifest: ZipManifest = {
        version: '1.0',
        totalFiles: 1,
        totalSize: 100,
        files: [
          { path: 'file1.txt', name: 'file1.txt', size: 100, isDirectory: false, checksum: 'abc' }
        ],
        checksum: 'old',
        createdAt: new Date(),
      };

      const newManifest: ZipManifest = {
        version: '1.0',
        totalFiles: 2,
        totalSize: 200,
        files: [
          { path: 'file1.txt', name: 'file1.txt', size: 100, isDirectory: false, checksum: 'abc' },
          { path: 'file2.txt', name: 'file2.txt', size: 100, isDirectory: false, checksum: 'def' }
        ],
        checksum: 'new',
        createdAt: new Date(),
      };

      const result = zipAnalyzerService.compareManifests(oldManifest, newManifest);

      expect(result.summary.addedCount).toBe(1);
      expect(result.added[0].path).toBe('file2.txt');
    });

    it('should identify deleted files', () => {
      const oldManifest: ZipManifest = {
        version: '1.0',
        totalFiles: 2,
        totalSize: 200,
        files: [
          { path: 'file1.txt', name: 'file1.txt', size: 100, isDirectory: false, checksum: 'abc' },
          { path: 'file2.txt', name: 'file2.txt', size: 100, isDirectory: false, checksum: 'def' }
        ],
        checksum: 'old',
        createdAt: new Date(),
      };

      const newManifest: ZipManifest = {
        version: '1.0',
        totalFiles: 1,
        totalSize: 100,
        files: [
          { path: 'file1.txt', name: 'file1.txt', size: 100, isDirectory: false, checksum: 'abc' }
        ],
        checksum: 'new',
        createdAt: new Date(),
      };

      const result = zipAnalyzerService.compareManifests(oldManifest, newManifest);

      expect(result.summary.deletedCount).toBe(1);
      expect(result.deleted[0].path).toBe('file2.txt');
    });

    it('should identify modified files by checksum', () => {
      const oldManifest: ZipManifest = {
        version: '1.0',
        totalFiles: 1,
        totalSize: 100,
        files: [
          { path: 'file1.txt', name: 'file1.txt', size: 100, isDirectory: false, checksum: 'abc' }
        ],
        checksum: 'old',
        createdAt: new Date(),
      };

      const newManifest: ZipManifest = {
        version: '1.0',
        totalFiles: 1,
        totalSize: 100,
        files: [
          { path: 'file1.txt', name: 'file1.txt', size: 100, isDirectory: false, checksum: 'xyz' }
        ],
        checksum: 'new',
        createdAt: new Date(),
      };

      const result = zipAnalyzerService.compareManifests(oldManifest, newManifest);

      expect(result.summary.modifiedCount).toBe(1);
      expect(result.modified[0].path).toBe('file1.txt');
    });

    it('should identify unchanged files', () => {
      const oldManifest: ZipManifest = {
        version: '1.0',
        totalFiles: 1,
        totalSize: 100,
        files: [
          { path: 'file1.txt', name: 'file1.txt', size: 100, isDirectory: false, checksum: 'abc' }
        ],
        checksum: 'old',
        createdAt: new Date(),
      };

      const newManifest: ZipManifest = {
        version: '1.0',
        totalFiles: 1,
        totalSize: 100,
        files: [
          { path: 'file1.txt', name: 'file1.txt', size: 100, isDirectory: false, checksum: 'abc' }
        ],
        checksum: 'new',
        createdAt: new Date(),
      };

      const result = zipAnalyzerService.compareManifests(oldManifest, newManifest);

      expect(result.summary.unchangedCount).toBe(1);
      expect(result.unchanged[0].path).toBe('file1.txt');
    });

    it('should handle complex comparison with multiple changes', () => {
      const oldManifest: ZipManifest = {
        version: '1.0',
        totalFiles: 3,
        totalSize: 300,
        files: [
          { path: 'file1.txt', name: 'file1.txt', size: 100, isDirectory: false, checksum: 'abc' },
          { path: 'file2.txt', name: 'file2.txt', size: 100, isDirectory: false, checksum: 'def' },
          { path: 'file3.txt', name: 'file3.txt', size: 100, isDirectory: false, checksum: 'ghi' }
        ],
        checksum: 'old',
        createdAt: new Date(),
      };

      const newManifest: ZipManifest = {
        version: '1.0',
        totalFiles: 3,
        totalSize: 300,
        files: [
          { path: 'file1.txt', name: 'file1.txt', size: 100, isDirectory: false, checksum: 'abc' },
          { path: 'file2.txt', name: 'file2.txt', size: 100, isDirectory: false, checksum: 'xyz' },
          { path: 'file4.txt', name: 'file4.txt', size: 100, isDirectory: false, checksum: 'new' }
        ],
        checksum: 'new',
        createdAt: new Date(),
      };

      const result = zipAnalyzerService.compareManifests(oldManifest, newManifest);

      expect(result.summary.unchangedCount).toBe(1);
      expect(result.summary.modifiedCount).toBe(1);
      expect(result.summary.deletedCount).toBe(1);
      expect(result.summary.addedCount).toBe(1);
    });
  });

  describe('extractFileContent', () => {
    it('should extract file content from zip', async () => {
      const zipPath = path.join(testZipDir, 'test-extract.zip');
      await createTestZipFile(zipPath, {
        'test.js': 'const x = 1;',
      });

      const content = await zipAnalyzerService.extractFileContent(zipPath, 'test.js');

      expect(content).toBe('const x = 1;');
    });

    it('should return null for non-existent file', async () => {
      const zipPath = path.join(testZipDir, 'test-missing.zip');
      await createTestZipFile(zipPath, {
        'test.js': 'const x = 1;',
      });

      const content = await zipAnalyzerService.extractFileContent(zipPath, 'non-existent.txt');

      expect(content).toBeNull();
    });
  });

  describe('extractFiles', () => {
    it('should extract multiple files from zip', async () => {
      const zipPath = path.join(testZipDir, 'test-multi-extract.zip');
      await createTestZipFile(zipPath, {
        'file1.txt': 'Content 1',
        'file2.txt': 'Content 2',
        'file3.txt': 'Content 3',
      });

      const results = await zipAnalyzerService.extractFiles(zipPath, ['file1.txt', 'file2.txt']);

      expect(results.size).toBe(2);
      expect(results.get('file1.txt')).toBe('Content 1');
      expect(results.get('file2.txt')).toBe('Content 2');
    });
  });

  describe('compareZips', () => {
    it('should compare two zip files and return diff result', async () => {
      const oldZipPath = path.join(testZipDir, 'test-old.zip');
      const newZipPath = path.join(testZipDir, 'test-new.zip');

      await createTestZipFile(oldZipPath, {
        'file1.txt': 'Old content',
        'file2.txt': 'Shared content',
      });

      await createTestZipFile(newZipPath, {
        'file1.txt': 'New content',
        'file2.txt': 'Shared content',
        'file3.txt': 'New file',
      });

      const result = await zipAnalyzerService.compareZips(oldZipPath, newZipPath);

      expect(result.summary.addedCount).toBe(1);
      expect(result.summary.modifiedCount).toBe(1);
      expect(result.summary.deletedCount).toBe(0);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached manifests', async () => {
      const zipPath = path.join(testZipDir, 'test-clear-cache.zip');
      await createTestSkillZip(zipPath);

      await zipAnalyzerService.extractManifest(zipPath);
      expect((zipAnalyzerService as any).cache.size).toBeGreaterThan(0);

      zipAnalyzerService.clearCache();

      expect((zipAnalyzerService as any).cache.size).toBe(0);
    });

    it('should clear specific cached manifest', async () => {
      const zipPath = path.join(testZipDir, 'test-clear-specific.zip');
      await createTestSkillZip(zipPath);

      await zipAnalyzerService.extractManifest(zipPath);
      expect((zipAnalyzerService as any).cache.has(zipPath)).toBe(true);

      zipAnalyzerService.clearCache(zipPath);

      expect((zipAnalyzerService as any).cache.has(zipPath)).toBe(false);
    });
  });

  describe('safeExtractManifest', () => {
    it('should call progress callback during extraction', async () => {
      const zipPath = path.join(testZipDir, 'test-progress.zip');
      await createTestSkillZip(zipPath);

      const progressStages: { stage: string; progress: number }[] = [];
      const onProgress = (stage: string, progress: number) => {
        progressStages.push({ stage, progress });
      };

      await zipAnalyzerService.safeExtractManifest(zipPath, onProgress);

      expect(progressStages.length).toBeGreaterThan(0);
      expect(progressStages[0].stage).toBe('reading');
      expect(progressStages[progressStages.length - 1].stage).toBe('complete');
    });

    it('should throw ZipAnalyzerError for non-existent file', async () => {
      const nonExistentPath = path.join(testZipDir, 'non-existent.zip');

      await expect(zipAnalyzerService.safeExtractManifest(nonExistentPath))
        .rejects.toThrow(ZipAnalyzerError);
    });
  });
});
