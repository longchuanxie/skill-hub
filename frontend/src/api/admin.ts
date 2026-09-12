import { apiClient } from './client';

export interface DashboardStats {
  totalUsers: number;
  totalEnterprises: number;
  totalSkills: number;
  totalPrompts: number;
  activeUsersLast7Days: number;
  pendingApprovals: number;
  newUsersToday: number;
  newEnterprisesToday: number;
}

export interface UserListItem {
  _id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  isEmailVerified: boolean;
  enterpriseId?: string;
  enterpriseName?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface EnterpriseListItem {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  owner: {
    _id: string;
    username: string;
    email: string;
  };
  memberCount: number;
  subscription: {
    plan: string;
    expiresAt?: string;
  };
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  action: string;
  actor?: { _id: string; username?: string; email?: string };
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

export const adminApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/admin/dashboard/stats');
    return response.data;
  },

  getUserList: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<{
    users: UserListItem[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  updateUserRole: async (userId: string, role: string): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/role`, { role });
  },

  getEnterpriseList: async (params?: {
    page?: number;
    limit?: number;
    plan?: string;
    search?: string;
  }): Promise<{
    enterprises: EnterpriseListItem[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get('/admin/enterprises', { params });
    return response.data;
  },

  updateEnterprisePlan: async (
    enterpriseId: string,
    plan: string,
    expiresAt?: string,
  ): Promise<void> => {
    await apiClient.put(`/admin/enterprises/${enterpriseId}/plan`, {
      plan,
      expiresAt,
    });
  },

  getAuditLogs: async (params?: {
    page?: number;
    pageSize?: number;
    action?: string;
    targetType?: string;
  }): Promise<{
    logs: AuditLogItem[];
    pagination: { page: number; pages: number; total: number };
  }> => {
    const response = await apiClient.get('/admin/audit-logs', { params });
    return response.data;
  },
};
