import { createApiClient } from './client';
import { User } from '../stores/authStore';

const userClient = createApiClient();

export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await userClient.get<User>('/users/profile');
    return response.data;
  },

  updateProfile: async (data: { username: string }): Promise<User> => {
    const response = await userClient.patch<User>('/users/profile', data);
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await userClient.get<User>(`/users/${id}`);
    return response.data;
  },

  getUserList: async (params?: { page?: number; pageSize?: number }): Promise<{ users: User[]; pagination: any }> => {
    const response = await userClient.get<{ users: User[]; pagination: any }>('/users', { params });
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatar: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await userClient.post<{ avatar: string }>('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
