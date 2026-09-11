import { RateLimitResult, RateLimitOptions } from './RateLimitOptions';

export abstract class RateLimiter {
  abstract name: string;

  abstract isAvailable(): boolean;

  abstract check(key: string, options: RateLimitOptions): Promise<RateLimitResult>;

  abstract increment(key: string, options: RateLimitOptions): Promise<RateLimitResult>;

  async close(): Promise<void> {}
}
