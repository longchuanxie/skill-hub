import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ResourceVersion } from '../models/ResourceVersion';
import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { zipAnalyzerService } from '../services/ZipAnalyzerService';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { createLogger } from '../utils/logger';
import { nextVersionNumber } from '../utils/resourceHelpers';
import { canReadResource } from '../utils/resourceAccess';

const logger = createLogger('versionController');

// Read access for version data mirrors the market/detail rule: public
// resources (rejected ones excluded) are readable by anyone, everything
// else only by its owner.
type ResourceDoc = { owner: { toString(): string }; visibility: string; status?: string };

const checkReadAccess = async (
  resource: ResourceDoc,
  userId?: string,
  enterpriseId?: string,
): Promise<boolean> => canReadResource(resource, { userId, enterpriseId });

const loadReadableResource = async (
  resourceType: string,
  resourceId: string,
  userId?: string,
  enterpriseId?: string,
): Promise<ResourceDoc | null | 'denied'> => {
  const resource =
    resourceType === 'skill'
      ? await Skill.findById(resourceId)
      : resourceType === 'prompt'
        ? await Prompt.findById(resourceId)
        : null;

  if (!resource) return null;
  if (!(await checkReadAccess(resource as unknown as ResourceDoc, userId, enterpriseId)))
    return 'denied';
  return resource as unknown as ResourceDoc;
};

export const getVersions = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId, resourceType } = req.params;
    const { page = 1, pageSize = 10, sortBy = 'versionNumber', sortOrder = 'desc' } = req.query;

    const access = await loadReadableResource(
      String(resourceType),
      String(resourceId),
      req.user?.userId,
    );
    if (access === null) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    if (access === 'denied') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const sortField: string =
      sortBy === 'createdBy' ? 'createdBy' : sortBy === 'createdAt' ? 'createdAt' : 'versionNumber';
    const sortDirection: 1 | -1 = sortOrder === 'asc' ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sortField] = sortDirection;

    const [versions, total] = await Promise.all([
      ResourceVersion.find({
        resourceId,
        resourceType,
      })
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(pageSize))
        .populate('createdBy', 'username'),
      ResourceVersion.countDocuments({ resourceId, resourceType }),
    ]);

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
    logger.error('获取版本列表时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch versions',
    });
  }
};

