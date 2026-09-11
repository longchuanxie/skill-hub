import { apiClient } from './client';
import { ApiResponse } from '../types/api';

export interface Agent {
  _id: string;
  description: string;
  apiKey?: string;
  endpoint?: string;
  isEnabled: boolean;
  createdBy: string;
  owner?: string;
  enterpriseId?: string;
  permissions?: {
    canRead: boolean;
    canWrite: boolean;
    allowedResources: string[];
  };
  usage?: {
    totalRequests: number;
    lastUsed: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAgentRequest {
  description?: string;
  permissions?: {
    canRead: boolean;
    canWrite: boolean;
    allowedResources: string[];
  };
  enterpriseId?: string;
}

export interface AgentsResponse {
  agents: Agent[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

export const agentApi = {
  getAgents: async (params?: { page?: number; pageSize?: number }): Promise<AgentsResponse> => {
    const response = await apiClient.get('/agents', { params });
    return response.data;
  },

  createAgent: async (data: CreateAgentRequest): Promise<{ agent: Agent; apiKey: string }> => {
    const response = await apiClient.post('/agents', data);
    return response.data;
  },

  deleteAgent: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/agents/${id}`);
    return response.data;
  },

  regenerateApiKey: async (id: string): Promise<{ apiKey: string }> => {
    const response = await apiClient.post(`/agents/${id}/regenerate-key`);
    return response.data;
  },

  getApiKey: async (id: string): Promise<{ apiKey: string }> => {
    const response = await apiClient.get(`/agents/${id}/api-key`);
    return response.data;
  },
};
