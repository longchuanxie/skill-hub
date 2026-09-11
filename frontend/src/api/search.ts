import { createApiClient } from './client';

const searchClient = createApiClient();

export interface SearchResult {
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
  owner?: {
    _id: string;
    username: string;
    avatar?: string;
  };
}

export interface SearchResponse {
  success: boolean;
  data: {
    skills: {
      items: SearchResult[];
      total: number;
      page: number;
      totalPages: number;
    };
    prompts: {
      items: SearchResult[];
      total: number;
      page: number;
      totalPages: number;
    };
  };
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

export interface SuggestionsResponse {
  success: boolean;
  data: SuggestionResult[];
}

export interface SearchParams {
  q: string;
  type?: 'skill' | 'prompt' | 'all';
  category?: string;
  page?: number;
  limit?: number;
  sort?: 'relevance' | 'latest' | 'popular';
}

export const searchApi = {
  search: async (params: SearchParams): Promise<SearchResponse> => {
    const response = await searchClient.get<SearchResponse>('/search', { params });
    return response.data;
  },

  getSuggestions: async (q: string, limit: number = 10): Promise<SuggestionResult[]> => {
    const response = await searchClient.get<SuggestionsResponse>('/search/suggestions', {
      params: { q, limit }
    });
    return response.data.data;
  },

  logSearch: async (keyword: string, type: string = 'search'): Promise<void> => {
    await searchClient.post('/search/log', { keyword, type });
  },

  getSearchHistory: async (): Promise<string[]> => {
    const response = await searchClient.get<{ success: boolean; data: string[] }>('/search/history');
    return response.data.data;
  },

  clearSearchHistory: async (): Promise<void> => {
    await searchClient.delete('/search/history');
  }
};
