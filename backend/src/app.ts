import 'dotenv/config';
import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'path';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { enterpriseMiddleware } from './middleware/enterpriseMiddleware';
import { initializeEnterpriseContext } from './config/enterpriseContext';
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
import rateLimitRoutes from './routes/rateLimits';

const app: Application = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

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

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

initializeEnterpriseContext();

app.use(enterpriseMiddleware);

app.get('/api/health', (req: Request, res: Response) => {
  const { enterpriseContext } = require('./config/enterpriseContext');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    enterprise: enterpriseContext.isSingleTenantMode() ? {
      mode: 'single-tenant',
      enterpriseId: enterpriseContext.getEnterpriseId(),
    } : {
      mode: 'multi-tenant',
    }
  });
});

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
app.use('/api/test', testRoutes);
app.use('/api/custom-pages', customPagesRoutes);
app.use('/api/versions', versionsRoutes);
app.use('/api', permissionsRoutes);
app.use('/api/rate-limit', rateLimitRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillhub';

logger.info('Starting server...', { 
  port: PORT, 
  nodeEnv: process.env.NODE_ENV, 
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173' 
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//****@') });
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`, { 
        port: PORT, 
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      uri: MONGODB_URI.replace(/\/\/.*@/, '//****@')
    });
    process.exit(1);
  });

export default app;
