import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ResourceVersion } from '../models/ResourceVersion';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';

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
    const { version, content, files, changelog, tags } = req.body;
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
      tags: tags || [],
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

export const addVersionTag = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId, version } = req.params;
    const { tag } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

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

    if (!versionData.tags.includes(tag)) {
      versionData.tags.push(tag);
      await versionData.save();
    }

    res.json({
      success: true,
      data: versionData
    });
  } catch (error) {
    console.error('添加版本标签时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add tag'
    });
  }
};

export const deleteVersionTag = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId, version, tag } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

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

    versionData.tags = versionData.tags.filter(t => t !== tag);
    await versionData.save();

    res.json({
      success: true,
      data: versionData
    });
  } catch (error) {
    console.error('删除版本标签时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tag'
    });
  }
};

export const compareVersions = async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.params;
    const { from, to } = req.query;

    const [fromVersion, toVersion] = await Promise.all([
      ResourceVersion.findOne({ resourceId, version: from }),
      ResourceVersion.findOne({ resourceId, version: to })
    ]);

    if (!fromVersion || !toVersion) {
      return res.status(404).json({
        success: false,
        error: 'One or both versions not found'
      });
    }

    const changes: any[] = [];
    const summary = { added: 0, modified: 0, deleted: 0 };

    const fromFiles = new Set(fromVersion.files.map(f => f.filename));
    const toFiles = new Set(toVersion.files.map(f => f.filename));

    for (const file of fromVersion.files) {
      if (!toFiles.has(file.filename)) {
        changes.push({
          type: 'deleted',
          path: file.filename,
          oldContent: file.path
        });
        summary.deleted++;
      }
    }

    for (const file of toVersion.files) {
      if (!fromFiles.has(file.filename)) {
        changes.push({
          type: 'added',
          path: file.filename,
          newContent: file.path
        });
        summary.added++;
      } else {
        const oldFile = fromVersion.files.find(f => f.filename === file.filename);
        if (oldFile?.path !== file.path || oldFile?.size !== file.size) {
          changes.push({
            type: 'modified',
            path: file.filename,
            oldContent: oldFile?.path,
            newContent: file.path
          });
          summary.modified++;
        }
      }
    }

    res.json({
      success: true,
      data: {
        fromVersion: fromVersion.version,
        toVersion: toVersion.version,
        changes,
        summary
      }
    });
  } catch (error) {
    console.error('对比版本时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare versions'
    });
  }
};

export const downloadVersion = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId, version } = req.params;
    const userId = req.user?.userId;

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

    const resource = await Skill.findById(resourceId) || await Prompt.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    const hasAccess =
      resource.visibility === 'public' ||
      (userId && resource.owner.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (versionData.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files to download'
      });
    }

    const zip = new AdmZip();
    
    for (const file of versionData.files) {
      const filePath = path.join(process.cwd(), file.path);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath);
        zip.addFile(file.filename, fileContent);
      }
    }

    const zipName = `${resource.name || 'resource'}-${version}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
    
    zip.toBuffer((buffer) => {
      res.send(buffer);
    });
  } catch (error) {
    console.error('下载版本时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download version'
    });
  }
};
