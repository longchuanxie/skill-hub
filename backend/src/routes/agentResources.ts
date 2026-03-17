import { Router, Response } from 'express';
import { authenticateAgent, checkAgentPermission, AgentRequest } from '../middleware/agentAuth';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { Enterprise } from '../models/Enterprise';
import { reviewSkill, reviewPrompt } from '../utils/resourceAutoReview';
import { skillFileUpload } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

const router = Router();

router.use(authenticateAgent);

router.get('/skills', async (req: AgentRequest, res: Response) => {
  try {
    if (!req.agent.permissions.canRead) {
      res.status(403).json({ error: 'Read permission denied' });
      return;
    }

    const { page = 1, pageSize = 12, category, search } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const query: any = {
      $or: [
        { visibility: 'public' },
        { owner: req.agent.owner },
        ...(req.agent.enterpriseId ? [{ enterpriseId: req.agent.enterpriseId }] : []),
      ]
    };
    
    if (category) query.category = category;
    if (search) query.$text = { $search: String(search) };

    const [skills, total] = await Promise.all([
      Skill.find(query).populate('owner', 'username avatar').skip(skip).limit(Number(pageSize)),
      Skill.countDocuments(query)
    ]);

    res.json({
      skills,
      pagination: { page: Number(page), pageSize: Number(pageSize), total, pages: Math.ceil(total / Number(pageSize)) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get skills' });
  }
});

router.get('/prompts', async (req: AgentRequest, res: Response) => {
  try {
    if (!req.agent.permissions.canRead) {
      res.status(403).json({ error: 'Read permission denied' });
      return;
    }

    const { page = 1, pageSize = 12, category, search } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const query: any = {
      $or: [
        { visibility: 'public' },
        { owner: req.agent.owner },
        ...(req.agent.enterpriseId ? [{ enterpriseId: req.agent.enterpriseId }] : []),
      ]
    };
    
    if (category) query.category = category;
    if (search) query.$text = { $search: String(search) };

    const [prompts, total] = await Promise.all([
      Prompt.find(query).populate('owner', 'username avatar').skip(skip).limit(Number(pageSize)),
      Prompt.countDocuments(query)
    ]);

    res.json({
      prompts,
      pagination: { page: Number(page), pageSize: Number(pageSize), total, pages: Math.ceil(total / Number(pageSize)) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get prompts' });
  }
});

router.post('/skills', skillFileUpload, async (req: AgentRequest, res: Response) => {
  try {
    if (!req.agent.permissions.canWrite) {
      res.status(403).json({ error: 'Write permission denied' });
      return;
    }

    const { name, description, category, tags, version } = req.body;
    const isEnterpriseAgent = !!req.agent.enterpriseId;

    const skillData: any = {
      name,
      description,
      category: category || 'general',
      tags: tags || [],
      owner: req.agent.owner,
      visibility: isEnterpriseAgent ? 'enterprise' : 'public',
      version: version || '1.0.0',
      versions: [],
      files: [],
    };

    if (isEnterpriseAgent) {
      skillData.enterpriseId = req.agent.enterpriseId;
      skillData.status = 'pending';
    }

    const hasFile = req.file != null;

    if (hasFile) {
      if (!req.file!.originalname.endsWith('.zip')) {
        res.status(400).json({
          error: 'INVALID_FILE_TYPE',
          message: 'Only ZIP files are allowed'
        });
        return;
      }

      const fileUrl = `/uploads/${req.file!.filename}`;
      const newVersion = {
        version: version || '1.0.0',
        url: fileUrl,
        createdAt: new Date(),
      };

      skillData.versions = [newVersion];
      skillData.files = [{
        filename: req.file!.originalname,
        originalName: req.file!.originalname,
        path: fileUrl,
        size: req.file!.size,
        mimetype: req.file!.mimetype,
      }];
    }

    const filePath = hasFile ? req.file!.path : undefined;
    const reviewResult = await reviewSkill(skillData, filePath);

    if (isEnterpriseAgent) {
      if (reviewResult.passed) {
        const enterprise = await Enterprise.findById(req.agent.enterpriseId);
        if (enterprise?.settings.resourceReview.autoApprove) {
          skillData.status = 'approved';
        }
      }
    } else {
      skillData.status = reviewResult.passed ? 'approved' : 'pending';
    }

    const skill = new Skill(skillData);
    await skill.save();

    res.status(201).json({
      message: 'Skill created successfully',
      skill,
      visibility: skillData.visibility,
      status: skillData.status,
      autoReviewResult: reviewResult,
    });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create skill'
    });
  }
});

router.post('/prompts', async (req: AgentRequest, res: Response) => {
  try {
    if (!req.agent.permissions.canWrite) {
      res.status(403).json({ error: 'Write permission denied' });
      return;
    }

    const { name, description, content, variables, category, tags, version } = req.body;
    const isEnterpriseAgent = !!req.agent.enterpriseId;

    const promptData: any = {
      name,
      description,
      content,
      variables: variables || [],
      category: category || 'general',
      tags: tags || [],
      owner: req.agent.owner,
      visibility: isEnterpriseAgent ? 'enterprise' : 'public',
      version: version || '1.0.0',
    };

    if (isEnterpriseAgent) {
      promptData.enterpriseId = req.agent.enterpriseId;
      promptData.status = 'pending';
    }

    const reviewResult = await reviewPrompt(promptData);

    if (isEnterpriseAgent) {
      if (reviewResult.passed) {
        const enterprise = await Enterprise.findById(req.agent.enterpriseId);
        if (enterprise?.settings.resourceReview.autoApprove) {
          promptData.status = 'approved';
        }
      }
    } else {
      promptData.status = reviewResult.passed ? 'approved' : 'pending';
    }

    const prompt = new Prompt(promptData);
    await prompt.save();

    res.status(201).json({
      message: 'Prompt created successfully',
      prompt,
      visibility: promptData.visibility,
      status: promptData.status,
      autoReviewResult: reviewResult,
    });
  } catch (error) {
    console.error('Create prompt error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create prompt'
    });
  }
});

export default router;
