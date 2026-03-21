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
  tags: string[];
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
  tags?: string[];
}

export interface FileChange {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  oldContent?: string;
  newContent?: string;
}

export interface VersionComparison {
  fromVersion: string;
  toVersion: string;
  changes: FileChange[];
  summary: {
    added: number;
    modified: number;
    deleted: number;
  };
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
  },

  addVersionTag: async (
    resourceId: string, 
    resourceType: 'skill' | 'prompt', 
    version: string,
    tag: string
  ): Promise<ResourceVersion> => {
    const response = await apiClient.post(`/versions/${resourceType}/${resourceId}/${version}/tags`, { tag });
    return response.data.data;
  },

  deleteVersionTag: async (
    resourceId: string, 
    resourceType: 'skill' | 'prompt', 
    version: string,
    tag: string
  ): Promise<ResourceVersion> => {
    const response = await apiClient.delete(`/versions/${resourceType}/${resourceId}/${version}/tags/${tag}`);
    return response.data.data;
  },

  compareVersions: async (
    resourceId: string, 
    resourceType: 'skill' | 'prompt',
    fromVersion: string,
    toVersion: string
  ): Promise<VersionComparison> => {
    const response = await apiClient.get(`/versions/${resourceType}/${resourceId}/compare`, {
      params: { from: fromVersion, to: toVersion }
    });
    return response.data.data;
  },

  downloadVersion: async (
    resourceId: string, 
    resourceType: 'skill' | 'prompt', 
    version: string
  ): Promise<Blob> => {
    const response = await apiClient.get(`/versions/${resourceType}/${resourceId}/${version}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