export const getVersion = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId, resourceType, version } = req.params;

    const access = await loadReadableResource(
      String(resourceType),
      String(resourceId),
      req.user?.userId,
    );
    if (access === null) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    if (access === 'denied') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const versionData = await ResourceVersion.findOne({
      resourceId,
      version,
    });

    if (!versionData) {
      return res.status(404).json({
        success: false,
        error: 'Version not found',
      });
    }

    res.json({
      success: true,
      data: versionData,
    });
  } catch (error) {
    logger.error('获取版本详情时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch version',
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
        error: 'Unauthorized',
      });
    }

    const existingResource =
      resourceType === 'skill'
        ? await Skill.findById(resourceId)
        : await Prompt.findById(resourceId);

    if (!existingResource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    if (existingResource.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create version',
      });
    }

    const newVersionNumber = await nextVersionNumber(String(resourceId));

    const newVersion = new ResourceVersion({
      resourceId,
      resourceType,
      version,
      versionNumber: newVersionNumber,
      content,
      files,
      changelog,
      tags: tags || [],
      createdBy: userId,
    });

    await newVersion.save();

    if (resourceType === 'skill') {
      await Skill.findByIdAndUpdate(resourceId, { version });
    } else {
      await Prompt.findByIdAndUpdate(resourceId, { version });
    }

    res.status(201).json({
      success: true,
      data: newVersion,
    });
  } catch (error) {
    logger.error('创建版本时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create version',
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
        error: 'Unauthorized',
      });
    }

    const targetVersion = await ResourceVersion.findOne({
      resourceId,
      version,
    });

    if (!targetVersion) {
      return res.status(404).json({
        success: false,
        error: 'Version not found',
      });
    }

    const resource = (await Skill.findById(resourceId)) || (await Prompt.findById(resourceId));

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    if (resource.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized',
      });
    }

    // Rollback = create a NEW version record carrying the old content.
    // Just patching the main record left download/preview serving the
    // newest SkillVersion/PromptVersion, so the rollback never took effect.
    const rollbackChangelog = `Rollback to version ${targetVersion.version}`;
    const rollbackVersionNumber = await nextVersionNumber(String(resourceId));

    if (targetVersion.resourceType === 'skill') {
      const skill = resource as any;
      const newSemver = await (
        await import('../controllers/SkillController')
      ).generateNextVersion(skill._id);
      if (targetVersion.files?.length > 0) {
        const { SkillVersion } = await import('../models/SkillVersion');
        await SkillVersion.create({
          skillId: skill._id,
          version: newSemver,
          url: targetVersion.files[0].path,
          filename: targetVersion.files[0].filename,
          originalName: targetVersion.files[0].filename,
          size: targetVersion.files[0].size ?? 0,
          mimetype: targetVersion.files[0].mimetype ?? 'application/zip',
          updateDescription: rollbackChangelog,
        });
      }
      await Skill.findByIdAndUpdate(resourceId, {
        version: newSemver,
        description: targetVersion.content || skill.description,
        files: targetVersion.files,
      });
    } else {
      const prompt = resource as any;
      const { PromptVersion } = await import('../models/PromptVersion');
      const nextPromptNumber = (await PromptVersion.countDocuments({ promptId: resourceId })) + 1;
      const newSemver = `1.0.${nextPromptNumber}`;
      await PromptVersion.create({
        promptId: resourceId,
        version: newSemver,
        content: targetVersion.content || prompt.content,
        description: prompt.description,
        variables: prompt.variables || [],
        updateDescription: rollbackChangelog,
      });
      await Prompt.findByIdAndUpdate(resourceId, {
        version: newSemver,
        content: targetVersion.content || prompt.content,
        files: targetVersion.files,
      });
    }

    await ResourceVersion.create({
      resourceId: resource._id,
      resourceType: targetVersion.resourceType,
      version: `rollback-${targetVersion.version}-${Date.now()}`,
      versionNumber: rollbackVersionNumber,
      content: targetVersion.content,
      files: targetVersion.files,
      changelog: rollbackChangelog,
      tags: [],
      createdBy: userId,
      isActive: true,
      fileManifest: targetVersion.fileManifest,
      comparisonStatus: 'completed',
    });

    res.json({
      success: true,
      message: 'Rolled back successfully',
      rolledBackTo: targetVersion.version,
    });
  } catch (error) {
    logger.error('回滚版本时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rollback version',
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
        error: 'Unauthorized',
      });
    }

    const versionData = await ResourceVersion.findOne({
      resourceId,
      version,
    });

    if (!versionData) {
      return res.status(404).json({
        success: false,
        error: 'Version not found',
      });
    }

    const resource = (await Skill.findById(resourceId)) || (await Prompt.findById(resourceId));

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    if (resource.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized',
      });
    }

    if (!versionData.tags.includes(tag)) {
      versionData.tags.push(tag);
      await versionData.save();
    }

    res.json({
      success: true,
      data: versionData,
    });
  } catch (error) {
    logger.error('添加版本标签时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add tag',
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
        error: 'Unauthorized',
      });
    }

    const versionData = await ResourceVersion.findOne({
      resourceId,
      version,
    });

    if (!versionData) {
      return res.status(404).json({
        success: false,
        error: 'Version not found',
      });
    }

    const resource = (await Skill.findById(resourceId)) || (await Prompt.findById(resourceId));

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    if (resource.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized',
      });
    }

    versionData.tags = versionData.tags.filter((t) => t !== tag);
    await versionData.save();

    res.json({
      success: true,
      data: versionData,
    });
  } catch (error) {
    logger.error('删除版本标签时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tag',
    });
  }
};

export const compareVersions = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId, resourceType } = req.params;
    const { from, to } = req.query;

    const access = await loadReadableResource(
      String(resourceType),
      String(resourceId),
      req.user?.userId,
    );
    if (access === null) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    if (access === 'denied') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const [fromVersion, toVersion] = await Promise.all([
      ResourceVersion.findOne({ resourceId, version: from }),
      ResourceVersion.findOne({ resourceId, version: to }),
    ]);

    if (!fromVersion || !toVersion) {
      return res.status(404).json({
        success: false,
        error: 'One or both versions not found',
      });
    }

    const changes: any[] = [];
    const summary = { added: 0, modified: 0, deleted: 0 };

    const fromFiles = new Set(fromVersion.files.map((f) => f.filename));
    const toFiles = new Set(toVersion.files.map((f) => f.filename));

    for (const file of fromVersion.files) {
      if (!toFiles.has(file.filename)) {
        changes.push({
          type: 'deleted',
          path: file.filename,
          oldContent: file.path,
        });
        summary.deleted++;
      }
    }

    for (const file of toVersion.files) {
      if (!fromFiles.has(file.filename)) {
        changes.push({
          type: 'added',
          path: file.filename,
          newContent: file.path,
        });
        summary.added++;
      } else {
        const oldFile = fromVersion.files.find((f) => f.filename === file.filename);
        if (oldFile?.path !== file.path || oldFile?.size !== file.size) {
          changes.push({
            type: 'modified',
            path: file.filename,
            oldContent: oldFile?.path,
            newContent: file.path,
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
        summary,
      },
    });
  } catch (error) {
    logger.error('对比版本时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare versions',
    });
  }
};

