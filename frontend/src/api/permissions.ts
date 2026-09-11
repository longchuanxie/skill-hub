import { apiClient } from './client';

export interface Collaborator {
  userId: string;
  username: string;
  role: 'viewer' | 'editor' | 'admin';
  addedAt: string;
  addedBy: string;
  user?: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

export interface SkillPermissions {
  _id: string;
  skillId: string;
  visibility: 'public' | 'private' | 'password-protected' | 'team';
  password?: string;
  allowComments: boolean;
  allowForks: boolean;
  collaborators: Collaborator[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionAuditLog {
  _id: string;
  skillId: string;
  action: 'create' | 'update' | 'delete' | 'add_collaborator' | 'remove_collaborator' | 'update_role';
  details: any;
  performedBy: string;
  performedAt: string;
}

export interface CheckPermissionResponse {
  hasPermission: boolean;
  reason?: string;
}

export interface UpdatePermissionsRequest {
  visibility?: 'public' | 'private' | 'enterprise' | 'shared';
  allowComments?: boolean;
  allowForks?: boolean;
}

export interface AddCollaboratorRequest {
  userId: string;
  role?: 'viewer' | 'editor' | 'admin';
}

export interface UpdateCollaboratorRequest {
  role: 'viewer' | 'editor' | 'admin';
}

export type Visibility = 'public' | 'private' | 'enterprise' | 'shared';

export const permissionsApi = {
  getPermissions: async (skillId: string): Promise<SkillPermissions> => {
    const response = await apiClient.get(`/skills/${skillId}/permissions`);
    return response.data.data;
  },

  updatePermissions: async (skillId: string, data: UpdatePermissionsRequest): Promise<SkillPermissions> => {
    const response = await apiClient.put(`/skills/${skillId}/permissions`, data);
    return response.data.data;
  },

  addCollaborator: async (skillId: string, userId: string, role?: 'viewer' | 'editor' | 'admin'): Promise<SkillPermissions> => {
    const response = await apiClient.post(`/skills/${skillId}/collaborators`, { userId, role });
    return response.data.data;
  },

  updateCollaboratorRole: async (
    skillId: string,
    userId: string,
    role: 'viewer' | 'editor' | 'admin'
  ): Promise<SkillPermissions> => {
    const response = await apiClient.put(`/skills/${skillId}/collaborators/${userId}`, { role });
    return response.data.data;
  },

  removeCollaborator: async (skillId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/skills/${skillId}/collaborators/${userId}`);
  },

  getPermissionAuditLogs: async (skillId: string): Promise<PermissionAuditLog[]> => {
    const response = await apiClient.get(`/skills/${skillId}/permissions/audit-logs`);
    return response.data.data;
  },

  checkPermission: async (skillId: string, permission: 'view' | 'edit' | 'delete' | 'manage'): Promise<CheckPermissionResponse> => {
    const response = await apiClient.get(`/skills/${skillId}/permissions/check`, {
      params: { permission }
    });
    return response.data.data;
  }
};
