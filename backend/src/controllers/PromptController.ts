import { Response } from 'express';
import { Prompt } from '../models/Prompt';
import { AuthRequest } from '../middleware/auth';

export const createPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, content, variables, category, tags, visibility, version } = req.body;

    // 验证用户已登录
    if (!req.user?.userId) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User must be logged in to create a prompt'
      });
      return;
    }

    const initialVersion = version || '1.0.0';
    
    const prompt = new Prompt({
      name,
      description,
      content,
      variables: variables || [],
      category: category || 'general',
      tags: tags || [],
      owner: req.user?.userId,
      visibility: visibility || 'private',
      version: initialVersion,
      versions: [{
        version: initialVersion,
        content,
        description,
        variables: variables || [],
        createdAt: new Date(),
      }],
    });

    await prompt.save();
    res.status(201).json(prompt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create prompt' });
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
    res.status(500).json({ error: 'Failed to get prompts' });
  }
};

export const getPromptById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const prompt = await Prompt.findById(id).populate('owner', 'username avatar');
    
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }

    const ownerId = (prompt.owner as any)._id || prompt.owner;
    const hasAccess = 
      prompt.visibility === 'public' || 
      String(ownerId) === req.user?.userId;

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get prompt' });
  }
};

export const updatePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const prompt = await Prompt.findById(id);
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }

    if (String(prompt.owner) !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const newVersion = updates.version || prompt.version;
    const hasContentChanges = updates.content !== undefined && updates.content !== prompt.content;
    const hasDescriptionChanges = updates.description !== undefined && updates.description !== prompt.description;
    const hasVariablesChanges = updates.variables !== undefined && JSON.stringify(updates.variables) !== JSON.stringify(prompt.variables);

    if (hasContentChanges || hasDescriptionChanges || hasVariablesChanges) {
      prompt.versions.push({
        version: newVersion,
        content: updates.content !== undefined ? updates.content : prompt.content,
        description: updates.description !== undefined ? updates.description : prompt.description,
        variables: updates.variables !== undefined ? updates.variables : prompt.variables,
        createdAt: new Date(),
      });
    }

    Object.assign(prompt, updates);
    prompt.version = newVersion;
    
    await prompt.save();
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prompt' });
  }
};

export const deletePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const prompt = await Prompt.findById(id);
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }

    if (String(prompt.owner) !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await prompt.deleteOne();
    res.json({ message: 'Prompt deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
};

export const ratePrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const prompt = await Prompt.findById(id);
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }

    const existingRating = prompt.ratings.find(r => String(r.userId) === req.user?.userId);
    if (existingRating) {
      existingRating.rating = rating;
    } else {
      prompt.ratings.push({ userId: req.user?.userId as any, rating, createdAt: new Date() });
    }

    prompt.averageRating = prompt.ratings.reduce((sum, r) => sum + r.rating, 0) / prompt.ratings.length;
    await prompt.save();
    res.json({ message: 'Rating submitted', averageRating: prompt.averageRating });
  } catch (error) {
    res.status(500).json({ error: 'Failed to rate prompt' });
  }
};

export const renderPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { variables } = req.body;

    const prompt = await Prompt.findById(id);
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }

    let content = prompt.content;
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      }
    }

    prompt.usageCount += 1;
    await prompt.save();

    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to render prompt' });
  }
};

export const copyPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const originalPrompt = await Prompt.findById(id);
    if (!originalPrompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }

    const hasAccess = 
      originalPrompt.visibility === 'public' || 
      String(originalPrompt.owner) === req.user?.userId;

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const newPrompt = new Prompt({
      name: `${originalPrompt.name} (Copy)`,
      description: originalPrompt.description,
      content: originalPrompt.content,
      variables: originalPrompt.variables,
      category: originalPrompt.category,
      tags: originalPrompt.tags,
      owner: req.user?.userId,
      visibility: 'private',
      version: '1.0.0',
      versions: [{
        version: '1.0.0',
        content: originalPrompt.content,
        description: originalPrompt.description,
        variables: originalPrompt.variables,
        createdAt: new Date(),
      }],
    });

    await newPrompt.save();
    res.status(201).json(newPrompt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to copy prompt' });
  }
};

