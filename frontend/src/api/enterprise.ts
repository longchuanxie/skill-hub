import { apiClient } from './client';

export interface AuthSettings {
  passwordLoginEnabled: boolean;
  oauthRequired: boolean;
}

export interface ResourceReviewSettings {
  autoApprove: boolean;
  enableContentFilter: boolean;
}

export const enterpriseApi = {
  createEnterprise: async (data: { name: string; description?: string }) => {
    const response = await apiClient.post('/enterprises', data);
    return response.data;
  },

  getMyEnterprise: async () => {
    const response = await apiClient.get('/enterprises/my');
    return response.data;
  },

  getEnterprise: async (id: string) => {
    const response = await apiClient.get(`/enterprises/${id}`);
    return response.data;
  },

  updateEnterprise: async (id: string, data: any) => {
    const response = await apiClient.put(`/enterprises/${id}`, data);
    return response.data;
  },

  getAuthSettings: async (id: string): Promise<AuthSettings> => {
    const response = await apiClient.get(`/enterprises/${id}/auth-settings`);
    return response.data;
  },

  updateAuthSettings: async (id: string, data: Partial<AuthSettings>): Promise<AuthSettings> => {
    const response = await apiClient.put(`/enterprises/${id}/auth-settings`, data);
    return response.data.settings;
  },

  getAuthSettingsPublic: async (id: string): Promise<AuthSettings> => {
    const response = await apiClient.get(`/enterprises/${id}/auth-settings/public`);
    return response.data;
  },

  getResourceReviewSettings: async (id: string): Promise<ResourceReviewSettings> => {
    const response = await apiClient.get(`/enterprises/${id}/resource-review-settings`);
    return response.data;
  },

  updateResourceReviewSettings: async (id: string, data: Partial<ResourceReviewSettings>): Promise<ResourceReviewSettings> => {
    const response = await apiClient.put(`/enterprises/${id}/resource-review-settings`, data);
    return response.data.settings;
  },
};
