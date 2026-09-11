import { createApiClient } from './client';

const recommendationClient = createApiClient();

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
  createdAt: string;
  similarity?: number;
  qualityScore?: number;
}

export interface RecommendationResponse {
  success: boolean;
  data: ResourceItem[];
  meta: {
    type: 'popular' | 'new' | 'similar' | 'personalized';
    resourceType: 'skill' | 'prompt';
    count: number;
  };
}

export interface BehaviorRequest {
  resourceType: 'skill' | 'prompt';
  resourceId: string;
  action: 'view' | 'download' | 'favorite' | 'use';
}

export interface RecommendationParams {
  type: 'popular' | 'new' | 'similar' | 'personalized';
  resourceType?: 'skill' | 'prompt';
  resourceId?: string;
  limit?: number;
  category?: string;
}

export const recommendationApi = {
  getRecommendations: async (params: RecommendationParams): Promise<ResourceItem[]> => {
    const response = await recommendationClient.get<RecommendationResponse>('/recommendations', { params });
    return response.data.data;
  },

  logBehavior: async (data: BehaviorRequest): Promise<void> => {
    await recommendationClient.post('/recommendations/behavior', data);
  },

  getPopular: async (resourceType: 'skill' | 'prompt' = 'skill', limit: number = 10): Promise<ResourceItem[]> => {
    return recommendationApi.getRecommendations({ type: 'popular', resourceType, limit });
  },

  getNew: async (resourceType: 'skill' | 'prompt' = 'skill', limit: number = 10): Promise<ResourceItem[]> => {
    return recommendationApi.getRecommendations({ type: 'new', resourceType, limit });
  },

  getSimilar: async (resourceType: 'skill' | 'prompt', resourceId: string, limit: number = 10): Promise<ResourceItem[]> => {
    return recommendationApi.getRecommendations({ type: 'similar', resourceType, resourceId, limit });
  },

  getPersonalized: async (resourceType: 'skill' | 'prompt' = 'skill', limit: number = 10): Promise<ResourceItem[]> => {
    return recommendationApi.getRecommendations({ type: 'personalized', resourceType, limit });
  }
};
