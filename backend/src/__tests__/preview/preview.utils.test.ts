import { cache } from '../../utils/cache';
import path from 'path';
import fs from 'fs';
import { createTestSkillZip } from '../helpers/testZip';

describe('Preview Utils', () => {
  describe('Cache', () => {
    const TEST_CACHE_KEY = 'test-cache-key';
    const TEST_CACHE_DATA = { test: 'data' };

    beforeEach(() => {
      // Clear cache before each test
      const cacheDir = path.join(process.cwd(), 'temp', 'cache');
      if (fs.existsSync(cacheDir)) {
        const files = fs.readdirSync(cacheDir);
        files.forEach(file => {
          fs.unlinkSync(path.join(cacheDir, file));
        });
      }
    });

    it('should set and get cache entry', async () => {
      cache.set(TEST_CACHE_KEY, { filePath: '', data: TEST_CACHE_DATA });
      
      const result = cache.get(TEST_CACHE_KEY);
      
      expect(result).not.toBeNull();
      expect(result?.data).toEqual(TEST_CACHE_DATA);
    });

    it('should check if cache entry exists', async () => {
      expect(cache.has(TEST_CACHE_KEY)).toBe(false);
      
      cache.set(TEST_CACHE_KEY, { filePath: '', data: TEST_CACHE_DATA });
      
      expect(cache.has(TEST_CACHE_KEY)).toBe(true);
    });

    it('should delete cache entry', async () => {
      cache.set(TEST_CACHE_KEY, { filePath: '', data: TEST_CACHE_DATA });
      expect(cache.has(TEST_CACHE_KEY)).toBe(true);
      
      cache.delete(TEST_CACHE_KEY);
      expect(cache.has(TEST_CACHE_KEY)).toBe(false);
    });

    it('should clear expired cache', async () => {
      cache.set(TEST_CACHE_KEY, { filePath: '', data: TEST_CACHE_DATA });
      expect(cache.has(TEST_CACHE_KEY)).toBe(true);
      
      cache.clearExpired();
      // Entry should still exist since it's not expired yet
      expect(cache.has(TEST_CACHE_KEY)).toBe(true);
    });
  });

  describe('File Helpers', () => {
    const TEST_ZIP_PATH = 'uploads/test-utils.zip';

    beforeAll(async () => {
      await createTestSkillZip(TEST_ZIP_PATH);
    });

    afterAll(() => {
      if (fs.existsSync(TEST_ZIP_PATH)) {
        fs.unlinkSync(TEST_ZIP_PATH);
      }
    });

    it('should create and access test ZIP file', async () => {
      expect(fs.existsSync(TEST_ZIP_PATH)).toBe(true);
      
      const stats = fs.statSync(TEST_ZIP_PATH);
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});
