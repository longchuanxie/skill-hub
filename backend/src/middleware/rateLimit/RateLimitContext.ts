import { Request } from 'express';
import { ApiType } from './RateLimitOptions';
import { AuthRequest } from '../auth';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function getApiKey(req: Request): string | null {
  const apiKey = req.headers['x-api-key'] || req.query['api_key'];
  return typeof apiKey === 'string' ? apiKey : null;
}

export function getUserId(req: Request): string | null {
  const authReq = req as AuthRequest;
  if (authReq.user && authReq.user.userId) {
    return authReq.user.userId.toString();
  }
  return null;
}

export function generateKey(req: Request, apiType: ApiType): string {
  const ip = getClientIp(req);

  switch (apiType) {
    case ApiType.EXTERNAL: {
      const apiKey = getApiKey(req);
      return apiKey ? `ratelimit:external:${apiKey}` : `ratelimit:external:ip:${ip}`;
    }
    case ApiType.PUBLIC:
      return `ratelimit:public:ip:${ip}`;
    case ApiType.AUTHENTICATED: {
      const userId = getUserId(req);
      return userId ? `ratelimit:auth:user:${userId}` : `ratelimit:auth:ip:${ip}`;
    }
    case ApiType.SENSITIVE: {
      const userId = getUserId(req);
      return userId ? `ratelimit:sensitive:user:${userId}` : `ratelimit:sensitive:ip:${ip}`;
    }
    default:
      return `ratelimit:unknown:ip:${ip}`;
  }
}

export function getDefaultConfig() {
  return {
    public: {
      windowSize: parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW || '60000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX || '10', 10),
    },
    auth: {
      windowSize: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW || '60000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '60', 10),
    },
    sensitive: {
      windowSize: parseInt(process.env.RATE_LIMIT_SENSITIVE_WINDOW || '60000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_SENSITIVE_MAX || '20', 10),
    },
    external: {
      windowSize: parseInt(process.env.RATE_LIMIT_EXTERNAL_WINDOW || '60000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_EXTERNAL_MAX || '100', 10),
    },
  };
}
