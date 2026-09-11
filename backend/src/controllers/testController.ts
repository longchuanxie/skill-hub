import { Request, Response } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('testController');

export const testHome = async (req: Request, res: Response) => {
  try {
    logger.info('测试首页路由...');
    res.json({
      success: true,
      message: 'Home route is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('测试路由出错:', error);
    res.status(500).json({
      success: false,
      error: 'Test route failed'
    });
  }
};