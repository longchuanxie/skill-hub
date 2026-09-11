import 'dotenv/config';
import './config/env';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { enterpriseMiddleware } from './middleware/enterpriseMiddleware';
import { initializeEnterpriseContext, enterpriseContext } from './config/enterpriseContext';
import { getLocalPath } from './config/storage';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import skillRoutes from './routes/skills';
import skillVersionsRoutes from './routes/skillVersions';
import promptVersionsRoutes from './routes/promptVersions';
import promptRoutes from './routes/prompts';
import enterpriseRoutes from './routes/enterprises';
import agentRoutes from './routes/agents';
import agentResourcesRoutes from './routes/agentResources';
import oauthRoutes from './routes/oauth';
import favoriteRoutes from './routes/favorites';
import likeRoutes from './routes/likes';
import commentRoutes from './routes/commentRoutes';
import homeRoutes from './routes/home';
import trendsRoutes from './routes/trends';
import testRoutes from './routes/test';
import customPagesRoutes from './routes/customPages';
import versionsRoutes from './routes/versions';
import docsRoutes from './routes/docs';
import permissionsRoutes from './routes/permissions';
import rateLimitRoutes, { createMatchedRateLimitMiddleware } from './routes/rateLimits';
import searchRoutes from './routes/search';
import recommendationRoutes from './routes/recommendations';
import adminRoutes from './routes/admin';
import invitationRoutes from './routes/invitation';
import { ErrorCode, createErrorResponse } from './utils/errors';

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN || 'http://localhost:5173',
      'http://localhost:5175',
      'http://localhost:5174',
    ],
    credentials: true,
  }),
);

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
});

app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Strip MongoDB operators ($gt, $ne, $where...) from user input to block
// NoSQL operator injection in query filters.
app.use(mongoSanitize());

app.use('/uploads', express.static(path.resolve(getLocalPath())));

initializeEnterpriseContext();

app.use(enterpriseMiddleware);

app.get('/api/health', async (req: Request, res: Response) => {
  let dbOk = false;
  try {
    await mongoose.connection.db?.command({ ping: 1 });
    dbOk = true;
  } catch {
    dbOk = false;
  }

  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    enterprise: enterpriseContext.isSingleTenantMode()
      ? {
          mode: 'single-tenant',
          enterpriseId: enterpriseContext.getEnterpriseId(),
        }
      : {
          mode: 'multi-tenant',
        },
  });
});

// Per-route rate limiting based on the rateLimitRoutes table (auth/sensitive/
// external/authenticated). Unmatched routes pass through untouched.
app.use(
  '/api',
  createMatchedRateLimitMiddleware((req) => req.path),
);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api', skillVersionsRoutes);
app.use('/api', promptVersionsRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/enterprises', enterpriseRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/agent', agentResourcesRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/trends', trendsRoutes);
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes);
}
app.use('/api/custom-pages', customPagesRoutes);
app.use('/api/versions', versionsRoutes);
app.use('/api', permissionsRoutes);
app.use('/api/rate-limit', rateLimitRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invitation', invitationRoutes);

if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDistPath));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.use((req: Request, res: Response) => {
  res.status(404).json(createErrorResponse(ErrorCode.RESOURCE_NOT_FOUND));
});

app.use(errorHandler);

export default app;
