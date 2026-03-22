import { Response } from 'express';
import { Prompt } from '../models/Prompt';
import { PromptVersion } from '../models/PromptVersion';
import { ResourceVersion } from '../models/ResourceVersion';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../utils/errors';
import { Types } from 'mongoose';
import { reviewPrompt } from '../utils/resourceAutoReview';

const logger = createLogger('PromptController');

export async function generateNextVersion(promptId: Types.ObjectId): Promise<string> {
  const versions = await PromptVersion.find({ promptId }).sort({ createdAt: -1 });
  
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

export const createPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.info('Creating prompt', { userId: req.user?.userId, name: req.body.name, visibility: req.body.visibility });
    
    const { name, description, content, variables, category, tags, visibility, updateDescription, status } = req.body;

    if (!req.user?.userId) {
      logger.warn('Create prompt failed - unauthorized', { ip: req.ip });
      const error = createErrorResponse(ErrorCode.UNAUTHORIZED);
      res.status(error.statusCode).json(error);
      return;
    }

    let finalStatus: 'draft' | 'pending' | 'approved' | 'rejected' = 'draft';
    let autoReviewResult: { passed: boolean; issues?: string[]; warnings?: string[] } | undefined;

    if (status === 'approved' || status === 'pending') {
      const reviewResult = await reviewPrompt({ name, description, content, category, tags });
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
      logger.info('Prompt auto review completed', { 
        userId: req.user?.userId, 
        passed: reviewResult.passed, 
        status: finalStatus 
      });
    } else {
      finalStatus = 'draft';
    }

    const existingPrompt = await Prompt.findOne({
      owner: req.user?.userId,
      name,
    });

    if (existingPrompt) {
      if (!updateDescription) {
        logger.warn('Create prompt failed - update description required for new version', { userId: req.user?.userId });
        const error = createErrorResponse(ErrorCode.UPDATE_DESCRIPTION_REQUIRED);
        res.status(error.statusCode).json(error);
        return;
      }

      logger.info('Prompt with same name exists, creating new version', {
        promptId: existingPrompt._id,
        name,
        userId: req.user?.userId,
      });

      const previousVersion = existingPrompt.version;
      const newVersion = await generateNextVersion(existingPrompt._id as Types.ObjectId);

      const promptVersion = new PromptVersion({
        promptId: existingPrompt._id,
        version: newVersion,
        content: content || existingPrompt.content,
        description: description || existingPrompt.description,
        variables: variables || existingPrompt.variables,
        updateDescription: updateDescription || `Update to version ${newVersion}`,
      });
      await promptVersion.save();
      logger.debug('Prompt version created', { promptVersionId: promptVersion._id, version: newVersion });

      const resourceVersion = new ResourceVersion({
        resourceId: existingPrompt._id,
        resourceType: 'prompt',
        version: newVersion,
        versionNumber: parseInt(newVersion.split('.').join('')),
        content: content || existingPrompt.content,
        files: [],
        changelog: updateDescription || `Update to version ${newVersion}`,
        tags: tags || existingPrompt.tags || [],
        isActive: true,
        createdBy: req.user!.userId,
      });
      await resourceVersion.save();
      logger.debug('ResourceVersion created for prompt', { resourceVersionId: resourceVersion._id, version: newVersion });

      existingPrompt.version = newVersion;
      if (content) existingPrompt.content = content;
      if (description) existingPrompt.description = description;
      if (variables) existingPrompt.variables = variables;
      if (category) existingPrompt.category = category;
      if (tags && tags.length > 0) existingPrompt.tags = tags;
      if (visibility) existingPrompt.visibility = visibility;

      await existingPrompt.save();

      logger.info('Prompt version updated successfully', {
        promptId: existingPrompt._id,
        previousVersion,
        newVersion,
        userId: req.user?.userId,
      });

      res.status(200).json({
        message: 'Prompt version updated successfully',
        prompt: existingPrompt,
        isNew: false,
        previousVersion,
        currentVersion: newVersion,
      });
      return;
    }

    const prompt = new Prompt({
      name,
      description,
      content,
      variables: variables || [],
      category: category || 'general',
      tags: tags || [],
      owner: req.user?.userId,
      visibility: visibility || 'private',
      status: finalStatus,
      version: '1.0.0',
    });

    await prompt.save();

    const promptVersion = new PromptVersion({
      promptId: prompt._id,
      version: '1.0.0',
      content,
      description,
      variables: variables || [],
      updateDescription: updateDescription || `Initial version`,
    });

    await promptVersion.save();

    const resourceVersion = new ResourceVersion({
      resourceId: prompt._id,
      resourceType: 'prompt',
      version: '1.0.0',
      versionNumber: 1,
      content,
      files: [],
      changelog: updateDescription || `Initial version`,
      tags: tags || [],
      isActive: true,
      createdBy: req.user!.userId,
    });
    await resourceVersion.save();
    logger.debug('ResourceVersion created for prompt', { resourceVersionId: resourceVersion._id, version: resourceVersion.version });
    
    logger.info('Prompt created successfully', { promptId: prompt._id, userId: req.user?.userId, name: prompt.name, visibility: prompt.visibility, status: prompt.status });
    
    res.status(201).json({
      message: 'Prompt created successfully',
      prompt,
      isNew: true,
      autoReviewResult,
    });
  } catch (error) {
    logger.error('Create prompt failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, userId: req.user?.userId });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getPrompts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 12, category, search, sort = 'latest' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

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
    if (search) query.$text = { $search: String(search) };

    let sortOption: any = { createdAt: -1 };
    if (sort === 'popular') sortOption = { usageCount: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1 };

    const [prompts, total] = await Promise.all([
      Prompt.find(query).populate('owner', 'username avatar').skip(skip).limit(Number(pageSize)).sort(sortOption),
      Prompt.countDocuments(query)
    ]);

    res.json({
      prompts,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        pages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    logger.error('Get prompts failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getPromptById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const prompt = await Prompt.findById(id).populate('owner', 'username avatar');
    
    if (!prompt) {
      const error = createErrorResponse(ErrorCode.PROMPT_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const ownerId = (prompt.owner as any)._id || prompt.owner;
    const hasAccess = 
      prompt.visibility === 'public' || 
      String(ownerId) === req.user?.userId;

    if (!hasAccess) {
      const error = createErrorResponse(ErrorCode.ACCESS_DENIED);
      res.status(error.statusCode).json(error);
      return;
    }

    res.json(prompt);
  } catch (error) {
    logger.error('Get prompt failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, promptId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const updatePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { updateDescription, status, ...updates } = req.body;

    const prompt = await Prompt.findById(id);
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

    if (!updateDescription) {
      logger.warn('Update prompt failed - update description required', { userId: req.user?.userId, promptId: id });
      const error = createErrorResponse(ErrorCode.UPDATE_DESCRIPTION_REQUIRED);
      res.status(error.statusCode).json(error);
      return;
    }

    const newVersion = await generateNextVersion(prompt._id as Types.ObjectId);
    const hasContentChanges = updates.content !== undefined && updates.content !== prompt.content;
    const hasDescriptionChanges = updates.description !== undefined && updates.description !== prompt.description;
    const hasVariablesChanges = updates.variables !== undefined && JSON.stringify(updates.variables) !== JSON.stringify(prompt.variables);

    if (hasContentChanges || hasDescriptionChanges || hasVariablesChanges) {
      const promptVersion = new PromptVersion({
        promptId: prompt._id,
        version: newVersion,
        content: updates.content !== undefined ? updates.content : prompt.content,
        description: updates.description !== undefined ? updates.description : prompt.description,
        variables: updates.variables !== undefined ? updates.variables : prompt.variables,
        updateDescription,
      });

      await promptVersion.save();
    }

    Object.assign(prompt, updates);
    if (hasContentChanges || hasDescriptionChanges || hasVariablesChanges) {
      prompt.version = newVersion;
    }

    let autoReviewResult: { passed: boolean; issues?: string[]; warnings?: string[] } | undefined;

    if (status === 'approved' || status === 'pending') {
      const reviewResult = await reviewPrompt({ 
        name: prompt.name, 
        description: prompt.description, 
        content: prompt.content, 
        category: prompt.category, 
        tags: prompt.tags 
      });
      autoReviewResult = {
        passed: reviewResult.passed,
        issues: reviewResult.reasons,
        warnings: reviewResult.warnings,
      };
      if (reviewResult.passed) {
        prompt.status = 'approved';
      } else {
        prompt.status = 'rejected';
      }
      logger.info('Prompt update auto review completed', { 
        promptId: prompt._id,
        userId: req.user?.userId, 
        passed: reviewResult.passed, 
        status: prompt.status 
      });
    } else if (status) {
      prompt.status = status;
    }
    
    await prompt.save();
    res.json({ prompt, autoReviewResult });
  } catch (error) {
    logger.error('Update prompt failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, promptId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const deletePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const prompt = await Prompt.findById(id);
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

    await PromptVersion.deleteMany({ promptId: prompt._id });
    await prompt.deleteOne();
    res.json({ message: 'Prompt deleted' });
  } catch (error) {
    logger.error('Delete prompt failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, promptId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const ratePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const prompt = await Prompt.findById(id);
    if (!prompt) {
      const error = createErrorResponse(ErrorCode.PROMPT_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const existingRating = prompt.ratings.find(r => String(r.userId) === req.user?.userId);
    if (existingRating) {
      existingRating.rating = rating;
    } else {
      prompt.ratings.push({ userId: req.user?.userId as any, rating, createdAt: new Date() });
    }

    if (prompt.ratings.length === 0) {
      prompt.averageRating = 0;
    } else {
      const sum = prompt.ratings.reduce((acc, r) => acc + r.rating, 0);
      prompt.averageRating = Math.round((sum / prompt.ratings.length) * 10) / 10;
    }
    await prompt.save();
    res.json({ message: 'Rating submitted', averageRating: prompt.averageRating });
  } catch (error) {
    logger.error('Rate prompt failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, promptId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const renderPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { variables } = req.body;

    const prompt = await Prompt.findById(id);
    if (!prompt) {
      const error = createErrorResponse(ErrorCode.PROMPT_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    let result = prompt.content;
    for (const [key, value] of Object.entries(variables || {})) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    prompt.usageCount = (prompt.usageCount || 0) + 1;
    await prompt.save();

    res.json({ result });
  } catch (error) {
    logger.error('Render prompt failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, promptId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const copyPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const prompt = await Prompt.findById(id);
    if (!prompt) {
      const error = createErrorResponse(ErrorCode.PROMPT_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const hasAccess =
      prompt.visibility === 'public' ||
      String(prompt.owner) === req.user?.userId;

    if (!hasAccess) {
      const error = createErrorResponse(ErrorCode.ACCESS_DENIED);
      res.status(error.statusCode).json(error);
      return;
    }

    const copiedPrompt = new Prompt({
      name: `${prompt.name} (Copy)`,
      description: prompt.description,
      content: prompt.content,
      variables: prompt.variables,
      category: prompt.category,
      tags: prompt.tags,
      owner: req.user?.userId,
      visibility: 'private',
      version: '1.0.0',
    });

    await copiedPrompt.save();

    const promptVersion = new PromptVersion({
      promptId: copiedPrompt._id,
      version: '1.0.0',
      content: copiedPrompt.content,
      description: copiedPrompt.description,
      variables: copiedPrompt.variables,
      updateDescription: 'Copy of original prompt',
    });

    await promptVersion.save();

    res.json(copiedPrompt);
  } catch (error) {
    logger.error('Copy prompt failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, promptId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const getPromptVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: promptId } = req.params;
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
    logger.error('Get prompt versions failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, promptId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const rollbackPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: promptId, version } = req.params;

    logger.debug('Rolling back prompt', { promptId, version, userId: req.user?.userId });

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

    const targetVersion = await PromptVersion.findOne({ promptId, version });
    if (!targetVersion) {
      const error = createErrorResponse(ErrorCode.PROMPT_VERSION_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const newVersion = await generateNextVersion(prompt._id as Types.ObjectId);

    const promptVersion = new PromptVersion({
      promptId: prompt._id,
      version: newVersion,
      content: targetVersion.content,
      description: targetVersion.description,
      variables: targetVersion.variables,
      updateDescription: `Rollback to version ${version}`,
    });

    await promptVersion.save();

    prompt.content = targetVersion.content;
    prompt.description = targetVersion.description;
    prompt.variables = targetVersion.variables;
    prompt.version = newVersion;

    await prompt.save();

    logger.info('Prompt rolled back successfully', { promptId, version, newVersion, userId: req.user?.userId });

    res.json({
      message: 'Prompt rolled back successfully',
      rolledBackTo: version,
      rollbackVersion: newVersion,
    });
  } catch (error) {
    logger.error('Rollback prompt failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, promptId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};

export const compareVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: promptId } = req.params;
    const { version1, version2 } = req.query;

    logger.debug('Comparing prompt versions', { promptId, version1, version2, userId: req.user?.userId });

    const prompt = await Prompt.findById(promptId);
    if (!prompt) {
      const error = createErrorResponse(ErrorCode.PROMPT_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    const ownerId = (prompt.owner as any)._id || prompt.owner;
    const hasAccess =
      prompt.visibility === 'public' ||
      (ownerId && String(ownerId) === req.user?.userId);

    if (!hasAccess) {
      const error = createErrorResponse(ErrorCode.ACCESS_DENIED);
      res.status(error.statusCode).json(error);
      return;
    }

    const v1 = await PromptVersion.findOne({ promptId, version: version1 as string });
    const v2 = await PromptVersion.findOne({ promptId, version: version2 as string });

    if (!v1 || !v2) {
      const error = createErrorResponse(ErrorCode.PROMPT_VERSION_NOT_FOUND);
      res.status(error.statusCode).json(error);
      return;
    }

    logger.info('Prompt versions compared successfully', { promptId, version1, version2, userId: req.user?.userId });

    res.json({
      version1: v1,
      version2: v2,
    });
  } catch (error) {
    logger.error('Compare prompt versions failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, promptId: req.params.id });
    const err = createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    res.status(err.statusCode).json(err);
  }
};