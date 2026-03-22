import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getRecommendations, recordBehavior, RecommendationOptions } from '../services/recommendationService';
import { createLogger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../utils/errors';
import { User } from '../models/User';

const logger = createLogger('RecommendationController');

export const getResourceRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      type = 'popular',
      resourceType = 'skill',
      resourceId,
      limit = 10,
      category
    } = req.query;

    if (!type || !['popular', 'new', 'similar', 'personalized'].includes(type as string)) {
      const error = createErrorResponse(ErrorCode.INVALID_INPUT, 'Invalid recommendation type');
      res.status(400).json(error);
      return;
    }

    const validTypes = ['popular', 'new', 'similar', 'personalized'] as const;
    const options: RecommendationOptions = {
      type: validTypes.includes(type as typeof validTypes[number]) ? type as 'popular' | 'new' | 'similar' | 'personalized' : 'popular',
      resourceType: resourceType as 'skill' | 'prompt',
      limit: Number(limit),
      category: category as string,
      userId: req.user?.userId
    };

    if (resourceId) {
      options.resourceId = resourceId as string;
    }

    if (req.user?.userId) {
      const user = await User.findById(req.user.userId);
      if (user?.enterpriseId) {
        options.enterpriseId = user.enterpriseId.toString();
      }
    }

    logger.info('Getting recommendations', {
      userId: req.user?.userId,
      type,
      resourceType,
      resourceId,
      limit: options.limit
    });

    const recommendations = await getRecommendations(options);

    logger.info('Recommendations retrieved', {
      userId: req.user?.userId,
      type,
      count: recommendations.length
    });

    res.json({
      success: true,
      data: recommendations,
      meta: {
        type,
        resourceType,
        count: recommendations.length
      }
    });
  } catch (error) {
    logger.error('Get recommendations failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const logUserBehavior = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const { resourceType, resourceId, action } = req.body;

    if (!resourceType || !['skill', 'prompt'].includes(resourceType)) {
      const error = createErrorResponse(ErrorCode.INVALID_INPUT, 'Invalid resource type');
      res.status(error.statusCode).json(error);
      return;
    }

    if (!resourceId) {
      const error = createErrorResponse(ErrorCode.INVALID_INPUT, 'Resource ID is required');
      res.status(error.statusCode).json(error);
      return;
    }

    if (!action || !['view', 'download', 'favorite', 'use'].includes(action)) {
      const error = createErrorResponse(ErrorCode.INVALID_INPUT, 'Invalid action');
      res.status(error.statusCode).json(error);
      return;
    }

    await recordBehavior(
      req.user.userId,
      resourceType as 'skill' | 'prompt',
      resourceId,
      action as 'view' | 'download' | 'favorite' | 'use'
    );

    logger.info('User behavior logged', {
      userId: req.user.userId,
      resourceType,
      resourceId,
      action
    });

    res.json({
      success: true,
      message: 'Behavior logged successfully'
    });
  } catch (error) {
    logger.error('Log behavior failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};
