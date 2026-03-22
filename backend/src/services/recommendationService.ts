import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { UserBehavior } from '../models/UserBehavior';
import { Types } from 'mongoose';

export interface RecommendationOptions {
  type: 'popular' | 'new' | 'similar' | 'personalized';
  resourceType?: 'skill' | 'prompt';
  resourceId?: string;
  limit?: number;
  category?: string;
  enterpriseId?: string;
  userId?: string;
}

export interface ResourceItem {
  _id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  version: string;
  averageRating: number;
  likeCount: number;
  downloads?: number;
  usageCount?: number;
  createdAt: Date;
  similarity?: number;
  qualityScore?: number;
}

function calculateQualityScore(resource: any): number {
  const likeWeight = 0.35;
  const downloadWeight = 0.35;
  const ratingWeight = 0.2;
  const usageWeight = 0.1;

  const likeScore = Math.min(resource.likeCount || 0, 100) / 100;
  const downloadScore = Math.min(resource.downloads || 0, 500) / 500;
  const ratingScore = (resource.averageRating || 0) / 5;
  const usageScore = Math.min(resource.usageCount || 0, 200) / 200;

  return (
    likeScore * likeWeight +
    downloadScore * downloadWeight +
    ratingScore * ratingWeight +
    usageScore * usageWeight
  );
}

async function getPopularSkills(options: RecommendationOptions): Promise<ResourceItem[]> {
  const { limit = 10, category, enterpriseId } = options;

  const query: any = {
    status: 'approved',
    visibility: { $in: ['public', 'enterprise', 'shared'] }
  };

  if (category) {
    query.category = category;
  }

  if (enterpriseId) {
    query.$or = [
      { visibility: 'public' },
      { enterpriseId }
    ];
  }

  const skills = await Skill.find(query)
    .sort({ likeCount: -1, downloads: -1, averageRating: -1 })
    .limit(limit * 2)
    .lean();

  const scored = skills.map(skill => ({
    ...skill,
    qualityScore: calculateQualityScore(skill)
  }));

  return scored
    .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
    .slice(0, limit)
    .map(skill => ({
      _id: skill._id.toString(),
      name: skill.name || '',
      description: skill.description,
      category: skill.category,
      tags: skill.tags || [],
      version: skill.version,
      averageRating: skill.averageRating || 0,
      likeCount: skill.likeCount || 0,
      downloads: skill.downloads || 0,
      usageCount: skill.usageCount || 0,
      createdAt: skill.createdAt,
      qualityScore: skill.qualityScore
    }));
}

async function getPopularPrompts(options: RecommendationOptions): Promise<ResourceItem[]> {
  const { limit = 10, category, enterpriseId } = options;

  const query: any = {
    status: 'approved',
    visibility: { $in: ['public', 'enterprise', 'shared'] }
  };

  if (category) {
    query.category = category;
  }

  if (enterpriseId) {
    query.$or = [
      { visibility: 'public' },
      { enterpriseId }
    ];
  }

  const prompts = await Prompt.find(query)
    .sort({ likeCount: -1, usageCount: -1, averageRating: -1 })
    .limit(limit * 2)
    .lean();

  const scored = prompts.map(prompt => ({
    ...prompt,
    qualityScore: calculateQualityScore(prompt)
  }));

  return scored
    .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
    .slice(0, limit)
    .map(prompt => ({
      _id: prompt._id.toString(),
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
      tags: prompt.tags || [],
      version: prompt.version,
      averageRating: prompt.averageRating || 0,
      likeCount: prompt.likeCount || 0,
      downloads: 0,
      usageCount: prompt.usageCount || 0,
      createdAt: prompt.createdAt,
      qualityScore: prompt.qualityScore
    }));
}

async function getNewResources(options: RecommendationOptions): Promise<ResourceItem[]> {
  const { resourceType = 'skill', limit = 10, category, enterpriseId } = options;

  const query: any = {
    status: 'approved',
    visibility: { $in: ['public', 'enterprise', 'shared'] },
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  };

  if (category) {
    query.category = category;
  }

  if (enterpriseId) {
    query.$or = [
      { visibility: 'public' },
      { enterpriseId }
    ];
  }

  if (resourceType === 'skill' || resourceType === 'prompt') {
    const model: any = resourceType === 'skill' ? Skill : Prompt;
    const resources = await model.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return resources.map((resource: any) => ({
      _id: resource._id.toString(),
      name: resource.name,
      description: resource.description,
      category: resource.category,
      tags: resource.tags || [],
      version: resource.version,
      averageRating: resource.averageRating || 0,
      likeCount: resource.likeCount || 0,
      downloads: resource.downloads || (resource as any).downloads || 0,
      usageCount: (resource as any).usageCount || 0,
      createdAt: resource.createdAt
    }));
  }

  return [];
}

