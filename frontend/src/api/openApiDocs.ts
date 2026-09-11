import { apiClient } from './client';
import { ApiResponse } from '../types/api';
import { ApiCategory } from '../types/openapi';

export const openApiDocsApi = {
  getApiDocs: async (): Promise<ApiCategory[]> => {
    const response = await apiClient.get('/docs');
    return response.data.data;
  },
};
