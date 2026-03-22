import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { enterpriseMiddleware } from './middleware/enterpriseMiddleware';
import { initializeEnterpriseContext } from './config/enterpriseContext';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import skillRoutes from './routes/skills';
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
import searchRoutes from './routes/search';
import recommendationRoutes from './routes/recommendations';

const app: Application = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
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
    mongodb: 'in-memory',
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
app.use('/api/search', searchRoutes);
app.use('/api/recommendations', recommendationRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

let mongoServer: MongoMemoryServer;

async function startServer() {
  try {
    logger.info('Starting in-memory MongoDB server...', { port: PORT });
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    logger.info(`Starting in-memory MongoDB at: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    logger.info('Connected to in-memory MongoDB');
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`, { 
        port: PORT, 
        environment: process.env.NODE_ENV || 'development',
        mode: 'in-memory',
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  process.exit(0);
});

export default app;
