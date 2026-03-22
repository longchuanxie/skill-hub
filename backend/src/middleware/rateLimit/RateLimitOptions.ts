export enum ApiType {
  EXTERNAL = 'external',
  PUBLIC = 'public',
  AUTHENTICATED = 'auth',
  SENSITIVE = 'sensitive',
}

export enum RateLimitStrategy {
  IN_MEMORY = 'in_memory',
  REDIS = 'redis',
}

export interface RateLimitOptions {
  windowSize: number;
  maxRequests: number;
  apiType: ApiType;
  keyPrefix?: string;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

export type KeyGenerator = (req: Request) => string;

export interface RateLimitConfig {
  public: {
    windowSize: number;
    maxRequests: number;
  };
  auth: {
    windowSize: number;
    maxRequests: number;
  };
  sensitive: {
    windowSize: number;
    maxRequests: number;
  };
  external: {
    windowSize: number;
    maxRequests: number;
  };
}
