import { Request, Response } from 'express';

export const testHome = async (req: Request, res: Response) => {
  try {
    console.log('测试首页路由...');
    res.json({
      success: true,
      message: 'Home route is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('测试路由出错:', error);
    res.status(500).json({
      success: false,
      error: 'Test route failed'
    });
  }
};