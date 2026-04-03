import { Types } from 'mongoose';
import { ResourceVersion, IResourceVersion } from '../models/ResourceVersion';
import { Enterprise } from '../models/Enterprise';
import { reviewSkill, reviewPrompt } from './resourceAutoReview';
import { zipAnalyzerService } from '../services/ZipAnalyzerService';
import { getFileUrl } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

export interface ResourceStatusResult {
  status: 'draft' | 'pending' | 'approved';
  autoReviewResult?: { passed: boolean; issues?: string[] };
}

export async function determineResourceStatus(
  resourceType: 'skill' | 'prompt',
  hasFile: boolean,
  isEnterpriseAgent: boolean,
  enterpriseId?: Types.ObjectId,
  resourceData?: any
): Promise<ResourceStatusResult> {
  if (!hasFile) {
    return { status: 'draft' };
  }

  const reviewResult = resourceType === 'skill'
    ? await reviewSkill(resourceData, resourceData?.filePath)
    : await reviewPrompt(resourceData);

  if (isEnterpriseAgent && enterpriseId) {
    if (reviewResult.passed) {
      const enterprise = await Enterprise.findById(enterpriseId);
      if (enterprise?.settings.resourceReview.autoApprove) {
        return { status: 'approved', autoReviewResult: reviewResult };
      }
    }
    return { status: 'pending', autoReviewResult: reviewResult };
  }

  return {
    status: reviewResult.passed ? 'approved' : 'pending',
    autoReviewResult: reviewResult
  };
}

export function incrementVersion(currentVersion: string): string {
  const parts = currentVersion.split('.').map(Number);
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

export async function createResourceVersion(params: {
  resourceId: Types.ObjectId | string;
  resourceType: 'skill' | 'prompt';
  version: string;
  content: string;
  files: any[];
  changelog: string;
  tags: string[];
  createdBy: Types.ObjectId | string;
}): Promise<IResourceVersion> {
  let fileManifest;

  if (params.files && params.files.length > 0) {
    const filePath = path.join(process.cwd(), params.files[0].path);
    if (fs.existsSync(filePath)) {
      try {
        fileManifest = await zipAnalyzerService.extractManifest(filePath);
      } catch (error) {
        console.error('Failed to extract file manifest:', error);
      }
    }
  }

  const resourceVersion = new ResourceVersion({
    resourceId: params.resourceId,
    resourceType: params.resourceType,
    version: params.version,
    versionNumber: parseInt(params.version.split('.').join('')),
    content: params.content,
    files: params.files,
    changelog: params.changelog,
    tags: params.tags,
    isActive: true,
    createdBy: params.createdBy,
    fileManifest,
    comparisonStatus: 'completed',
  });

  await resourceVersion.save();
  return resourceVersion;
}

export interface SkillFileData {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
}

export function buildSkillFiles(req: any): SkillFileData | null {
  if (!req.file) return null;

  if (!req.file.originalname.endsWith('.zip')) {
    return null;
  }

  const fileUrl = getFileUrl(req.file.filename);
  return {
    filename: req.file.originalname,
    originalName: req.file.originalname,
    path: fileUrl,
    size: req.file.size,
    mimetype: req.file.mimetype,
  };
}