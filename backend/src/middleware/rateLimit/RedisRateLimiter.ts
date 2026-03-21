import Redis from 'ioredis';
import { RateLimiter } from './RateLimiter';
import { RateLimitResult, RateLimitOptions } from './RateLimitOptions';
import { createLogger } from '../../utils/logger';

const logger = createLogger('RedisRateLimiter');

export class RedisRateLimiter extends RateLimiter {
  name = 'RedisRateLimiter';
  private redis: Redis | null = null;
  private isConnected: boolean = false;

  constructor(private redisUrl?: string) {
    super();
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    if (!this.redisUrl) {
      this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    }

    try {
      this.redis = new Redis(this.redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => {
          if (times > 1) {
            return null;
          }
          return Math.min(times * 100, 1000);
        },
        connectTimeout: 5000,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis rate limiter connected');
      });

      this.redis.on('error', (err: Error) => {
        this.isConnected = false;
        logger.warn('Redis rate limiter error', { error: err.message });
      });

      this.redis.on('close', () => {
        this.isConnected = false;
      });
    } catch (error) {
      logger.warn('Failed to initialize Redis rate limiter', {
        error: error instanceof Error ? error.message : String(error)
      });
      this.isConnected = false;
    }
  }

  isAvailable(): boolean {
    return this.isConnected && this.redis !== null;
  }

  async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    if (!this.isAvailable() || !this.redis) {
      throw new Error('Redis is not available');
    }

    const now = Date.now();
    const windowStart = now - options.windowSize;
    const redisKey = `sliding:${key}`;

    const luaScript = `
      local key = KEYS[1]
      local windowStart = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])

      redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

      local currentCount = redis.call('ZCARD', key)
      local remaining = math.max(0, maxRequests - currentCount)

      if currentCount < maxRequests then
        return {1, remaining, maxRequests}
      else
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local resetAt = oldest[2] and (tonumber(oldest[2]) + ${options.windowSize}) or (now + ${options.windowSize})
        local retryAfter = math.ceil((resetAt - now) / 1000)
        return {0, 0, maxRequests, retryAfter}
      end
    `;

    try {
      const result = await this.redis.eval(
        luaScript,
        1,
        redisKey,
        windowStart.toString(),
        now.toString(),
        options.maxRequests.toString()
      ) as number[];

      const [allowed, remaining, limit, retryAfter] = result;

      return {
        allowed: allowed === 1,
        limit,
        remaining,
        resetAt: new Date(now + options.windowSize),
        retryAfter: retryAfter || undefined,
      };
    } catch (error) {
      logger.error('Redis rate limit check failed', {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
      throw error;
    }
  }

  async increment(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    if (!this.isAvailable() || !this.redis) {
      throw new Error('Redis is not available');
    }

    const now = Date.now();
    const windowStart = now - options.windowSize;
    const redisKey = `sliding:${key}`;
    const oneWeekFromNow = now + 604800000;

    const luaScript = `
      local key = KEYS[1]
      local windowStart = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])
      local expiry = tonumber(ARGV[4])

      redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

      local currentCount = redis.call('ZCARD', key)

      if currentCount < maxRequests then
        redis.call('ZADD', key, now, now .. ':' .. math.random(1000000))
        redis.call('EXPIRE', key, math.ceil(expiry / 1000))
        currentCount = currentCount + 1
      end

      local remaining = math.max(0, maxRequests - currentCount)
      local allowed = currentCount <= maxRequests and 1 or 0
      local retryAfter = 0

      if allowed == 0 then
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        if oldest[2] then
          retryAfter = math.ceil((tonumber(oldest[2]) + ${options.windowSize} - now) / 1000)
        else
          retryAfter = math.ceil(${options.windowSize} / 1000)
        end
      end

      return {allowed, remaining, maxRequests, retryAfter}
    `;

    try {
      const result = await this.redis.eval(
        luaScript,
        1,
        redisKey,
        windowStart.toString(),
        now.toString(),
        options.maxRequests.toString(),
        oneWeekFromNow.toString()
      ) as number[];

      const [allowed, remaining, limit, retryAfter] = result;

      return {
        allowed: allowed === 1,
        limit,
        remaining,
        resetAt: new Date(now + options.windowSize),
        retryAfter: retryAfter > 0 ? retryAfter : undefined,
      };
    } catch (error) {
      logger.error('Redis rate limit increment failed', {
        error: error instanceof Error ? error.message : String(error),
        key,
      });
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
    }
  }
}
