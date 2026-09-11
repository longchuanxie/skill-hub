import { apiClient } from './client';

export interface CustomPage {
  _id: string;
  pageKey: string;
  title: string;
  content: string;
  language: 'en' | 'zh';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageRequest {
  pageKey: string;
  title: string;
  content: string;
  language: 'en' | 'zh';
}

export interface UpdatePageRequest {
  title?: string;
  content?: string;
  isActive?: boolean;
}

export const customPagesApi = {
  getAllPages: async (): Promise<CustomPage[]> => {
    const response = await apiClient.get('/custom-pages');
    return response.data.data;
  },

  getPageByKey: async (pageKey: string, language: string = 'en'): Promise<CustomPage> => {
    const response = await apiClient.get(`/custom-pages/${pageKey}?language=${language}`);
    return response.data.data;
  },

  createPage: async (data: CreatePageRequest): Promise<CustomPage> => {
    const response = await apiClient.post('/custom-pages', data);
    return response.data.data;
  },

  updatePage: async (id: string, data: UpdatePageRequest): Promise<CustomPage> => {
    const response = await apiClient.put(`/custom-pages/${id}`, data);
    return response.data.data;
  },

  deletePage: async (id: string): Promise<void> => {
    await apiClient.delete(`/custom-pages/${id}`);
  }
};
