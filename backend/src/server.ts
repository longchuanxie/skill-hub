import 'dotenv/config';
import './config/env';
import mongoose from 'mongoose';
import { logger } from './utils/logger';
import app from './app';
import { initializeSuperAdmin } from './utils/initSuperAdmin';

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillhub';

async function main(): Promise<void> {
  logger.info('Starting server...', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  });

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//****@') });
  } catch (error) {
    logger.error('MongoDB connection error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      uri: MONGODB_URI.replace(/\/\/.*@/, '//****@'),
    });
    process.exit(1);
  }

  try {
    await initializeSuperAdmin();
  } catch (error) {
    logger.error('Failed to initialize super admin', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  const shutdown = (signal: string): void => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    // Force exit if connections do not drain in time.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

void main();
