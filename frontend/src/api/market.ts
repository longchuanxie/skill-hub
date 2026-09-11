import { createApiClient } from './client';

const marketClient = createApiClient();

export interface Skill {
  _id: string;
  name: string;
  description: string;
  owner: {
    _id: string;
    username: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  version: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  visibility: 'public' | 'private' | 'enterprise' | 'shared';
  downloads: number;
  averageRating: number;
  ratingsCount: number;
  likeCount: number;
  favoriteCount: number;
  files: Array<{
    filename: string;
    path: string;
    size: number;
    mimetype: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SkillVersion {
  _id: string;
  skillId: string;
  version: string;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  updateDescription: string;
  createdAt: string;
}

export interface Prompt {
  _id: string;
  name: string;
  description: string;
  content: string;
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
  }>;
  owner: {
    _id: string;
    username: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  visibility: 'public' | 'private' | 'enterprise' | 'shared';
  averageRating: number;
  ratingsCount: number;
  usageCount: number;
  likeCount: number;
  favoriteCount: number;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersion {
  version: string;
  content: string;
  description: string;
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    description?: string;
  }>;
  createdAt: Date;
}

export interface PromptVersionsResponse {
  versions: PromptVersion[];
  currentVersion: string;
}

export interface PromptVersionDiff {
  version1: PromptVersion;
  version2: PromptVersion;
  differences: {
    contentChanged: boolean;
    descriptionChanged: boolean;
    variablesChanged: boolean;
  };
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface SkillsResponse {
  skills: Skill[];
  pagination: PaginationInfo;
}

export interface PromptsResponse {
  prompts: Prompt[];
  pagination: PaginationInfo;
}

export const skillApi = {
  getSkills: async (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    search?: string;
    sort?: string;
  }): Promise<SkillsResponse> => {
    const response = await marketClient.get<SkillsResponse>('/skills', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ data: Skill }> => {
    const response = await marketClient.get<{ data: Skill }>(`/skills/${id}`);
    return response.data;
  },

  getSkillById: async (id: string): Promise<Skill> => {
    const response = await marketClient.get<Skill>(`/skills/${id}`);
    return response.data;
  },

  rateSkill: async (id: string, rating: number): Promise<{ message: string; averageRating: number }> => {
    const response = await marketClient.post<{ message: string; averageRating: number }>(`/skills/${id}/rate`, { rating });
    return response.data;
  },

  deleteSkill: async (id: string): Promise<{ message: string }> => {
    const response = await marketClient.delete<{ message: string }>(`/skills/${id}`);
    return response.data;
  },

  getFileTree: async (id: string) => {
    const response = await marketClient.get(`/skills/${id}/file-tree`);
    return response.data;
  },

  previewFile: async (id: string, filePath: string) => {
    const response = await marketClient.get(`/skills/${id}/preview`, {
      params: { path: filePath }
    });
    return response.data;
  },

  download: async (id: string): Promise<Blob> => {
    const response = await marketClient.get(`/skills/${id}/download`, {
      responseType: 'blob',
      validateStatus: (status) => status < 500 // 允许处理 4xx 错误
    });

    // 检查响应是否是错误 JSON
    if (response.headers['content-type']?.includes('application/json')) {
      // 将 blob 转换为文本读取错误信息
      const text = await response.data.text();
      const error = JSON.parse(text);
      throw new Error(error.error || 'DOWNLOAD_FAILED');
    }

    return response.data;
  },

  downloadSkill: async (id: string): Promise<Blob> => {
    return skillApi.download(id);
  },

  createSkill: async (data: {
    name?: string;
    description?: string;
    updateDescription?: string;
    category: string;
    visibility: string;
    status: string;
    tags: string[];
    author?: string;
    compatibility?: string[];
    file?: File;
  }): Promise<Skill> => {
    const formData = new FormData();
    if (data.name) {
      formData.append('name', data.name);
    }
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.updateDescription) {
      formData.append('updateDescription', data.updateDescription);
    }
    formData.append('category', data.category);
    formData.append('visibility', data.visibility);
    formData.append('status', data.status);
    data.tags.forEach((tag, index) => {
      formData.append(`tags[${index}]`, tag);
    });
    if (data.author) {
      formData.append('author', data.author);
    }
    if (data.compatibility) {
      data.compatibility.forEach((c, index) => {
        formData.append(`compatibility[${index}]`, c);
      });
    }
    if (data.file) {
      formData.append('file', data.file);
    }

    const response = await marketClient.post<Skill>('/skills', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateSkill: async (id: string, data: {
    name?: string;
    description?: string;
    updateDescription?: string;
    category: string;
    visibility: string;
    status: string;
    tags: string[];
    author?: string;
    compatibility?: string[];
    file?: File;
  }): Promise<Skill> => {
    const formData = new FormData();
    if (data.name) {
      formData.append('name', data.name);
    }
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.updateDescription) {
      formData.append('updateDescription', data.updateDescription);
    }
    formData.append('category', data.category);
    formData.append('visibility', data.visibility);
    formData.append('status', data.status);
    data.tags.forEach((tag, index) => {
      formData.append(`tags[${index}]`, tag);
    });
    if (data.author) {
      formData.append('author', data.author);
    }
    if (data.compatibility) {
      data.compatibility.forEach((c, index) => {
        formData.append(`compatibility[${index}]`, c);
      });
    }
    if (data.file) {
      formData.append('file', data.file);
    }

    const response = await marketClient.put<Skill>(`/skills/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getSkillVersions: async (skillId: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ versions: SkillVersion[]; pagination: any }> => {
    const response = await marketClient.get(`/skills/${skillId}/versions`, { params });
    return response.data;
  },

  getSkillVersion: async (skillId: string, versionId: string): Promise<SkillVersion> => {
    const response = await marketClient.get(`/skills/${skillId}/versions/${versionId}`);
    return response.data;
  },

  deleteSkillVersion: async (skillId: string, versionId: string): Promise<{ message: string }> => {
    const response = await marketClient.delete(`/skills/${skillId}/versions/${versionId}`);
    return response.data;
  },
};

export const promptApi = {
  getPrompts: async (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    search?: string;
    sort?: string;
  }): Promise<PromptsResponse> => {
    const response = await marketClient.get<PromptsResponse>('/prompts', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ data: Prompt }> => {
    const response = await marketClient.get<{ data: Prompt }>(`/prompts/${id}`);
    return response.data;
  },

  getPromptById: async (id: string): Promise<Prompt> => {
    const response = await marketClient.get<Prompt>(`/prompts/${id}`);
    return response.data;
  },

  ratePrompt: async (id: string, rating: number): Promise<{ message: string; averageRating: number }> => {
    const response = await marketClient.post<{ message: string; averageRating: number }>(`/prompts/${id}/rate`, { rating });
    return response.data;
  },

  renderPrompt: async (id: string, variables: Record<string, string>): Promise<{ result: string }> => {
    const response = await marketClient.post<{ result: string }>(`/prompts/${id}/render`, { variables });
    return response.data;
  },

  copyPrompt: async (id: string): Promise<Prompt> => {
    const response = await marketClient.post<Prompt>(`/prompts/${id}/copy`);
    return response.data;
  },

  createPrompt: async (data: {
    name: string;
    description: string;
    category: string;
    visibility: string;
    status: string;
    content: string;
    tags: string[];
    updateDescription?: string;
  }): Promise<Prompt> => {
    const response = await marketClient.post<Prompt>('/prompts', data);
    return response.data;
  },

  getVersions: async (id: string): Promise<PromptVersionsResponse> => {
    const response = await marketClient.get<PromptVersionsResponse>(`/prompts/${id}/versions`);
    return response.data;
  },

  rollback: async (id: string, version: string): Promise<{ message: string; rolledBackTo: string; rollbackVersion: string }> => {
    const response = await marketClient.post<{ message: string; rolledBackTo: string; rollbackVersion: string }>(`/prompts/${id}/rollback/${version}`);
    return response.data;
  },

  compare: async (id: string, version1: string, version2: string): Promise<PromptVersionDiff> => {
    const response = await marketClient.get<PromptVersionDiff>(`/prompts/${id}/compare`, {
      params: { version1, version2 }
    });
    return response.data;
  },
};

export const categoryApi = {
  getCategories: async (type: 'skill' | 'prompt'): Promise<string[]> => {
    const response = await marketClient.get<string[]>(`/categories/${type}`);
    return response.data;
  },
};

export interface HomeStats {
  skills: number;
  prompts: number;
  users: number;
  downloads: number;
}

export interface TrendItem {
  id: string;
  type: 'skill' | 'prompt';
  title: string;
  description: string;
  downloads: number;
  rating: number;
  averageRating: number;
  ratingsCount: number;
  trendPercentage: number;
  rank: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrendsData {
  skills: TrendItem[];
  prompts: TrendItem[];
  combined: TrendItem[];
}

export interface TrendsMeta {
  total: number;
  lastUpdated: string;
  cacheDuration: number;
}

export interface TrendsResponse {
  success: boolean;
  data: TrendsData;
  meta: TrendsMeta;
}

export const homeApi = {
  getStats: async (): Promise<HomeStats> => {
    const response = await marketClient.get<{ success: boolean; data: HomeStats }>('/home/stats');
    return response.data.data;
  },
};

export const trendsApi = {
  getTrends: async (params?: {
    type?: 'skills' | 'prompts' | 'combined';
    sort?: 'popular' | 'latest' | 'rating';
    limit?: number;
    timeRange?: 'week' | 'month' | 'year';
  }): Promise<TrendsResponse> => {
    const response = await marketClient.get<TrendsResponse>('/trends', { params });
    return response.data;
  },
};
