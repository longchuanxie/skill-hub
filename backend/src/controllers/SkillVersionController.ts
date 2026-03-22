import { Response } from 'express';
import { SkillVersion } from '../models/SkillVersion';
import { Skill } from '../models/Skill';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../utils/errors';

const logger = createLogger('SkillVersionController');

export const getSkillVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    logger.debug('Getting skill versions', { skillId, page, pageSize, userId: req.user?.userId });

    const skill = await Skill.findById(skillId);
    if (!skill) {
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const versions = await SkillVersion.find({ skillId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(pageSize));

    const total = await SkillVersion.countDocuments({ skillId });

    logger.info('Skill versions retrieved successfully', { skillId, count: versions.length, total, userId: req.user?.userId });

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
    logger.error('Get skill versions failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, skillId: req.params.skillId });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getSkillVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, versionId } = req.params;

    logger.debug('Getting skill version', { skillId, versionId, userId: req.user?.userId });

    const skill = await Skill.findById(skillId);
    if (!skill) {
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const version = await SkillVersion.findOne({ _id: versionId, skillId });
    if (!version) {
      const error = createErrorResponse(ErrorCode.SKILL_VERSION_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    logger.info('Skill version retrieved successfully', { skillId, versionId, version: version.version, userId: req.user?.userId });

    res.json(version);
  } catch (error) {
    logger.error('Get skill version failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, skillId: req.params.skillId, versionId: req.params.versionId });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const deleteSkillVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { skillId, versionId } = req.params;

    logger.debug('Deleting skill version', { skillId, versionId, userId: req.user?.userId });

    const skill = await Skill.findById(skillId);
    if (!skill) {
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    if (String(skill.owner) !== req.user?.userId) {
      const error = createErrorResponse(ErrorCode.NOT_AUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const version = await SkillVersion.findOne({ _id: versionId, skillId });
    if (!version) {
      const error = createErrorResponse(ErrorCode.SKILL_VERSION_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    await SkillVersion.deleteOne({ _id: versionId });

    logger.info('Skill version deleted successfully', { skillId, versionId, version: version.version, userId: req.user?.userId });

    res.json({
      message: 'Skill version deleted successfully',
    });
  } catch (error) {
    logger.error('Delete skill version failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, skillId: req.params.skillId, versionId: req.params.versionId });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};