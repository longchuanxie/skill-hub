import { Router, Response } from 'express';
import { authenticateAgent, AgentRequest } from '../middleware/agentAuth';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { SkillVersion } from '../models/SkillVersion';
import { PromptVersion } from '../models/PromptVersion';
import { ResourceVersion } from '../models/ResourceVersion';
import { skillFileUpload } from '../middleware/upload';
import {
  determineResourceStatus,
  incrementVersion,
  createResourceVersion,
  buildSkillFiles,
} from '../utils/resourceHelpers';

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

    const { name, description, category, tags, updateDescription } = req.body;
    const isEnterpriseAgent = !!req.agent.enterpriseId;
    const hasFile = req.file != null;

    if (hasFile && !req.file!.originalname.endsWith('.zip')) {
      res.status(400).json({
        error: 'INVALID_FILE_TYPE',
        message: 'Only ZIP files are allowed'
      });
      return;
    }

    const existingSkill = await Skill.findOne({
      owner: req.agent.owner,
      name: name,
    });

    if (existingSkill) {
      await handleSkillUpdate(req, res, existingSkill, hasFile, isEnterpriseAgent);
      return;
    }

    await handleSkillCreate(req, res, hasFile, isEnterpriseAgent);
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create skill'
    });
  }
});

async function handleSkillCreate(req: AgentRequest, res: Response, hasFile: boolean, isEnterpriseAgent: boolean) {
  const { name, description, category, tags, updateDescription } = req.body;

  const skillData: any = {
    name,
    description,
    category: category || 'general',
    tags: tags || [],
    owner: req.agent.owner,
    visibility: isEnterpriseAgent ? 'enterprise' : 'public',
    version: '1.0.0',
    files: [],
  };

  if (isEnterpriseAgent) {
    skillData.enterpriseId = req.agent.enterpriseId;
  }

  if (hasFile) {
    const fileUrl = `/uploads/${req.file!.filename}`;
    skillData.files = [{
      filename: req.file!.originalname,
      originalName: req.file!.originalname,
      path: fileUrl,
      size: req.file!.size,
      mimetype: req.file!.mimetype,
    }];
  }

  const statusResult = await determineResourceStatus(
    'skill',
    hasFile,
    isEnterpriseAgent,
    req.agent.enterpriseId,
    { ...skillData, filePath: req.file?.path }
  );
  skillData.status = statusResult.status;

  const skill = new Skill(skillData);
  await skill.save();

  const files = hasFile ? skillData.files : [];
  await createResourceVersion({
    resourceId: skill._id,
    resourceType: 'skill',
    version: skill.version,
    content: skill.description || '',
    files,
    changelog: updateDescription || 'Initial version',
    tags: skill.tags || [],
    createdBy: req.agent.owner,
  });

  const response: any = {
    message: 'Skill created successfully',
    skill,
    isNew: true,
    visibility: skillData.visibility,
    status: skillData.status,
  };

  if (hasFile && statusResult.autoReviewResult) {
    response.autoReviewResult = statusResult.autoReviewResult;
  }

  res.status(201).json(response);
}

async function handleSkillUpdate(req: AgentRequest, res: Response, existingSkill: any, hasFile: boolean, isEnterpriseAgent: boolean) {
  const { description, category, tags, updateDescription } = req.body;

  const previousVersion = existingSkill.version;
  const versions = await SkillVersion.find({ skillId: existingSkill._id }).sort({ createdAt: -1 });

  let newVersion: string;
  if (versions.length === 0) {
    newVersion = incrementVersion(previousVersion);
  } else {
    const lastVersion = versions[0].version;
    newVersion = incrementVersion(lastVersion);
  }

  if (hasFile) {
    const fileUrl = `/uploads/${req.file!.filename}`;

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

    existingSkill.files.push({
      filename: req.file!.originalname,
      originalName: req.file!.originalname,
      path: fileUrl,
      size: req.file!.size,
      mimetype: req.file!.mimetype,
    });
  }

  const files = hasFile ? existingSkill.files : [];
  await createResourceVersion({
    resourceId: existingSkill._id,
    resourceType: 'skill',
    version: newVersion,
    content: description || existingSkill.description || '',
    files,
    changelog: updateDescription || `Update to version ${newVersion}`,
    tags: tags || existingSkill.tags || [],
    createdBy: req.agent.owner,
  });

  existingSkill.version = newVersion;
  if (description) existingSkill.description = description;
  if (category) existingSkill.category = category;
  if (tags && tags.length > 0) existingSkill.tags = tags;
  await existingSkill.save();

  res.status(200).json({
    message: 'Skill version updated successfully',
    skill: existingSkill,
    isNew: false,
    previousVersion,
    currentVersion: newVersion,
  });
}

router.post('/prompts', async (req: AgentRequest, res: Response) => {
  try {
    if (!req.agent.permissions.canWrite) {
      res.status(403).json({ error: 'Write permission denied' });
      return;
    }

    const { name, description, content, variables, category, tags, updateDescription } = req.body;
    const isEnterpriseAgent = !!req.agent.enterpriseId;

    const existingPrompt = await Prompt.findOne({
      owner: req.agent.owner,
      name: name,
    });

    if (existingPrompt) {
      await handlePromptUpdate(req, res, existingPrompt, isEnterpriseAgent);
      return;
    }

    await handlePromptCreate(req, res, isEnterpriseAgent);
  } catch (error) {
    console.error('Create prompt error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create prompt'
    });
  }
});

