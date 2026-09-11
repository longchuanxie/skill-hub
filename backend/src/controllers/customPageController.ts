import { Request, Response } from 'express';
import { CustomPage } from '../models/CustomPage';
import { createLogger } from '../utils/logger';

const logger = createLogger('customPageController');

export const getAllPages = async (req: Request, res: Response) => {
  try {
    const pages = await CustomPage.find({ isActive: true });
    res.json({
      success: true,
      data: pages
    });
  } catch (error) {
    logger.error('获取所有页面时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pages'
    });
  }
};

export const getPageByKey = async (req: Request, res: Response) => {
  try {
    const { pageKey } = req.params;
    const language = req.query.language as string || 'en';

    const page = await CustomPage.findOne({ 
      pageKey, 
      language,
      isActive: true 
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }

    res.json({
      success: true,
      data: page
    });
  } catch (error) {
    logger.error('获取页面时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch page'
    });
  }
};

export const createPage = async (req: Request, res: Response) => {
  try {
    const { pageKey, title, content, language } = req.body;

    const existingPage = await CustomPage.findOne({ pageKey, language });
    if (existingPage) {
      return res.status(400).json({
        success: false,
        error: 'Page with this key and language already exists'
      });
    }

    const page = new CustomPage({
      pageKey,
      title,
      content,
      language
    });

    await page.save();

    res.status(201).json({
      success: true,
      data: page
    });
  } catch (error) {
    logger.error('创建页面时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create page'
    });
  }
};

export const updatePage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, isActive } = req.body;

    const page = await CustomPage.findByIdAndUpdate(
      id,
      { title, content, isActive },
      { new: true, runValidators: true }
    );

    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }

    res.json({
      success: true,
      data: page
    });
  } catch (error) {
    logger.error('更新页面时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update page'
    });
  }
};

export const deletePage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const page = await CustomPage.findByIdAndDelete(id);

    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }

    res.json({
      success: true,
      message: 'Page deleted successfully'
    });
  } catch (error) {
    logger.error('删除页面时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete page'
    });
  }
};