export const downloadVersion = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId, version } = req.params;
    const userId = req.user?.userId;

    const versionData = await ResourceVersion.findOne({
      resourceId,
      version,
    });

    if (!versionData) {
      return res.status(404).json({
        success: false,
        error: 'Version not found',
      });
    }

    const resource = (await Skill.findById(resourceId)) || (await Prompt.findById(resourceId));

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
    }

    const hasAccess = await checkReadAccess(
      resource as unknown as ResourceDoc,
      userId,
      req.user?.enterpriseId,
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    if (versionData.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files to download',
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
    logger.error('下载版本时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download version',
    });
  }
};

export const compareVersionsDetailed = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId, resourceType } = req.params;
    const { from, to, files } = req.query;

    const access = await loadReadableResource(
      String(resourceType),
      String(resourceId),
      req.user?.userId,
    );
    if (access === null) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    if (access === 'denied') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const [fromVersion, toVersion] = await Promise.all([
      ResourceVersion.findOne({ resourceId, version: from }),
      ResourceVersion.findOne({ resourceId, version: to }),
    ]);

    if (!fromVersion || !toVersion) {
      return res.status(404).json({
        success: false,
        error: 'One or both versions not found',
      });
    }

    const fromZipPath = fromVersion.files[0]?.path;
    const toZipPath = toVersion.files[0]?.path;

    if (!fromZipPath || !toZipPath) {
      return res.status(400).json({
        success: false,
        error: 'No zip files available for comparison',
      });
    }

    const fullFromPath = path.join(process.cwd(), fromZipPath);
    const fullToPath = path.join(process.cwd(), toZipPath);

    if (!fs.existsSync(fullFromPath) || !fs.existsSync(fullToPath)) {
      return res.status(400).json({
        success: false,
        error: 'Zip file not found',
      });
    }

    const diffResult = await zipAnalyzerService.compareZips(fullFromPath, fullToPath);

    let fileContents: Record<string, { old?: string; new?: string }> | undefined;
    if (files && typeof files === 'string' && files.length > 0) {
      const fileList = files.split(',');
      const [oldContents, newContents] = await Promise.all([
        zipAnalyzerService.extractFiles(fullFromPath, fileList),
        zipAnalyzerService.extractFiles(fullToPath, fileList),
      ]);

      fileContents = {};
      for (const fp of fileList) {
        fileContents[fp] = {
          old: oldContents.get(fp),
          new: newContents.get(fp),
        };
      }
    }

    res.json({
      success: true,
      data: {
        fromVersion: fromVersion.version,
        toVersion: toVersion.version,
        diff: diffResult,
        fileContents,
      },
    });
  } catch (error) {
    logger.error('详细对比版本时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare versions in detail',
    });
  }
};

export const getVersionFileContent = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId, resourceType, version, filePath } = req.params;
    const { encoding = 'utf8' } = req.query;

    const access = await loadReadableResource(
      String(resourceType),
      String(resourceId),
      req.user?.userId,
    );
    if (access === null) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    if (access === 'denied') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const versionData = await ResourceVersion.findOne({ resourceId, version });
    if (!versionData) {
      return res.status(404).json({
        success: false,
        error: 'Version not found',
      });
    }

    const zipPath = versionData.files[0]?.path;
    if (!zipPath) {
      return res.status(400).json({
        success: false,
        error: 'No zip file in this version',
      });
    }

    const fullPath = path.join(process.cwd(), zipPath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        error: 'Zip file not found',
      });
    }

    const decodedFilePath = decodeURIComponent(filePath as string);
    const content = await zipAnalyzerService.extractFileContent(fullPath, decodedFilePath);
    if (content === null) {
      return res.status(404).json({
        success: false,
        error: 'File not found in zip',
      });
    }

    res.json({
      success: true,
      data: {
        path: decodedFilePath,
        content,
        encoding,
      },
    });
  } catch (error) {
    logger.error('获取版本文件内容时出错:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file content',
    });
  }
};
