import 'dotenv/config';
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

const app: Application = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillhub';

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
