import { Router, Request, Response, NextFunction } from 'express';
import { ApiType } from '../middleware/rateLimit/RateLimitOptions';
import {
  rateLimitManager,
  publicApiLimiter,
  externalApiLimiter,
  authApiLimiter,
  sensitiveApiLimiter,
  dynamicRateLimit,
} from '../middleware/rateLimit';

export function applyRouteRateLimits(): void {
  const authRouter = require('./auth').default;
  const skillsRouter = require('./skills').default;
  const agentsRouter = require('./agents').default;
  const promptsRouter = require('./prompts').default;

  if (authRouter) {
    authRouter.stack = authRouter.stack.filter((layer: any) => {
      return !layer.route || !layer.route.path.match(/^\/(login|register|send-code|verify-code|forgot-password|reset-password)$/);
    });
  }
}

export const rateLimitRoutes: { path: string; method: string; apiType: ApiType }[] = [
  { path: '/auth/login', method: 'POST', apiType: ApiType.PUBLIC },
  { path: '/auth/register', method: 'POST', apiType: ApiType.PUBLIC },
  { path: '/auth/send-code', method: 'POST', apiType: ApiType.PUBLIC },
  { path: '/auth/verify-code', method: 'POST', apiType: ApiType.PUBLIC },
  { path: '/auth/forgot-password', method: 'POST', apiType: ApiType.PUBLIC },
  { path: '/auth/reset-password', method: 'POST', apiType: ApiType.PUBLIC },

  { path: '/agents/invoke', method: 'POST', apiType: ApiType.EXTERNAL },
  { path: '/skills/public', method: 'GET', apiType: ApiType.EXTERNAL },

  { path: '/skills', method: 'POST', apiType: ApiType.SENSITIVE },
  { path: '/skills/:id', method: 'DELETE', apiType: ApiType.SENSITIVE },
  { path: '/prompts', method: 'POST', apiType: ApiType.SENSITIVE },
  { path: '/prompts/:id', method: 'DELETE', apiType: ApiType.SENSITIVE },
  { path: '/agents', method: 'POST', apiType: ApiType.SENSITIVE },
  { path: '/agents/:id', method: 'DELETE', apiType: ApiType.SENSITIVE },

  { path: '/skills/:id', method: 'PUT', apiType: ApiType.AUTHENTICATED },
  { path: '/prompts/:id', method: 'PUT', apiType: ApiType.AUTHENTICATED },
  { path: '/agents/:id', method: 'PUT', apiType: ApiType.AUTHENTICATED },
  { path: '/favorites', method: 'POST', apiType: ApiType.AUTHENTICATED },
  { path: '/likes', method: 'POST', apiType: ApiType.AUTHENTICATED },
  { path: '/comments', method: 'POST', apiType: ApiType.AUTHENTICATED },
];

export function matchRouteRateLimit(path: string, method: string): ApiType | null {
  for (const route of rateLimitRoutes) {
    const pathPattern = route.path.replace(/:(\w+)/g, '([^/]+)');
    const regex = new RegExp(`^${pathPattern}$`);

    if (regex.test(path) && route.method === method) {
      return route.apiType;
    }
  }
  return null;
}

export function createMatchedRateLimitMiddleware(
  getPath: (req: Request) => string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const path = getPath(req);
    const apiType = matchRouteRateLimit(path, req.method);

    if (apiType) {
      await rateLimitManager.checkLimit(req, res, next, apiType);
    } else {
      next();
    }
  };
}

const router = Router();

router.get('/status', (req: Request, res: Response) => {
  res.json({
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    limits: {
      public: {
        window: process.env.RATE_LIMIT_PUBLIC_WINDOW || '60000',
        max: process.env.RATE_LIMIT_PUBLIC_MAX || '10',
      },
      auth: {
        window: process.env.RATE_LIMIT_AUTH_WINDOW || '60000',
        max: process.env.RATE_LIMIT_AUTH_MAX || '60',
      },
      sensitive: {
        window: process.env.RATE_LIMIT_SENSITIVE_WINDOW || '60000',
        max: process.env.RATE_LIMIT_SENSITIVE_MAX || '20',
      },
      external: {
        window: process.env.RATE_LIMIT_EXTERNAL_WINDOW || '60000',
        max: process.env.RATE_LIMIT_EXTERNAL_MAX || '100',
      },
    },
  });
});

router.post('/config', (req: Request, res: Response) => {
  const { enabled, public: publicConfig, auth: authConfig, sensitive: sensitiveConfig, external: externalConfig } = req.body;

  if (enabled !== undefined) {
    rateLimitManager.setEnabled(enabled);
  }

  if (publicConfig || authConfig || sensitiveConfig || externalConfig) {
    rateLimitManager.updateConfig({
      ...(publicConfig && { public: publicConfig }),
      ...(authConfig && { auth: authConfig }),
      ...(sensitiveConfig && { sensitive: sensitiveConfig }),
      ...(externalConfig && { external: externalConfig }),
    });
  }

  res.json({ message: 'Rate limit config updated' });
});

export default router;
