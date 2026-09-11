import { apiClient } from './client';

export interface UserInfoConfig {
  method: 'GET' | 'POST';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  userIdPath: string;
  emailPath?: string;
  namePath?: string;
  avatarPath?: string;
}

export interface OAuthProvider {
  _id: string;
  name: string;
  provider: string;
  clientId?: string;
  authorizationURL: string;
  tokenURL: string;
  userInfoURL: string;
  scope: string;
  callbackPath: string;
  isEnabled: boolean;
  enterpriseId?: string;
  userInfoConfig?: UserInfoConfig;
  createdAt?: string;
  updatedAt?: string;
}

export const oauthApi = {
  getProviders: async (enterpriseId?: string): Promise<OAuthProvider[]> => {
    const url = enterpriseId 
      ? `/oauth/providers?enterpriseId=${enterpriseId}` 
      : '/oauth/providers';
    const response = await apiClient.get(url);
    return response.data.data;
  },

  getEnterpriseProviders: async (enterpriseId: string): Promise<OAuthProvider[]> => {
    const response = await apiClient.get(`/oauth/providers/enterprise?enterpriseId=${enterpriseId}`);
    return response.data.data;
  },

  createProvider: async (data: Partial<OAuthProvider>): Promise<OAuthProvider> => {
    const response = await apiClient.post('/oauth/providers', data);
    return response.data.data;
  },

  updateProvider: async (id: string, data: Partial<OAuthProvider>): Promise<OAuthProvider> => {
    const response = await apiClient.put(`/oauth/providers/${id}`, data);
    return response.data.data;
  },

  deleteProvider: async (id: string): Promise<void> => {
    await apiClient.delete(`/oauth/providers/${id}`);
  },

  getAuthUrl: async (provider: string, enterpriseId?: string): Promise<string> => {
    const url = enterpriseId 
      ? `/oauth/authorize/${provider}?enterpriseId=${enterpriseId}` 
      : `/oauth/authorize/${provider}`;
    const response = await apiClient.get(url);
    return response.data.data.authUrl;
  },

  linkAccount: async (provider: string): Promise<string> => {
    const response = await apiClient.post(`/oauth/link/${provider}`);
    return response.data.data.authUrl;
  }
};