async function getSimilarSkills(resourceId: string, limit: number = 10): Promise<ResourceItem[]> {
  const skill = await Skill.findById(resourceId).lean();

  if (!skill) {
    return [];
  }

  const candidates = await Skill.find({
    _id: { $ne: new Types.ObjectId(resourceId) },
    status: 'approved',
    visibility: { $in: ['public', 'enterprise', 'shared'] },
    category: skill.category
  }).limit(50).lean();

  const targetTags = new Set(skill.tags || []);
  const scored = candidates.map(candidate => {
    const candidateTags = new Set(candidate.tags || []);
    const intersection = [...targetTags].filter(t => candidateTags.has(t));
    const union = new Set([...targetTags, ...candidateTags]);
    const similarity = union.size > 0 ? intersection.length / union.size : 0;

    return {
      ...candidate,
      similarity,
      qualityScore: calculateQualityScore(candidate)
    };
  });

  return scored
    .sort((a, b) => {
      const simDiff = (b.similarity || 0) - (a.similarity || 0);
      if (simDiff !== 0) return simDiff;
      return (b.qualityScore || 0) - (a.qualityScore || 0);
    })
    .slice(0, limit)
    .map(candidate => ({
      _id: candidate._id.toString(),
      name: candidate.name || '',
      description: candidate.description,
      category: candidate.category,
      tags: candidate.tags || [],
      version: candidate.version,
      averageRating: candidate.averageRating || 0,
      likeCount: candidate.likeCount || 0,
      downloads: candidate.downloads || 0,
      usageCount: candidate.usageCount || 0,
      createdAt: candidate.createdAt,
      similarity: candidate.similarity,
      qualityScore: candidate.qualityScore
    }));
}

async function getSimilarPrompts(resourceId: string, limit: number = 10): Promise<ResourceItem[]> {
  const prompt = await Prompt.findById(resourceId).lean();

  if (!prompt) {
    return [];
  }

  const candidates = await Prompt.find({
    _id: { $ne: new Types.ObjectId(resourceId) },
    status: 'approved',
    visibility: { $in: ['public', 'enterprise', 'shared'] },
    category: prompt.category
  }).limit(50).lean();

  const targetTags = new Set(prompt.tags || []);
  const scored = candidates.map(candidate => {
    const candidateTags = new Set(candidate.tags || []);
    const intersection = [...targetTags].filter(t => candidateTags.has(t));
    const union = new Set([...targetTags, ...candidateTags]);
    const similarity = union.size > 0 ? intersection.length / union.size : 0;

    return {
      ...candidate,
      similarity,
      qualityScore: calculateQualityScore(candidate)
    };
  });

  return scored
    .sort((a, b) => {
      const simDiff = (b.similarity || 0) - (a.similarity || 0);
      if (simDiff !== 0) return simDiff;
      return (b.qualityScore || 0) - (a.qualityScore || 0);
    })
    .slice(0, limit)
    .map(candidate => ({
      _id: candidate._id.toString(),
      name: candidate.name,
      description: candidate.description,
      category: candidate.category,
      tags: candidate.tags || [],
      version: candidate.version,
      averageRating: candidate.averageRating || 0,
      likeCount: candidate.likeCount || 0,
      downloads: 0,
      usageCount: candidate.usageCount || 0,
      createdAt: candidate.createdAt,
      similarity: candidate.similarity,
      qualityScore: candidate.qualityScore
    }));
}

