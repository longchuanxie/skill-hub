import { Types } from 'mongoose';
import { ResourceVersion, IResourceVersion } from '../models/ResourceVersion';
import { Enterprise } from '../models/Enterprise';
import { reviewSkill, reviewPrompt } from './resourceAutoReview';

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
  resourceId: Types.ObjectId;
  resourceType: 'skill' | 'prompt';
  version: string;
  content: string;
  files: any[];
  changelog: string;
  tags: string[];
  createdBy: Types.ObjectId;
}): Promise<IResourceVersion> {
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

  const fileUrl = `/uploads/${req.file.filename}`;
  return {
    filename: req.file.originalname,
    originalName: req.file.originalname,
    path: fileUrl,
    size: req.file.size,
    mimetype: req.file.mimetype,
  };
}