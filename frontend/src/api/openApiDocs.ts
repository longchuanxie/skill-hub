import { apiClient } from './client';
import { ApiCategory } from '../types/openapi';

export const openApiDocsApi = {
  getApiDocs: async (): Promise<ApiCategory[]> => {
    const response = await apiClient.get('/docs');
    return response.data.data;
  },
};
