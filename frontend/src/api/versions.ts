import { apiClient } from './client';

export interface ResourceVersion {
  _id: string;
  resourceId: string;
  resourceType: 'skill' | 'prompt';
  version: string;
  versionNumber: number;
  content: string;
  files: Array<{
    filename: string;
    path: string;
    size: number;
    mimetype: string;
  }>;
  changelog: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVersionRequest {
  version: string;
  content: string;
  files?: Array<{
    filename: string;
    path: string;
    size: number;
    mimetype: string;
  }>;
  changelog: string;
}

export const versionsApi = {
  getVersions: async (resourceId: string, resourceType: 'skill' | 'prompt'): Promise<ResourceVersion[]> => {
    const response = await apiClient.get(`/versions/${resourceType}/${resourceId}`);
    return response.data.data;
  },

  getVersion: async (resourceId: string, resourceType: 'skill' | 'prompt', version: string): Promise<ResourceVersion> => {
    const response = await apiClient.get(`/versions/${resourceType}/${resourceId}/${version}`);
    return response.data.data;
  },

  createVersion: async (
    resourceId: string, 
    resourceType: 'skill' | 'prompt', 
    data: CreateVersionRequest
  ): Promise<ResourceVersion> => {
    const response = await apiClient.post(`/versions/${resourceType}/${resourceId}`, data);
    return response.data.data;
  },

  rollbackVersion: async (
    resourceId: string, 
    resourceType: 'skill' | 'prompt', 
    version: string
  ): Promise<void> => {
    await apiClient.post(`/versions/${resourceType}/${resourceId}/${version}/rollback`);
  }
};
