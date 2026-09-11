import fs from 'fs';
import path from 'path';

interface CacheEntry {
  timestamp: number;
  filePath: string;
  data?: any;
}

const CACHE_DIR = path.join(process.cwd(), 'temp', 'cache');
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export const cache = {
  /**
   * Get a cached entry by key
   */
  get(key: string): CacheEntry | null {
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    
    if (!fs.existsSync(cachePath)) {
      return null;
    }
    
    try {
      const content = fs.readFileSync(cachePath, 'utf8');
      const entry: CacheEntry = JSON.parse(content);
      
      // Check if entry has expired
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        fs.unlinkSync(cachePath);
        return null;
      }
      
      return entry;
    } catch {
      return null;
    }
  },
  
  /**
   * Set a cached entry by key
   */
  set(key: string, entry: Omit<CacheEntry, 'timestamp'>): void {
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    const cacheEntry: CacheEntry = {
      ...entry,
      timestamp: Date.now(),
    };
    
    fs.writeFileSync(cachePath, JSON.stringify(cacheEntry), 'utf8');
  },
  
  /**
   * Check if a cached entry exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  },
  
  /**
   * Delete a cached entry by key
   */
  delete(key: string): void {
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  },
  
  /**
   * Clear all expired cache entries
   */
  clearExpired(): void {
    if (!fs.existsSync(CACHE_DIR)) {
      return;
    }
    
    const files = fs.readdirSync(CACHE_DIR);
    const now = Date.now();
    
    for (const file of files) {
      const cachePath = path.join(CACHE_DIR, file);
      
      try {
        const content = fs.readFileSync(cachePath, 'utf8');
        const entry: CacheEntry = JSON.parse(content);
        
        if (now - entry.timestamp > CACHE_TTL) {
          fs.unlinkSync(cachePath);
        }
      } catch {
        // Delete invalid cache files
        fs.unlinkSync(cachePath);
      }
    }
  },
};
