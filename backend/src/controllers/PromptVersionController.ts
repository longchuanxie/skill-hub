import { Response } from 'express';
import { PromptVersion } from '../models/PromptVersion';
import { Prompt } from '../models/Prompt';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../utils/errors';

const logger = createLogger('PromptVersionController');

export const getPromptVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { promptId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    logger.debug('Getting prompt versions', { promptId, page, pageSize, userId: req.user?.userId });

    const prompt = await Prompt.findById(promptId);
    if (!prompt) {
      const error = createErrorResponse(ErrorCode.PROMPT_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const versions = await PromptVersion.find({ promptId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(pageSize));

    const total = await PromptVersion.countDocuments({ promptId });

    logger.info('Prompt versions retrieved successfully', { promptId, count: versions.length, total, userId: req.user?.userId });

    res.json({
      versions,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    logger.error('Get prompt versions failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, promptId: req.params.promptId });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getPromptVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { promptId, versionId } = req.params;

    logger.debug('Getting prompt version', { promptId, versionId, userId: req.user?.userId });

    const prompt = await Prompt.findById(promptId);
    if (!prompt) {
      const error = createErrorResponse(ErrorCode.PROMPT_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const version = await PromptVersion.findOne({ _id: versionId, promptId });
    if (!version) {
      const error = createErrorResponse(ErrorCode.PROMPT_VERSION_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    logger.info('Prompt version retrieved successfully', { promptId, versionId, version: version.version, userId: req.user?.userId });

    res.json(version);
  } catch (error) {
    logger.error('Get prompt version failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, promptId: req.params.promptId, versionId: req.params.versionId });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const deletePromptVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { promptId, versionId } = req.params;

    logger.debug('Deleting prompt version', { promptId, versionId, userId: req.user?.userId });

    const prompt = await Prompt.findById(promptId);
    if (!prompt) {
      const error = createErrorResponse(ErrorCode.PROMPT_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    if (String(prompt.owner) !== req.user?.userId) {
      const error = createErrorResponse(ErrorCode.NOT_AUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const version = await PromptVersion.findOne({ _id: versionId, promptId });
    if (!version) {
      const error = createErrorResponse(ErrorCode.PROMPT_VERSION_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    await PromptVersion.deleteOne({ _id: versionId });

    logger.info('Prompt version deleted successfully', { promptId, versionId, version: version.version, userId: req.user?.userId });

    res.json({
      message: 'Prompt version deleted successfully',
    });
  } catch (error) {
    logger.error('Delete prompt version failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, promptId: req.params.promptId, versionId: req.params.versionId });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};