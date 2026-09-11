import { RateLimiter } from './RateLimiter';
import { RateLimitResult, RateLimitOptions } from './RateLimitOptions';
import { createLogger } from '../../utils/logger';

const logger = createLogger('InMemoryRateLimiter');

interface WindowRequest {
  timestamp: number;
  count: number;
}

interface ClientWindow {
  requests: WindowRequest[];
  totalCount: number;
}

export class InMemoryRateLimiter extends RateLimiter {
  name = 'InMemoryRateLimiter';
  private storage: Map<string, ClientWindow> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private maxStorageSize: number = 100000) {
    super();
    this.startCleanup();
  }

  isAvailable(): boolean {
    return true;
  }

  private cleanOldWindows(key: string, windowSize: number): void {
    const client = this.storage.get(key);
    if (!client) return;

    const now = Date.now();
    const windowStart = now - windowSize;

    client.requests = client.requests.filter(req => req.timestamp > windowStart);

    let totalCount = 0;
    for (const req of client.requests) {
      totalCount += req.count;
    }
    client.totalCount = totalCount;

    if (client.requests.length === 0) {
      this.storage.delete(key);
    }
  }

  async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    this.cleanOldWindows(key, options.windowSize);

    const client = this.storage.get(key);
    if (!client) {
      return {
        allowed: true,
        limit: options.maxRequests,
        remaining: options.maxRequests - 1,
        resetAt: new Date(Date.now() + options.windowSize),
      };
    }

    const remaining = Math.max(0, options.maxRequests - client.totalCount);
    const oldestTimestamp = client.requests.length > 0
      ? Math.min(...client.requests.map(r => r.timestamp))
      : Date.now();
    const resetAt = new Date(oldestTimestamp + options.windowSize);

    return {
      allowed: client.totalCount < options.maxRequests,
      limit: options.maxRequests,
      remaining,
      resetAt,
      retryAfter: client.totalCount >= options.maxRequests
        ? Math.ceil((resetAt.getTime() - Date.now()) / 1000)
        : undefined,
    };
  }

  async increment(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    if (this.storage.size >= this.maxStorageSize) {
      this.evictOldest();
    }

    const now = Date.now();
    const client = this.storage.get(key);

    if (!client) {
      this.storage.set(key, {
        requests: [{ timestamp: now, count: 1 }],
        totalCount: 1,
      });

      return {
        allowed: true,
        limit: options.maxRequests,
        remaining: options.maxRequests - 1,
        resetAt: new Date(now + options.windowSize),
      };
    }

    const lastRequest = client.requests[client.requests.length - 1];
    if (lastRequest && now - lastRequest.timestamp < 1000) {
      lastRequest.count++;
    } else {
      client.requests.push({ timestamp: now, count: 1 });
    }

    client.totalCount++;
    this.cleanOldWindows(key, options.windowSize);

    const updatedClient = this.storage.get(key);
    const remaining = updatedClient
      ? Math.max(0, options.maxRequests - updatedClient.totalCount)
      : options.maxRequests - 1;

    return {
      allowed: (updatedClient?.totalCount || 1) <= options.maxRequests,
      limit: options.maxRequests,
      remaining,
      resetAt: new Date(now + options.windowSize),
      retryAfter: (updatedClient?.totalCount || 1) > options.maxRequests
        ? Math.ceil(options.windowSize / 1000)
        : undefined,
    };
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, client] of this.storage.entries()) {
      if (client.requests.length > 0) {
        const oldest = Math.min(...client.requests.map(r => r.timestamp));
        if (oldest < oldestTime) {
          oldestTime = oldest;
          oldestKey = key;
        }
      }
    }

    if (oldestKey) {
      this.storage.delete(oldestKey);
      logger.warn('Evicted oldest rate limit entry', { key: oldestKey });
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 3600000;

      for (const [key, client] of this.storage.entries()) {
        const validRequests = client.requests.filter(req => now - req.timestamp < maxAge);
        if (validRequests.length === 0) {
          this.storage.delete(key);
        }
      }
    }, 300000);
  }

  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.storage.clear();
  }

  getStorageSize(): number {
    return this.storage.size;
  }
}
