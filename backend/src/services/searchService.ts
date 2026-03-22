import { Skill } from '../models/Skill';
import { Prompt } from '../models/Prompt';
import { User } from '../models/User';

export interface SearchOptions {
  query: string;
  resourceType?: 'skill' | 'prompt' | 'all';
  category?: string;
  page?: number;
  limit?: number;
  sort?: 'relevance' | 'latest' | 'popular';
  status?: string;
  visibility?: string;
  enterpriseId?: string;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SearchResponse {
  skills: SearchResult<any>;
  prompts: SearchResult<any>;
  meta: {
    query: string;
    took: number;
    totalResults: number;
  };
}

export interface SuggestionResult {
  text: string;
  type: 'skill' | 'prompt';
  resourceId: string;
}

export async function searchSkills(options: SearchOptions): Promise<{ items: any[]; total: number; textScores?: Map<string, number> }> {
  const {
    query,
    category,
    page = 1,
    limit = 20,
    sort = 'relevance',
    status = 'approved',
    visibility = 'public',
    enterpriseId
  } = options;

  const startTime = Date.now();
  const skip = (page - 1) * limit;

  const searchQuery: any = {
    $text: { $search: query },
    status,
    visibility: { $in: [visibility, 'enterprise', 'shared'] }
  };

  if (category) {
    searchQuery.category = category;
  }

  if (enterpriseId) {
    searchQuery.$or = [
      { visibility: 'public' },
      { enterpriseId }
    ];
  }

  let sortOption: any;
  if (sort === 'relevance') {
    sortOption = { score: { $meta: 'textScore' } };
  } else if (sort === 'latest') {
    sortOption = { createdAt: -1 };
  } else if (sort === 'popular') {
    sortOption = { downloads: -1, likeCount: -1 };
  } else {
    sortOption = { score: { $meta: 'textScore' } };
  }

  const [items, total, textScores] = await Promise.all([
    Skill.find(
      searchQuery,
      sort === 'relevance' ? { score: { $meta: 'textScore' } } : {}
    )
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Skill.countDocuments(searchQuery),
    sort === 'relevance'
      ? getTextScores(Skill, searchQuery, query)
      : Promise.resolve(new Map<string, number>())
  ]);

  return { items, total, textScores };
}

export async function searchPrompts(options: SearchOptions): Promise<{ items: any[]; total: number; textScores?: Map<string, number> }> {
  const {
    query,
    category,
    page = 1,
    limit = 20,
    sort = 'relevance',
    status = 'approved',
    visibility = 'public',
    enterpriseId
  } = options;

  const skip = (page - 1) * limit;

  const searchQuery: any = {
    $text: { $search: query },
    status,
    visibility: { $in: [visibility, 'enterprise', 'shared'] }
  };

  if (category) {
    searchQuery.category = category;
  }

  if (enterpriseId) {
    searchQuery.$or = [
      { visibility: 'public' },
      { enterpriseId }
    ];
  }

  let sortOption: any;
  if (sort === 'relevance') {
    sortOption = { score: { $meta: 'textScore' } };
  } else if (sort === 'latest') {
    sortOption = { createdAt: -1 };
  } else if (sort === 'popular') {
    sortOption = { usageCount: -1, likeCount: -1 };
  } else {
    sortOption = { score: { $meta: 'textScore' } };
  }

  const [items, total, textScores] = await Promise.all([
    Prompt.find(
      searchQuery,
      sort === 'relevance' ? { score: { $meta: 'textScore' } } : {}
    )
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Prompt.countDocuments(searchQuery),
    sort === 'relevance'
      ? getTextScores(Prompt, searchQuery, query)
      : Promise.resolve(new Map<string, number>())
  ]);

  return { items, total, textScores };
}

async function getTextScores(
  model: any,
  query: any,
  searchQuery: string
): Promise<Map<string, number>> {
  const results = await model
    .find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .select('_id')
    .lean();

  const textScores = new Map<string, number>();
  results.forEach((doc: any) => {
    textScores.set(doc._id.toString(), doc.score || 0);
  });

  return textScores;
}

export async function search(query: string, options: Omit<SearchOptions, 'query'> = {}): Promise<SearchResponse> {
  const startTime = Date.now();
  const { resourceType = 'all', ...restOptions } = options;

  const searchOptions = { query, ...restOptions };

  let skillsResult = { items: [] as any[], total: 0 };
  let promptsResult = { items: [] as any[], total: 0 };

  if (resourceType === 'all' || resourceType === 'skill') {
    skillsResult = await searchSkills(searchOptions);
  }

  if (resourceType === 'all' || resourceType === 'prompt') {
    promptsResult = await searchPrompts(searchOptions);
  }

  const took = Date.now() - startTime;

  return {
    skills: {
      items: skillsResult.items,
      total: skillsResult.total,
      page: searchOptions.page || 1,
      totalPages: Math.ceil(skillsResult.total / (searchOptions.limit || 20))
    },
    prompts: {
      items: promptsResult.items,
      total: promptsResult.total,
      page: searchOptions.page || 1,
      totalPages: Math.ceil(promptsResult.total / (searchOptions.limit || 20))
    },
    meta: {
      query,
      took,
      totalResults: skillsResult.total + promptsResult.total
    }
  };
}

export async function getSearchSuggestions(
  query: string,
  limit: number = 10
): Promise<SuggestionResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const suggestions: SuggestionResult[] = [];
  const searchRegex = new RegExp(query.split('').join('.*'), 'i');

  const [skills, prompts] = await Promise.all([
    Skill.find({
      $text: { $search: query },
      status: 'approved',
      visibility: 'public'
    })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('_id name tags')
      .lean(),
    Prompt.find({
      $text: { $search: query },
      status: 'approved',
      visibility: 'public'
    })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('_id name tags')
      .lean()
  ]);

  skills.forEach((skill: any) => {
    suggestions.push({
      text: skill.name,
      type: 'skill',
      resourceId: skill._id.toString()
    });
  });

  prompts.forEach((prompt: any) => {
    suggestions.push({
      text: prompt.name,
      type: 'prompt',
      resourceId: prompt._id.toString()
    });
  });

  return suggestions.slice(0, limit);
}

export function highlightMatches(text: string, query: string): string {
  if (!text || !query) {
    return text;
  }

  const words = query.trim().split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) {
    return text;
  }

  const pattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

  return text.replace(regex, '<em>$1</em>');
}

export function calculateQualityScore(resource: any): number {
  const likeWeight = 0.3;
  const downloadWeight = 0.3;
  const ratingWeight = 0.2;
  const usageWeight = 0.2;

  const likeScore = Math.min(resource.likeCount || 0, 100) / 100;
  const downloadScore = Math.min(resource.downloads || 0, 500) / 500;
  const ratingScore = (resource.averageRating || 0) / 5;
  const usageScore = Math.min(resource.usageCount || 0, 200) / 200;

  return (
    likeScore * likeWeight +
    downloadScore * downloadWeight +
    ratingScore * ratingWeight +
    usageScore * usageWeight
  ) * 100;
}
