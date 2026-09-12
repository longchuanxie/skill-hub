import { Response } from 'express';
import { Types } from 'mongoose';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../utils/errors';

const logger = createLogger('likeController');

// Reads the current like state with a minimal projection, then applies the
// toggle atomically ($addToSet/$pull + $inc) so concurrent requests cannot
// clobber each other's writes.
const toggleSkillLike = async (id: string, userId: string, res: Response): Promise<void> => {
  const skill = await Skill.findById(id)
    .select('likes likeCount')
    .lean<{ likes: Types.ObjectId[]; likeCount: number }>();
  if (!skill) {
    const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
    res.status(error.statusCode).json(error);
    return;
  }

  const liked = skill.likes.some((u) => u.toString() === userId);
  await Skill.updateOne(
    { _id: id },
    liked
      ? { $pull: { likes: userId }, $inc: { likeCount: -1 } }
      : { $addToSet: { likes: userId }, $inc: { likeCount: 1 } },
  );

  res.json({ liked: !liked, likeCount: Math.max(0, (skill.likeCount ?? 0) + (liked ? -1 : 1)) });
};

const togglePromptLike = async (id: string, userId: string, res: Response): Promise<void> => {
  const prompt = await Prompt.findById(id)
    .select('likes likeCount')
    .lean<{ likes: Types.ObjectId[]; likeCount: number }>();
  if (!prompt) {
    const error = createErrorResponse(ErrorCode.PROMPT_NOT_FOUND);
    res.status(error.statusCode).json(error);
    return;
  }

  const liked = prompt.likes.some((u) => u.toString() === userId);
  await Prompt.updateOne(
    { _id: id },
    liked
      ? { $pull: { likes: userId }, $inc: { likeCount: -1 } }
      : { $addToSet: { likes: userId }, $inc: { likeCount: 1 } },
  );

  res.json({ liked: !liked, likeCount: Math.max(0, (prompt.likeCount ?? 0) + (liked ? -1 : 1)) });
};

export const likeController = {
  toggleLike: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      const id = String(req.params.id);
      const userId = req.user?.userId;
      if (!userId) {
        const error = createErrorResponse(ErrorCode.TOKEN_MISSING);
        res.status(error.statusCode).json(error);
        return;
      }

      if (type === 'skill') {
        await toggleSkillLike(id, userId, res);
      } else if (type === 'prompt') {
        await togglePromptLike(id, userId, res);
      } else {
        const error = createErrorResponse(ErrorCode.INVALID_INPUT);
        res.status(error.statusCode).json(error);
      }
    } catch (error) {
      logger.error('Toggle like error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
      res.status(err.statusCode).json(err);
    }
  },

  checkLike: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      const id = String(req.params.id);
      const userId = req.user?.userId;
      if (!userId) {
        const error = createErrorResponse(ErrorCode.TOKEN_MISSING);
        res.status(error.statusCode).json(error);
        return;
      }

      if (type === 'skill') {
        const skill = await Skill.findById(id).select('likes').lean<{ likes: Types.ObjectId[] }>();
        if (!skill) {
          const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
          res.status(error.statusCode).json(error);
          return;
        }
        res.json({ isLiked: skill.likes.some((u) => u.toString() === userId) });
      } else if (type === 'prompt') {
        const prompt = await Prompt.findById(id)
          .select('likes')
          .lean<{ likes: Types.ObjectId[] }>();
        if (!prompt) {
          const error = createErrorResponse(ErrorCode.PROMPT_NOT_FOUND);
          res.status(error.statusCode).json(error);
          return;
        }
        res.json({ isLiked: prompt.likes.some((u) => u.toString() === userId) });
      } else {
        const error = createErrorResponse(ErrorCode.INVALID_INPUT);
        res.status(error.statusCode).json(error);
      }
    } catch (error) {
      logger.error('Check like error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
      res.status(err.statusCode).json(err);
    }
  },

  getLikes: async (req: AuthRequest, res: Response): Promise<void> => {
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
          likes: userId,
          status: 'approved',
          visibility: 'public',
        }).populate('owner', 'username avatar');
        res.json({ skills });
      } else if (type === 'prompts') {
        const prompts = await Prompt.find({
          likes: userId,
          status: 'approved',
          visibility: 'public',
        }).populate('owner', 'username avatar');
        res.json({ prompts });
      } else {
        const error = createErrorResponse(ErrorCode.INVALID_INPUT);
        res.status(error.statusCode).json(error);
      }
    } catch (error) {
      logger.error('Get likes error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
      res.status(err.statusCode).json(err);
    }
  },
};
