import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ResourceVersion } from '../models/ResourceVersion';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';

export const getVersions = async (req: Request, res: Response) => {
  try {
    const { resourceId, resourceType } = req.params;

    const versions = await ResourceVersion.find({ 
      resourceId,
      resourceType 
    }).sort({ versionNumber: -1 });

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('获取版本列表时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch versions'
    });
  }
};

export const getVersion = async (req: Request, res: Response) => {
  try {
    const { resourceId, version } = req.params;

    const versionData = await ResourceVersion.findOne({ 
      resourceId,
      version 
    });

    if (!versionData) {
      return res.status(404).json({
        success: false,
        error: 'Version not found'
      });
    }

    res.json({
      success: true,
      data: versionData
    });
  } catch (error) {
    console.error('获取版本详情时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch version'
    });
  }
};

export const createVersion = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId, resourceType } = req.params;
    const { version, content, files, changelog } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const existingResource = resourceType === 'skill' 
      ? await Skill.findById(resourceId)
      : await Prompt.findById(resourceId);

    if (!existingResource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    if (existingResource.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create version'
      });
    }

    const existingVersions = await ResourceVersion.find({ resourceId }).sort({ versionNumber: -1 });
    const latestVersion = existingVersions[0];
    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const newVersion = new ResourceVersion({
      resourceId,
      resourceType,
      version,
      versionNumber: newVersionNumber,
      content,
      files,
      changelog,
      createdBy: userId
    });

    await newVersion.save();

    if (resourceType === 'skill') {
      await Skill.findByIdAndUpdate(resourceId, { version });
    } else {
      await Prompt.findByIdAndUpdate(resourceId, { version });
    }

    res.status(201).json({
      success: true,
      data: newVersion
    });
  } catch (error) {
    console.error('创建版本时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create version'
    });
  }
};

export const rollbackVersion = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId, version } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const targetVersion = await ResourceVersion.findOne({ 
      resourceId,
      version 
    });

    if (!targetVersion) {
      return res.status(404).json({
        success: false,
        error: 'Version not found'
      });
    }

    const resource = await Skill.findById(resourceId) || await Prompt.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    if (resource.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    if (targetVersion.resourceType === 'skill') {
      await Skill.findByIdAndUpdate(resourceId, { 
        version: targetVersion.version,
        description: targetVersion.content,
        files: targetVersion.files
      });
    } else {
      await Prompt.findByIdAndUpdate(resourceId, { 
        version: targetVersion.version,
        content: targetVersion.content,
        files: targetVersion.files
      });
    }

    res.json({
      success: true,
      message: 'Rolled back successfully'
    });
  } catch (error) {
    console.error('回滚版本时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rollback version'
    });
  }
};
