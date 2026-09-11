import { apiClient } from './client';

export interface UserInfo {
  _id: string;
  username: string;
}

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
  createdBy: string | UserInfo;
  createdAt: string;
  updatedAt: string;
  fileManifest?: {
    totalFiles: number;
    totalSize: number;
    files: Array<{
      path: string;
      name: string;
      size: number;
      checksum: string;
    }>;
    checksum: string;
  };
  comparisonStatus?: 'pending' | 'completed' | 'failed';
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

export interface FileEntry {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  checksum?: string;
}

export interface DiffSummary {
  addedCount: number;
  deletedCount: number;
  modifiedCount: number;
  unchangedCount: number;
}

export interface DiffResult {
  added: FileEntry[];
  deleted: FileEntry[];
  modified: FileEntry[];
  unchanged: FileEntry[];
  summary: DiffSummary;
}

export interface DetailedComparison extends VersionComparison {
  diff: DiffResult;
  fileContents?: Record<string, { old?: string; new?: string }>;
}

export interface GetVersionsParams {
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'versionNumber' | 'createdBy';
  sortOrder?: 'asc' | 'desc';
}

export interface GetVersionsResponse {
  versions: ResourceVersion[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const versionsApi = {
  getVersions: async (
    resourceId: string, 
    resourceType: 'skill' | 'prompt',
    params?: GetVersionsParams
  ): Promise<GetVersionsResponse> => {
    const response = await apiClient.get(`/versions/${resourceType}/${resourceId}`, { params });
    return response.data;
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
  },

  compareVersionsDetailed: async (
    resourceId: string,
    resourceType: 'skill' | 'prompt',
    fromVersion: string,
    toVersion: string,
    files?: string
  ): Promise<DetailedComparison> => {
    const response = await apiClient.get(`/versions/${resourceType}/${resourceId}/compare/detailed`, {
      params: { from: fromVersion, to: toVersion, files }
    });
    return response.data.data;
  },

  getVersionFileContent: async (
    resourceId: string,
    resourceType: 'skill' | 'prompt',
    version: string,
    filePath: string
  ): Promise<{ path: string; content: string }> => {
    const response = await apiClient.get(
      `/versions/${resourceType}/${resourceId}/${version}/files/${encodeURIComponent(filePath)}`
    );
    return response.data.data;
  },

  getVersionDiff: async (
    resourceId: string,
    resourceType: 'skill' | 'prompt',
    fromVersion: string,
    toVersion: string
  ): Promise<DiffResult> => {
    const response = await apiClient.get(`/versions/${resourceType}/${resourceId}/compare/detailed`, {
      params: { from: fromVersion, to: toVersion }
    });
    return response.data.data.diff;
  }
};