async function handlePromptCreate(req: AgentRequest, res: Response, isEnterpriseAgent: boolean) {
  const { name, description, content, variables, category, tags, updateDescription } = req.body;

  const promptData: any = {
    name,
    description,
    content,
    variables: variables || [],
    category: category || 'general',
    tags: tags || [],
    owner: req.agent.owner,
    visibility: isEnterpriseAgent ? 'enterprise' : 'public',
    version: '1.0.0',
  };

  if (isEnterpriseAgent) {
    promptData.enterpriseId = req.agent.enterpriseId;
  }

  const statusResult = await determineResourceStatus(
    'prompt',
    false,
    isEnterpriseAgent,
    req.agent.enterpriseId,
    promptData
  );
  promptData.status = statusResult.status;

  const prompt = new Prompt(promptData);
  await prompt.save();

  const promptVersion = new PromptVersion({
    promptId: prompt._id,
    version: prompt.version,
    content,
    description,
    variables: variables || [],
    updateDescription: updateDescription || 'Initial version',
  });
  await promptVersion.save();

  await createResourceVersion({
    resourceId: prompt._id,
    resourceType: 'prompt',
    version: prompt.version,
    content,
    files: [],
    changelog: updateDescription || 'Initial version',
    tags: tags || [],
    createdBy: req.agent.owner,
  });

  const response: any = {
    message: 'Prompt created successfully',
    prompt,
    isNew: true,
    visibility: promptData.visibility,
    status: promptData.status,
  };

  if (statusResult.autoReviewResult) {
    response.autoReviewResult = statusResult.autoReviewResult;
  }

  res.status(201).json(response);
}

async function handlePromptUpdate(req: AgentRequest, res: Response, existingPrompt: any, isEnterpriseAgent: boolean) {
  const { description, content, variables, category, tags, updateDescription } = req.body;

  const previousVersion = existingPrompt.version;
  const newVersion = incrementVersion(previousVersion);

  const promptVersion = new PromptVersion({
    promptId: existingPrompt._id,
    version: newVersion,
    content: content || existingPrompt.content,
    description: description || existingPrompt.description,
    variables: variables || existingPrompt.variables,
    updateDescription: updateDescription || `Update to version ${newVersion}`,
  });
  await promptVersion.save();

  await createResourceVersion({
    resourceId: existingPrompt._id,
    resourceType: 'prompt',
    version: newVersion,
    content: content || existingPrompt.content,
    files: [],
    changelog: updateDescription || `Update to version ${newVersion}`,
    tags: tags || existingPrompt.tags || [],
    createdBy: req.agent.owner,
  });

  existingPrompt.version = newVersion;
  if (content) existingPrompt.content = content;
  if (description) existingPrompt.description = description;
  if (variables) existingPrompt.variables = variables;
  if (category) existingPrompt.category = category;
  if (tags && tags.length > 0) existingPrompt.tags = tags;
  await existingPrompt.save();

  res.status(200).json({
    message: 'Prompt version updated successfully',
    prompt: existingPrompt,
    isNew: false,
    previousVersion,
    currentVersion: newVersion,
  });
}

router.get('/check-update', async (req: AgentRequest, res: Response) => {
  try {
    if (!req.agent.permissions.canRead) {
      res.status(403).json({ error: 'Read permission denied' });
      return;
    }

    const { resourceType, name, version } = req.query;

    if (!resourceType || !name || !version) {
      res.status(400).json({
        error: 'MISSING_PARAMETERS',
        message: 'resourceType, name and version are required'
      });
      return;
    }

    if (resourceType !== 'skill' && resourceType !== 'prompt') {
      res.status(400).json({
        error: 'INVALID_RESOURCE_TYPE',
        message: 'resourceType must be "skill" or "prompt"'
      });
      return;
    }

    const isSkill = resourceType === 'skill';
    const filter: any = {
      name: name as string,
    };

    if (req.agent.enterpriseId) {
      filter.enterpriseId = req.agent.enterpriseId;
    } else {
      filter.visibility = 'public';
    }

    const resource = isSkill
      ? await (Skill as any).findOne(filter)
      : await (Prompt as any).findOne(filter);

    if (!resource) {
      res.status(404).json({
        error: 'RESOURCE_NOT_FOUND',
        message: `No ${resourceType} found with the given name`
      });
      return;
    }

    const versionFilter: any = { [`${resourceType}Id`]: resource._id };
    const latestVersionDoc = isSkill
      ? await (SkillVersion as any).findOne(versionFilter).sort({ createdAt: -1 })
      : await (PromptVersion as any).findOne(versionFilter).sort({ createdAt: -1 });

    const resourceVersionFilter: any = { resourceId: resource._id, resourceType };
    const latestResourceVersion = await ResourceVersion.findOne(resourceVersionFilter)
      .sort({ createdAt: -1 });

    const latestVersion = latestVersionDoc?.version || latestResourceVersion?.version || resource.version;

    const hasUpdate = compareVersions(version as string, latestVersion) < 0;

    res.json({
      hasUpdate,
      latestVersion,
      currentVersion: version,
      updateAvailable: hasUpdate,
      changelog: latestResourceVersion?.changelog || latestVersionDoc?.updateDescription || null,
    });
  } catch (error) {
    console.error('Check update error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to check for updates'
    });
  }
});

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
}

export default router;