import { apiClient } from './client';

export interface AuthSettings {
  passwordLoginEnabled: boolean;
  oauthRequired: boolean;
}

export interface ResourceReviewSettings {
  autoApprove: boolean;
  enableContentFilter: boolean;
}

export interface Invitation {
  _id: string;
  email: string;
  enterpriseId: string;
  invitedBy: {
    _id: string;
    username: string;
    email: string;
  };
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expiresAt: string;
  createdAt: string;
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

  inviteMember: async (id: string, data: { email: string; role?: 'admin' | 'member' }) => {
    const response = await apiClient.post(`/enterprises/${id}/invite`, data);
    return response.data;
  },

  getInvitations: async (id: string): Promise<Invitation[]> => {
    const response = await apiClient.get(`/enterprises/${id}/invitations`);
    return response.data;
  },

  cancelInvitation: async (id: string, invitationId: string) => {
    const response = await apiClient.delete(`/enterprises/${id}/invitations/${invitationId}`);
    return response.data;
  },

  acceptInvitation: async (token: string) => {
    const response = await apiClient.post(`/invitation/${token}/accept`);
    return response.data;
  },

  declineInvitation: async (token: string) => {
    const response = await apiClient.post(`/invitation/${token}/decline`);
    return response.data;
  },

  removeMember: async (id: string, memberId: string) => {
    const response = await apiClient.delete(`/enterprises/${id}/members/${memberId}`);
    return response.data;
  },

  updateMemberRole: async (id: string, memberId: string, role: string) => {
    const response = await apiClient.put(`/enterprises/${id}/members/${memberId}`, { role });
    return response.data;
  },

  leaveEnterprise: async () => {
    const response = await apiClient.post('/enterprises/leave');
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
