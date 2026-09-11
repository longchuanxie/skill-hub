import { Response } from 'express';
import { Skill } from '../models/Skill';
import { SkillVersion } from '../models/SkillVersion';
import { ResourceVersion } from '../models/ResourceVersion';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';
import { validateSkillUpload } from '../utils/skillUploadValidator';
import { reviewSkill } from '../utils/resourceAutoReview';
import { createLogger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../utils/errors';
import { createResourceVersion } from '../utils/resourceHelpers';
import { getFileUrl } from '../middleware/upload';
import { Types } from 'mongoose';

const logger = createLogger('SkillController');

export async function generateNextVersion(skillId: Types.ObjectId): Promise<string> {
  const versions = await SkillVersion.find({ skillId }).sort({ createdAt: -1 });
  
  if (versions.length === 0) {
    return '1.0.0';
  }
  
  const lastVersion = versions[0].version;
  const parts = lastVersion.split('.').map(Number);
  
  parts[2] = (parts[2] || 0) + 1;
  
  if (parts[2] > 99) {
    parts[2] = 0;
    parts[1] = (parts[1] || 0) + 1;
  }
  
  if (parts[1] > 99) {
    parts[1] = 0;
    parts[0] = (parts[0] || 0) + 1;
  }
  
  return parts.join('.');
}

export const createSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.info('Creating skill', { userId: req.user?.userId, name: req.body.name, hasFile: !!req.file });
    
    const { name, description, category, tags, visibility, updateDescription, author, compatibility, status } = req.body;

    if (!req.user?.userId) {
      logger.warn('Create skill failed - unauthorized', { ip: req.ip });
      const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    const hasFile = req.file != null;

    if (!hasFile && visibility === 'public') {
      logger.warn('Create skill failed - public skill requires file', { userId: req.user?.userId });
      const error = createErrorResponse(ErrorCode.PUBLIC_SKILL_REQUIRES_FILE);
      res.status(error.statusCode).json(error);
      return;
    }

    let finalStatus: 'draft' | 'pending' | 'approved' | 'rejected' = 'draft';
    let autoReviewResult: { passed: boolean; issues?: string[]; warnings?: string[] } | undefined;

    if (status === 'approved' || status === 'pending') {
      if (hasFile) {
        const tempDir = path.join(process.cwd(), 'temp', `skill-review-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });
        try {
          const reviewResult = await reviewSkill({ name, description, category, tags }, req.file!.path);
          autoReviewResult = {
            passed: reviewResult.passed,
            issues: reviewResult.reasons,
            warnings: reviewResult.warnings,
          };
          if (reviewResult.passed) {
            finalStatus = 'approved';
          } else {
            finalStatus = 'rejected';
          }
          logger.info('Skill auto review completed', { 
            userId: req.user?.userId, 
            passed: reviewResult.passed, 
            status: finalStatus 
          });
        } finally {
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        }
      } else {
        finalStatus = 'draft';
        autoReviewResult = {
          passed: false,
          issues: ['提交审核需要上传文件'],
        };
      }
    } else {
      finalStatus = 'draft';
    }

    let skillData: any = {
      name,
      description,
      category: category || 'general',
      tags: tags || [],
      owner: req.user?.userId,
      visibility: visibility || 'private',
      status: finalStatus,
      version: '1.0.0',
      files: [],
      author: author || undefined,
      compatibility: compatibility || [],
    };

    if (hasFile) {
      if (!req.file!.originalname.endsWith('.zip')) {
        logger.warn('Create skill failed - invalid file type', { userId: req.user?.userId, filename: req.file!.originalname });
        const error = createErrorResponse(ErrorCode.INVALID_FILE_TYPE);
        res.status(error.statusCode).json(error);
        return;
      }

      const tempDir = path.join(process.cwd(), 'temp', `skill-${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        logger.debug('Validating skill structure', { tempDir, filePath: req.file!.path });
        
        const validationResult = await validateSkillUpload(req.file!.path, tempDir);
        if (!validationResult.valid) {
          logger.warn('Create skill failed - invalid skill structure', { userId: req.user?.userId, errors: validationResult.errors });
          const error = createErrorResponse(ErrorCode.INVALID_SKILL_STRUCTURE, validationResult.errors);
          res.status(error.statusCode).json(error);
          return;
        }

        const fileUrl = getFileUrl(req.file!.filename);
        
        skillData.files = [{
          filename: req.file!.originalname,
          originalName: req.file!.originalname,
          path: fileUrl,
          size: req.file!.size,
          mimetype: req.file!.mimetype,
        }];

        if (validationResult.structure) {
          if (validationResult.structure.name) skillData.name = validationResult.structure.name;
          if (validationResult.structure.description) skillData.description = validationResult.structure.description;
        }
        
        // 如果没有name，使用顶级目录名
        if (!skillData.name && validationResult.topLevelDir) {
          skillData.name = validationResult.topLevelDir;
          logger.debug('Using top-level directory name as skill name', { name: skillData.name });
        }
        
        logger.debug('Skill validation passed', { structure: validationResult.structure, topLevelDir: validationResult.topLevelDir });
      } finally {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    }

    // 检查是否有name
    if (!skillData.name) {
      logger.warn('Create skill failed - name is required', { userId: req.user?.userId });
      const error = createErrorResponse(ErrorCode.NAME_REQUIRED);
      res.status(error.statusCode).json(error);
      return;
    }

    const existingSkill = await Skill.findOne({
      owner: req.user?.userId,
      name: skillData.name,
    });

    if (existingSkill) {
      logger.info('Skill with same name exists, creating new version', {
        skillId: existingSkill._id,
        name: skillData.name,
        userId: req.user?.userId,
      });

      const previousVersion = existingSkill.version;
      const newVersion = await generateNextVersion(existingSkill._id);

      if (hasFile) {
        const fileUrl = getFileUrl(req.file!.filename);
        const skillVersion = new SkillVersion({
          skillId: existingSkill._id,
          version: newVersion,
          url: fileUrl,
          filename: req.file!.filename,
          originalName: req.file!.originalname,
          size: req.file!.size,
          mimetype: req.file!.mimetype,
          updateDescription: updateDescription || `Update to version ${newVersion}`,
        });
        await skillVersion.save();
        logger.debug('Skill version created', { skillVersionId: skillVersion._id, version: newVersion });

        existingSkill.files = [{
          filename: req.file!.originalname,
          originalName: req.file!.originalname,
          path: fileUrl,
          size: req.file!.size,
          mimetype: req.file!.mimetype,
        }];

        const resourceVersion = await createResourceVersion({
          resourceId: existingSkill._id.toString(),
          resourceType: 'skill',
          version: newVersion,
          content: skillData.description || existingSkill.description || '',
          files: [{
            filename: req.file!.originalname,
            path: fileUrl,
            size: req.file!.size,
            mimetype: req.file!.mimetype,
          }],
          changelog: updateDescription || `Update to version ${newVersion}`,
          tags: skillData.tags || existingSkill.tags || [],
          createdBy: req.user!.userId.toString(),
        });
        logger.debug('ResourceVersion created', { resourceVersionId: resourceVersion._id, version: newVersion });
      }

      existingSkill.version = newVersion;
      if (skillData.description) existingSkill.description = skillData.description;
      if (skillData.category) existingSkill.category = skillData.category;
      if (skillData.tags && skillData.tags.length > 0) existingSkill.tags = skillData.tags;
      if (skillData.author) existingSkill.author = skillData.author;
      if (skillData.compatibility && skillData.compatibility.length > 0) existingSkill.compatibility = skillData.compatibility;
      if (visibility) existingSkill.visibility = visibility;

      await existingSkill.save();

      logger.info('Skill version updated successfully', {
        skillId: existingSkill._id,
        previousVersion,
        newVersion,
        userId: req.user?.userId,
      });

      res.status(200).json({
        message: 'Skill version updated successfully',
        skill: existingSkill,
        isNew: false,
        previousVersion,
        currentVersion: newVersion,
      });
      return;
    }

    const skill = new Skill(skillData);
    await skill.save();

    if (hasFile) {
      const fileUrl = getFileUrl(req.file!.filename);
      const skillVersion = new SkillVersion({
        skillId: skill._id,
        version: '1.0.0',
        url: fileUrl,
        filename: req.file!.filename,
        originalName: req.file!.originalname,
        size: req.file!.size,
        mimetype: req.file!.mimetype,
        updateDescription: updateDescription || 'Initial version',
      });
      await skillVersion.save();
      logger.debug('Skill version created', { skillVersionId: skillVersion._id, version: skillVersion.version });

      const resourceVersion = await createResourceVersion({
        resourceId: skill._id.toString(),
        resourceType: 'skill',
        version: '1.0.0',
        content: skillData.description || '',
        files: [{
          filename: req.file!.originalname,
          path: fileUrl,
          size: req.file!.size,
          mimetype: req.file!.mimetype,
        }],
        changelog: updateDescription || 'Initial version',
        tags: skillData.tags || [],
        createdBy: req.user!.userId.toString(),
      });
      logger.debug('ResourceVersion created', { resourceVersionId: resourceVersion._id, version: resourceVersion.version });
    }

    logger.info('Skill created successfully', { skillId: skill._id, userId: req.user?.userId, name: skill.name, visibility: skill.visibility, status: skill.status });

    res.status(201).json({
      message: 'Skill created successfully',
      skill,
      isNew: true,
      autoReviewResult,
    });
  } catch (error) {
    logger.error('Create skill failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, userId: req.user?.userId });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getSkills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 12, category, search, sort = 'latest' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    logger.debug('Getting skills', { page, pageSize, category, search, sort, userId: req.user?.userId });

    let query: any = { visibility: 'public', status: 'approved' };
    
    if (req.user?.userId) {
      query = {
        $or: [
          { visibility: 'public', status: 'approved' },
          { owner: req.user.userId },
        ]
      };
    }
    
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: String(search) };
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === 'popular') sortOption = { downloads: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1 };

    const [skills, total] = await Promise.all([
      Skill.find(query).populate('owner', 'username avatar').skip(skip).limit(Number(pageSize)).sort(sortOption),
      Skill.countDocuments(query)
    ]);

    logger.info('Skills retrieved successfully', { count: skills.length, total, page, pageSize });

    res.json({
      skills,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        pages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    logger.error('Get skills failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getSkillById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    logger.debug('Getting skill by ID', { skillId: id, userId: req.user?.userId });
    
    const skill = await Skill.findById(id).populate('owner', 'username avatar');
    
    if (!skill) {
      logger.warn('Get skill failed - skill not found', { skillId: id, userId: req.user?.userId });
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const ownerId = skill.owner ? ((skill.owner as any)._id || skill.owner) : null;
    const hasAccess = 
      skill.visibility === 'public' || 
      (ownerId && String(ownerId) === req.user?.userId);

    if (!hasAccess) {
      logger.warn('Get skill failed - access denied', { skillId: id, userId: req.user?.userId, ownerId, visibility: skill.visibility });
      const error = createErrorResponse(ErrorCode.ACCESS_DENIED);
      res.status(error.statusCode).json(error);
      return;
    }

    const skillObj = skill.toObject();
    if (!skillObj.owner) {
      (skillObj as any).owner = {
        _id: undefined,
        username: 'Unknown User',
        avatar: null
      };
    }

    logger.info('Skill retrieved successfully', { skillId: id, userId: req.user?.userId });

    res.json(skillObj);
  } catch (error) {
    logger.error('Get skill failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, skillId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const updateSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, category, tags, visibility, status, updateDescription } = req.body;

    const skill = await Skill.findById(id);
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

    const hasFile = req.file != null;

    if (hasFile) {
      if (!req.file!.originalname.endsWith('.zip')) {
        const error = createErrorResponse(ErrorCode.INVALID_FILE_TYPE);
        res.status(error.statusCode).json(error);
        return;
      }

      const tempDir = path.join(process.cwd(), 'temp', `skill-${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        const validationResult = await validateSkillUpload(req.file!.path, tempDir);
        if (!validationResult.valid) {
          const error = createErrorResponse(ErrorCode.INVALID_SKILL_STRUCTURE, validationResult.errors);
          res.status(error.statusCode).json(error);
          return;
        }

        const fileUrl = getFileUrl(req.file!.filename);
        const nextVersion = await generateNextVersion(skill._id);
        
        const skillVersion = new SkillVersion({
          skillId: skill._id,
          version: nextVersion,
          url: fileUrl,
          filename: req.file!.filename,
          originalName: req.file!.originalname,
          size: req.file!.size,
          mimetype: req.file!.mimetype,
          updateDescription: updateDescription || `Update to version ${nextVersion}`,
        });
        await skillVersion.save();

        const resourceVersion = await createResourceVersion({
          resourceId: skill._id.toString(),
          resourceType: 'skill',
          version: nextVersion,
          content: skill.description || '',
          files: [{
            filename: req.file!.originalname,
            path: fileUrl,
            size: req.file!.size,
            mimetype: req.file!.mimetype,
          }],
          changelog: updateDescription || `Update to version ${nextVersion}`,
          tags: skill.tags || [],
          createdBy: req.user!.userId.toString(),
        });

        skill.version = nextVersion;

        skill.files = [{
          filename: req.file!.originalname,
          originalName: req.file!.originalname,
          path: fileUrl,
          size: req.file!.size,
          mimetype: req.file!.mimetype,
        }];

        if (validationResult.structure) {
          if (validationResult.structure.name) skill.name = validationResult.structure.name;
          if (validationResult.structure.description) skill.description = validationResult.structure.description;
        }
        
        if (!skill.name && validationResult.topLevelDir) {
          skill.name = validationResult.topLevelDir;
          logger.debug('Using top-level directory name as skill name', { name: skill.name });
        }
        
        logger.debug('Skill version created', { skillVersionId: skillVersion._id, version: nextVersion });
      } finally {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    }

    if (name) skill.name = name;
    if (description) skill.description = description;
    if (category) skill.category = category;
    if (tags) skill.tags = tags;
    if (visibility) skill.visibility = visibility;
    
    let autoReviewResult: { passed: boolean; issues?: string[]; warnings?: string[] } | undefined;
    
    if (status === 'approved' || status === 'pending') {
      if (hasFile || skill.files.length > 0) {
        const filePath = hasFile ? req.file!.path : undefined;
        const reviewResult = await reviewSkill({ name: skill.name, description: skill.description, category: skill.category, tags: skill.tags }, filePath);
        autoReviewResult = {
          passed: reviewResult.passed,
          issues: reviewResult.reasons,
          warnings: reviewResult.warnings,
        };
        if (reviewResult.passed) {
          skill.status = 'approved';
        } else {
          skill.status = 'rejected';
        }
        logger.info('Skill update auto review completed', { 
          skillId: skill._id,
          userId: req.user?.userId, 
          passed: reviewResult.passed, 
          status: skill.status 
        });
      } else {
        skill.status = 'draft';
        autoReviewResult = {
          passed: false,
          issues: ['提交审核需要上传文件'],
        };
      }
    } else if (status) {
      skill.status = status;
    }

    if (!skill.name) {
      logger.warn('Update skill failed - name is required', { userId: req.user?.userId, skillId: id });
      const error = createErrorResponse(ErrorCode.NAME_REQUIRED);
      res.status(error.statusCode).json(error);
      return;
    }

    await skill.save();
    res.json({ skill, autoReviewResult });
  } catch (error) {
    logger.error('Update skill failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, skillId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const deleteSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const skill = await Skill.findById(id);
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

    await skill.deleteOne();
    res.json({ message: 'Skill deleted' });
  } catch (error) {
    logger.error('Delete skill failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, skillId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const rateSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const skill = await Skill.findById(id);
    if (!skill) {
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const existingRating = skill.ratings.find(r => String(r.userId) === req.user?.userId);
    if (existingRating) {
      existingRating.rating = rating;
    } else {
      skill.ratings.push({ userId: req.user?.userId as any, rating, createdAt: new Date() });
    }

    skill.averageRating = skill.ratings.reduce((sum, r) => sum + r.rating, 0) / skill.ratings.length;
    await skill.save();
    res.json({ message: 'Rating submitted', averageRating: skill.averageRating });
  } catch (error) {
    logger.error('Rate skill failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, skillId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const uploadSkillFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const skillId = req.body.skillId;
    const updateDescription = req.body.updateDescription;
    
    if (!req.file) {
      const error = createErrorResponse(ErrorCode.NO_FILE_UPLOADED);
      res.status(error.statusCode).json(error);
      return;
    }

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

    if (!req.file.originalname.endsWith('.zip')) {
      const error = createErrorResponse(ErrorCode.INVALID_FILE_TYPE);
      res.status(error.statusCode).json(error);
      return;
    }

    const tempDir = path.join(process.cwd(), 'temp', `skill-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      const validationResult = await validateSkillUpload(req.file.path, tempDir);
      if (!validationResult.valid) {
        const error = createErrorResponse(ErrorCode.INVALID_SKILL_STRUCTURE, validationResult.errors);
        res.status(error.statusCode).json(error);
        return;
      }

      const fileUrl = getFileUrl(req.file.filename);
      const nextVersion = await generateNextVersion(skill._id);
      
      const skillVersion = new SkillVersion({
        skillId: skill._id,
        version: nextVersion,
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        updateDescription: updateDescription || `Update to version ${nextVersion}`,
      });
      await skillVersion.save();

      const resourceVersion = await createResourceVersion({
        resourceId: skill._id.toString(),
        resourceType: 'skill',
        version: nextVersion,
        content: skill.description || '',
        files: [{
          filename: req.file.originalname,
          path: fileUrl,
          size: req.file.size,
          mimetype: req.file.mimetype,
        }],
        changelog: updateDescription || `Update to version ${nextVersion}`,
        tags: skill.tags || [],
        createdBy: req.user!.userId.toString(),
      });

      skill.version = nextVersion;
      skill.files = [{
        filename: req.file.originalname,
        originalName: req.file.originalname,
        path: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      }];

      if (validationResult.structure) {
        if (validationResult.structure.name) skill.name = validationResult.structure.name;
        if (validationResult.structure.description) skill.description = validationResult.structure.description;
      }

      await skill.save();

      res.json({ 
        message: 'File uploaded successfully', 
        url: fileUrl, 
        version: nextVersion,
        structure: validationResult.structure
      });
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    logger.error('Upload skill file failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, skillId: req.body.skillId });
    const err = createErrorResponse(ErrorCode.FILE_UPLOAD_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const downloadSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const skill = await Skill.findById(id);
    if (!skill) {
      const error = createErrorResponse(ErrorCode.SKILL_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const hasAccess =
      skill.visibility === 'public' ||
      String(skill.owner) === req.user?.userId;

    if (!hasAccess) {
      const error = createErrorResponse(ErrorCode.ACCESS_DENIED);
      res.status(error.statusCode).json(error);
      return;
    }

    const latestVersion = await SkillVersion.findOne({ skillId: skill._id }).sort({ createdAt: -1 });
    if (!latestVersion || !latestVersion.url) {
      const error = createErrorResponse(ErrorCode.NO_FILE_AVAILABLE);
      res.status(error.statusCode).json(error);
      return;
    }

    skill.downloads += 1;
    await skill.save();

    const filePath = path.join(process.cwd(), latestVersion.url);
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      const error = createErrorResponse(ErrorCode.FILE_NOT_FOUND);
      res.status(error.statusCode).json(error);
    }
  } catch (error) {
    logger.error('Download skill failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, skillId: req.params.id });
    const err = createErrorResponse(ErrorCode.DOWNLOAD_FAILED);
    res.status(err.statusCode).json(err);
  }
};
