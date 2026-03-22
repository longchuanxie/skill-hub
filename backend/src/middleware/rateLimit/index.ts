import { Response, Request, NextFunction } from 'express';
import { RateLimiter } from './RateLimiter';
import { InMemoryRateLimiter } from './InMemoryRateLimiter';
import { RedisRateLimiter } from './RedisRateLimiter';
import { RateLimitOptions, RateLimitResult, ApiType, RateLimitConfig } from './RateLimitOptions';
import { generateKey, getDefaultConfig } from './RateLimitContext';
import { createLogger } from '../../utils/logger';

const logger = createLogger('rateLimitMiddleware');

export class RateLimitManager {
  private inMemoryLimiter: InMemoryRateLimiter;
  private redisLimiter: RedisRateLimiter;
  private currentLimiter: RateLimiter;
  private config: RateLimitConfig;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.RATE_LIMIT_ENABLED !== 'false';
    this.config = getDefaultConfig();
    this.inMemoryLimiter = new InMemoryRateLimiter();
    this.redisLimiter = new RedisRateLimiter();
    this.currentLimiter = this.inMemoryLimiter;

    this.checkRedisAvailability();
  }

  private async checkRedisAvailability(): Promise<void> {
    if (this.redisLimiter.isAvailable()) {
      this.currentLimiter = this.redisLimiter;
      logger.info('Using Redis rate limiter');
    } else {
      logger.info('Using in-memory rate limiter');
    }
  }

  setLimiter(limiter: RateLimiter): void {
    this.currentLimiter = limiter;
  }

  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private getOptions(apiType: ApiType, customOptions?: Partial<RateLimitOptions>): RateLimitOptions {
    const defaultConfig = this.config[apiType];

    return {
      windowSize: customOptions?.windowSize || defaultConfig?.windowSize || 60000,
      maxRequests: customOptions?.maxRequests || defaultConfig?.maxRequests || 60,
      apiType,
      keyPrefix: customOptions?.keyPrefix,
      skipFailedRequests: customOptions?.skipFailedRequests || false,
    };
  }

  async checkLimit(
    req: Request,
    res: Response,
    next: NextFunction,
    apiType: ApiType,
    customOptions?: Partial<RateLimitOptions>
  ): Promise<void> {
    if (!this.enabled) {
      return next();
    }

    const options = this.getOptions(apiType, customOptions);
    const key = generateKey(req, apiType);

    try {
      const result = await this.currentLimiter.increment(key, options);

      this.setRateLimitHeaders(res, result);

      if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
          key,
          apiType,
          limit: result.limit,
          remaining: result.remaining,
          ip: req.ip,
          path: req.path,
        });

        res.status(429).json({
          error: 'TOO_MANY_REQUESTS',
          message: '请求过于频繁，请稍后再试',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter,
          limit: result.limit,
          remaining: result.remaining,
          resetAt: result.resetAt.toISOString(),
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error, allowing request', {
        error: error instanceof Error ? error.message : String(error),
        key,
        apiType,
      });

      next();
    }
  }

  private setRateLimitHeaders(res: Response, result: RateLimitResult): void {
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000).toString());

    if (result.retryAfter) {
      res.setHeader('Retry-After', result.retryAfter.toString());
    }
  }

  async close(): Promise<void> {
    await this.inMemoryLimiter.close();
    await this.redisLimiter.close();
  }
}

export const rateLimitManager = new RateLimitManager();

export function createRateLimitMiddleware(apiType: ApiType, customOptions?: Partial<RateLimitOptions>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await rateLimitManager.checkLimit(req, res, next, apiType, customOptions);
  };
}

export const publicApiLimiter = createRateLimitMiddleware(ApiType.PUBLIC);
export const externalApiLimiter = createRateLimitMiddleware(ApiType.EXTERNAL);
export const authApiLimiter = createRateLimitMiddleware(ApiType.AUTHENTICATED);
export const sensitiveApiLimiter = createRateLimitMiddleware(ApiType.SENSITIVE);

export function dynamicRateLimit(
  apiType: ApiType,
  optionsGetter?: (req: Request) => Partial<RateLimitOptions>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const options = optionsGetter ? optionsGetter(req) : undefined;
    await rateLimitManager.checkLimit(req, res, next, apiType, options);
  };
}