export const getPromptVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const prompt = await Prompt.findById(id);
    
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }

    const ownerId = (prompt.owner as any)._id || prompt.owner;
    const hasAccess = 
      prompt.visibility === 'public' || 
      String(ownerId) === req.user?.userId;

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      versions: prompt.versions,
      currentVersion: prompt.version,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get prompt versions' });
  }
};

export const rollbackPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, version } = req.params;

    const prompt = await Prompt.findById(id);
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }

    if (String(prompt.owner) !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const targetVersion = prompt.versions.find(v => v.version === version);
    if (!targetVersion) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }

    const rollbackVersion = `${version}-rollback-${Date.now()}`;
    
    prompt.versions.push({
      version: rollbackVersion,
      content: prompt.content,
      description: prompt.description,
      variables: prompt.variables,
      createdAt: new Date(),
    });

    prompt.content = targetVersion.content;
    prompt.description = targetVersion.description;
    prompt.variables = targetVersion.variables;
    prompt.version = `${version}-restored`;

    await prompt.save();
    res.json({
      message: 'Prompt rolled back successfully',
      prompt,
      rolledBackTo: version,
      rollbackVersion,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to rollback prompt' });
  }
};

export const compareVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { version1, version2 } = req.query;

    console.log('Comparing versions:', { id, version1, version2 });

    const prompt = await Prompt.findById(id);
    if (!prompt) {
      console.log('Prompt not found:', id);
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }

    console.log('Prompt found, versions count:', prompt.versions?.length || 0);
    console.log('Available versions:', prompt.versions?.map(v => v.version));

    const ownerId = (prompt.owner as any)._id || prompt.owner;
    const hasAccess = 
      prompt.visibility === 'public' || 
      String(ownerId) === req.user?.userId;

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (!prompt.versions || !Array.isArray(prompt.versions)) {
      console.log('Prompt has no versions array');
      res.status(404).json({ error: 'No versions found for this prompt' });
      return;
    }

    // Helper function to get version data (from versions array or current prompt)
    const getVersionData = (version: string): any => {
      // First check in versions array
      const versionFromHistory = prompt.versions.find(v => v.version === version);
      if (versionFromHistory) {
        return versionFromHistory;
      }
      
      // If not found and it matches current version, use current prompt data
      if (version === prompt.version) {
        return {
          version: prompt.version,
          content: prompt.content,
          description: prompt.description,
          variables: prompt.variables,
          createdAt: prompt.updatedAt || prompt.createdAt,
        };
      }
      
      return null;
    };

    const v1 = getVersionData(version1 as string);
    const v2 = getVersionData(version2 as string);

    console.log('Version 1 found:', !!v1, 'Version 2 found:', !!v2);
    console.log('Looking for:', { version1, version2, currentVersion: prompt.version });

    if (!v1 || !v2) {
      res.status(404).json({ error: 'One or both versions not found' });
      return;
    }

    const diff = {
      version1: {
        version: v1.version,
        content: v1.content,
        description: v1.description,
        variables: v1.variables,
        createdAt: v1.createdAt,
      },
      version2: {
        version: v2.version,
        content: v2.content,
        description: v2.description,
        variables: v2.variables,
        createdAt: v2.createdAt,
      },
      differences: {
        contentChanged: v1.content !== v2.content,
        descriptionChanged: v1.description !== v2.description,
        variablesChanged: JSON.stringify(v1.variables) !== JSON.stringify(v2.variables),
      },
    };

    console.log('Comparison successful');
    res.json(diff);
  } catch (error) {
    console.error('Error comparing versions:', error);
    res.status(500).json({ error: 'Failed to compare versions' });
  }
};
