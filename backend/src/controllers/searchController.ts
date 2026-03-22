import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { search, getSearchSuggestions, highlightMatches, SearchOptions } from '../services/searchService';
import { createLogger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../utils/errors';

const logger = createLogger('SearchController');

export const searchResources = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      q,
      type = 'all',
      category,
      page = 1,
      limit = 20,
      sort = 'relevance'
    } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      const error = createErrorResponse(ErrorCode.INVALID_INPUT, 'Search query is required');
      res.status(400).json(error);
      return;
    }

    logger.info('Searching resources', { query: q, type, category, page, limit, sort });

    const result = await search(q.trim(), {
      resourceType: type as 'skill' | 'prompt' | 'all',
      category: category as string,
      page: Number(page),
      limit: Number(limit),
      sort: sort as 'relevance' | 'latest' | 'popular'
    });

    logger.info('Search completed', {
      query: q,
      totalResults: result.meta.totalResults,
      took: result.meta.took
    });

    res.json({
      success: true,
      data: {
        skills: {
          items: result.skills.items,
          total: result.skills.total,
          page: result.skills.page,
          totalPages: result.skills.totalPages
        },
        prompts: {
          items: result.prompts.items,
          total: result.prompts.total,
          page: result.prompts.page,
          totalPages: result.prompts.totalPages
        }
      },
      meta: result.meta
    });
  } catch (error) {
    logger.error('Search failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      query: req.query.q
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      res.json({
        success: true,
        data: []
      });
      return;
    }

    const suggestions = await getSearchSuggestions(q.trim(), Number(limit));

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    logger.error('Get suggestions failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const logSearch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { keyword, type } = req.body;

    if (!keyword || typeof keyword !== 'string') {
      const error = createErrorResponse(ErrorCode.INVALID_INPUT, 'Keyword is required');
      res.status(error.statusCode).json(error);
      return;
    }

    logger.info('Search logged', {
      userId: req.user?.userId,
      keyword,
      type
    });

    res.json({
      success: true,
      message: 'Search logged successfully'
    });
  } catch (error) {
    logger.error('Log search failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getSearchHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get search history failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const clearSearchHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    logger.info('Search history cleared', { userId: req.user.userId });

    res.json({
      success: true,
      message: 'Search history cleared successfully'
    });
  } catch (error) {
    logger.error('Clear search history failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};