async function getPersonalizedResources(options: RecommendationOptions): Promise<ResourceItem[]> {
  const { resourceType = 'skill', limit = 10, userId, category, enterpriseId } = options;

  if (!userId) {
    return getPopularResources(options);
  }

  const userBehaviors = await UserBehavior.find({
    userId: new Types.ObjectId(userId),
    resourceType
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  if (userBehaviors.length === 0) {
    return getPopularResources(options);
  }

  const resourceIds = userBehaviors.map(b => b.resourceId);
  const viewedModel: any = resourceType === 'skill' ? Skill : Prompt;
  const viewedResources = await viewedModel.find({
    _id: { $in: resourceIds }
  }).lean();

  const tagFrequency: Map<string, number> = new Map();
  const categoryCounts: Map<string, number> = new Map();

  viewedResources.forEach((resource: any) => {
    const tags = resource.tags || [];
    tags.forEach((tag: string) => {
      tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
    });
    categoryCounts.set(resource.category, (categoryCounts.get(resource.category) || 0) + 1);
  });

  const topTags = [...tagFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  const mainCategory = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';

  const query: any = {
    _id: { $nin: resourceIds },
    status: 'approved',
    visibility: { $in: ['public', 'enterprise', 'shared'] }
  };

  if (category) {
    query.category = category;
  } else {
    query.category = mainCategory;
  }

  if (enterpriseId) {
    query.$or = [
      { visibility: 'public' },
      { enterpriseId }
    ];
  }

  const model: any = resourceType === 'skill' ? Skill : Prompt;
  const candidates = await model.find(query)
    .limit(limit * 3)
    .lean();

  const scored = candidates.map((candidate: any) => {
    const candidateTags = new Set(candidate.tags || []);
    let tagScore = 0;
    topTags.forEach(tag => {
      if (candidateTags.has(tag)) {
        tagScore += 1;
      }
    });
    const categoryBonus = candidate.category === mainCategory ? 0.3 : 0;

    return {
      ...candidate,
      personalizedScore: tagScore / Math.max(topTags.length, 1) + categoryBonus,
      qualityScore: calculateQualityScore(candidate)
    };
  });

  return scored
    .sort((a: any, b: any) => {
      const scoreDiff = (b.personalizedScore || 0) - (a.personalizedScore || 0);
      if (scoreDiff > 0.1) return scoreDiff;
      return (b.qualityScore || 0) - (a.qualityScore || 0);
    })
    .slice(0, limit)
    .map((candidate: any) => ({
      _id: candidate._id.toString(),
      name: candidate.name,
      description: candidate.description,
      category: candidate.category,
      tags: candidate.tags || [],
      version: candidate.version,
      averageRating: candidate.averageRating || 0,
      likeCount: candidate.likeCount || 0,
      downloads: candidate.downloads || 0,
      usageCount: candidate.usageCount || 0,
      createdAt: candidate.createdAt,
      qualityScore: candidate.qualityScore
    }));
}

async function getPopularResources(options: RecommendationOptions): Promise<ResourceItem[]> {
  const { resourceType = 'skill' } = options;

  if (resourceType === 'skill') {
    return getPopularSkills(options);
  } else if (resourceType === 'prompt') {
    return getPopularPrompts(options);
  }

  const [skills, prompts] = await Promise.all([
    getPopularSkills({ ...options, limit: Math.ceil((options.limit || 10) / 2) }),
    getPopularPrompts({ ...options, limit: Math.floor((options.limit || 10) / 2) })
  ]);

  return [...skills, ...prompts].sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
}

export async function getRecommendations(options: RecommendationOptions): Promise<ResourceItem[]> {
  const { type = 'popular', resourceType = 'skill', resourceId, limit = 10, userId, category, enterpriseId } = options;

  const commonOptions = { type, limit, category, enterpriseId, userId, resourceType };

  switch (type) {
    case 'popular':
      return getPopularResources(commonOptions);

    case 'new':
      return getNewResources(commonOptions);

    case 'similar':
      if (!resourceId) {
        return [];
      }
      if (resourceType === 'skill') {
        return getSimilarSkills(resourceId, limit);
      } else {
        return getSimilarPrompts(resourceId, limit);
      }

    case 'personalized':
      return getPersonalizedResources(commonOptions);

    default:
      return getPopularResources(commonOptions);
  }
}

export async function recordBehavior(
  userId: string,
  resourceType: 'skill' | 'prompt',
  resourceId: string,
  action: 'view' | 'download' | 'favorite' | 'use'
): Promise<void> {
  await UserBehavior.create({
    userId: new Types.ObjectId(userId),
    resourceType,
    resourceId: new Types.ObjectId(resourceId),
    action,
    createdAt: new Date()
  });
}
