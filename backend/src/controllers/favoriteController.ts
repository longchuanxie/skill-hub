import { Response } from 'express';
import { Types } from 'mongoose';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../utils/errors';

const logger = createLogger('favoriteController');

// All mutations use $addToSet/$pull + $inc so concurrent favorites cannot
// overwrite each other (the old full-document save() lost updates).
const hasFavorite = (favorites: Types.ObjectId[] | undefined, userId: string): boolean =>
  !!favorites && favorites.some((u) => u.toString() === userId);

export const favoriteController = {
  addFavorite: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        const error = createErrorResponse(ErrorCode.TOKEN_MISSING);
        res.status(error.statusCode).json(error);
        return;
      }

      const Model = type === 'skill' ? Skill : type === 'prompt' ? Prompt : null;
      if (!Model) {
        const error = createErrorResponse(ErrorCode.INVALID_INPUT);
        res.status(error.statusCode).json(error);
        return;
      }

      const doc = await (Model as typeof Skill)
        .findById(id)
        .select('favorites favoriteCount')
        .lean<{ favorites?: Types.ObjectId[]; favoriteCount: number }>();
      if (!doc) {
        const error = createErrorResponse(
          type === 'skill' ? ErrorCode.SKILL_NOT_FOUND : ErrorCode.PROMPT_NOT_FOUND,
        );
        res.status(error.statusCode).json(error);
        return;
      }

      if (hasFavorite(doc.favorites, userId)) {
        res.json({ message: 'Already favorited', favoriteCount: doc.favoriteCount ?? 0 });
        return;
      }

      await (Model as typeof Skill).updateOne(
        { _id: id },
        { $addToSet: { favorites: userId }, $inc: { favoriteCount: 1 } },
      );
      res.json({ message: 'Added to favorites', favoriteCount: (doc.favoriteCount ?? 0) + 1 });
    } catch (error) {
      logger.error('Add favorite error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
      res.status(err.statusCode).json(err);
    }
  },

  removeFavorite: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        const error = createErrorResponse(ErrorCode.TOKEN_MISSING);
        res.status(error.statusCode).json(error);
        return;
      }

      const Model = type === 'skill' ? Skill : type === 'prompt' ? Prompt : null;
      if (!Model) {
        const error = createErrorResponse(ErrorCode.INVALID_INPUT);
        res.status(error.statusCode).json(error);
        return;
      }

      const doc = await (Model as typeof Skill)
        .findById(id)
        .select('favorites favoriteCount')
        .lean<{ favorites?: Types.ObjectId[]; favoriteCount: number }>();
      if (!doc) {
        const error = createErrorResponse(
          type === 'skill' ? ErrorCode.SKILL_NOT_FOUND : ErrorCode.PROMPT_NOT_FOUND,
        );
        res.status(error.statusCode).json(error);
        return;
      }

      if (!hasFavorite(doc.favorites, userId)) {
        res.json({ message: 'Not favorited', favoriteCount: doc.favoriteCount ?? 0 });
        return;
      }

      await (Model as typeof Skill).updateOne(
        { _id: id },
        { $pull: { favorites: userId }, $inc: { favoriteCount: -1 } },
      );
      res.json({
        message: 'Removed from favorites',
        favoriteCount: Math.max(0, (doc.favoriteCount ?? 0) - 1),
      });
    } catch (error) {
      logger.error('Remove favorite error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
      res.status(err.statusCode).json(err);
    }
  },

  checkFavorite: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        const error = createErrorResponse(ErrorCode.TOKEN_MISSING);
        res.status(error.statusCode).json(error);
        return;
      }

      const Model = type === 'skill' ? Skill : type === 'prompt' ? Prompt : null;
      if (!Model) {
        const error = createErrorResponse(ErrorCode.INVALID_INPUT);
        res.status(error.statusCode).json(error);
        return;
      }

      const doc = await (Model as typeof Skill)
        .findById(id)
        .select('favorites')
        .lean<{ favorites?: Types.ObjectId[] }>();
      if (!doc) {
        const error = createErrorResponse(
          type === 'skill' ? ErrorCode.SKILL_NOT_FOUND : ErrorCode.PROMPT_NOT_FOUND,
        );
        res.status(error.statusCode).json(error);
        return;
      }

      res.json({ isFavorited: hasFavorite(doc.favorites, userId) });
    } catch (error) {
      logger.error('Check favorite error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
      res.status(err.statusCode).json(err);
    }
  },

  getFavorites: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        const error = createErrorResponse(ErrorCode.TOKEN_MISSING);
        res.status(error.statusCode).json(error);
        return;
      }

      if (type === 'skills') {
        const skills = await Skill.find({
          favorites: userId,
          status: 'approved',
          visibility: 'public',
        }).populate('owner', 'username avatar');
        res.json({ skills });
      } else if (type === 'prompts') {
        const prompts = await Prompt.find({
          favorites: userId,
          status: 'approved',
          visibility: 'public',
        }).populate('owner', 'username avatar');
        res.json({ prompts });
      } else {
        const error = createErrorResponse(ErrorCode.INVALID_INPUT);
        res.status(error.statusCode).json(error);
      }
    } catch (error) {
      logger.error('Get favorites error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
      res.status(err.statusCode).json(err);
    }
  },
};
