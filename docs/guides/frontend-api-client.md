# SkillHub 前端 - API客户端

## 1. API客户端架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      业务层                                │
│  (各模块API: auth.ts, skills.ts, prompts.ts等)            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    客户端层                                 │
│                    (apiClient)                            │
│  - 请求拦截器                                              │
│  - 响应拦截器                                              │
│  - 错误处理                                                │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Axios实例                               │
│  - 基础配置                                                │
│  - 超时设置                                                │
│  - 适配器                                                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
                    后端API服务
```

### 1.2 API模块结构

```
src/api/
├── client.ts           # Axios实例和拦截器
├── auth.ts             # 认证相关API
├── skills.ts           # Skill相关API
├── prompts.ts          # 提示词相关API
├── enterprises.ts      # 企业相关API
├── upload.ts           # 文件上传API
└── agent.ts            # Agent相关API
```

## 2. Axios客户端配置

### 2.1 基础客户端

```typescript
// src/api/client.ts
import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError 
} from 'axios';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = useAuthStore.getState().token;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // 响应拦截器
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // 401 Unauthorized 处理
      if (error.response?.status === 401) {
        // 如果是刷新Token请求失败，直接登出
        if (originalRequest.url?.includes('/auth/refresh')) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // 尝试刷新Token
        if (!originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = useAuthStore.getState().refreshToken;
            
            if (refreshToken) {
              const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              useAuthStore.getState().login(data.user, data.token);

              originalRequest.headers.Authorization = `Bearer ${data.token}`;
              return client(originalRequest);
            }
          } catch (refreshError) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();
```

### 2.2 API响应类型定义

```typescript
// src/types/api.ts

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current: number;
    total: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
```

### 2.3 请求工具函数

```typescript
// src/utils/request.ts
import { AxiosRequestConfig } from 'axios';

export const buildQueryString = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
};

export const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const apiError: ApiError = {
      message: error.response?.data?.message || '网络错误',
      code: error.response?.data?.code || 'NETWORK_ERROR',
    };
    throw apiError;
  }
  
  throw {
    message: '未知错误',
    code: 'UNKNOWN_ERROR',
  };
};

export const createConfig = <T>(config?: AxiosRequestConfig<T>): AxiosRequestConfig<T> => {
  return {
    ...config,
    headers: {
      ...config?.headers,
    },
  };
};
```

## 3. 认证API

### 3.1 认证API模块

```typescript
// src/api/auth.ts
import { apiClient } from './client';
import { ApiResponse } from '../types/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  refreshToken: string;
  requiresVerification: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data),

  logout: () =>
    apiClient.post<ApiResponse<void>>('/auth/logout'),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post<ApiResponse<void>>('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/reset-password', data),

  verifyEmail: (data: VerifyEmailRequest) =>
    apiClient.post<ApiResponse<{ user?: User }>>('/auth/verify-email', data),

  refreshToken: (data: RefreshTokenRequest) =>
    apiClient.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', data),

  getCurrentUser: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),
};
```

### 3.2 使用示例

```typescript
// 登录
const handleLogin = async (email: string, password: string) => {
  try {
    const { data } = await authApi.login({ email, password });
    const { user, token, refreshToken } = data.data;
    
    useAuthStore.getState().login(user, token, refreshToken);
    navigate('/');
  } catch (error) {
    handleApiError(error);
  }
};

// 刷新Token
const refreshToken = async () => {
  const refreshToken = useAuthStore.getState().refreshToken;
  const { data } = await authApi.refreshToken({ refreshToken });
  return data.data;
};
```

## 4. Skill API

### 4.1 Skill API模块

```typescript
// src/api/skills.ts
import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, UploadProgress } from '../types/api';

export interface Skill {
  _id: string;
  name: string;
  description: string;
  author: {
    _id: string;
    username: string;
  };
  category: string;
  tags: string[];
  visibility: 'public' | 'enterprise' | 'private';
  version: string;
  rating: number;
  ratingCount: number;
  downloadCount: number;
  fileUrl?: string;
  enterpriseId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkillRequest {
  name: string;
  description: string;
  category: string;
  tags: string[];
  visibility: 'public' | 'enterprise' | 'private';
  files: File[];
}

export interface UpdateSkillRequest {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  visibility?: 'public' | 'enterprise' | 'private';
}

export interface SkillListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tags?: string[];
  visibility?: string;
  sort?: 'popular' | 'latest' | 'rating';
  keyword?: string;
}

export interface RateSkillRequest {
  rating: number;
}

export interface SkillFilters {
  category?: string;
  tags?: string[];
  visibility?: string;
  sort?: 'popular' | 'latest' | 'rating';
  keyword?: string;
}

export const skillsApi = {
  list: (params?: SkillListParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<Skill>>>('/skills', { params }),

  get: (id: string) =>
    apiClient.get<ApiResponse<Skill>>(`/skills/${id}`),

  create: (data: CreateSkillRequest, onProgress?: (progress: UploadProgress) => void) => {
    const formData = new FormData();
    
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('tags', JSON.stringify(data.tags));
    formData.append('visibility', data.visibility);
    
    data.files.forEach((file) => {
      formData.append('files', file);
    });

    return apiClient.post<ApiResponse<Skill>>('/skills', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          });
        }
      },
    });
  },

  update: (id: string, data: UpdateSkillRequest) =>
    apiClient.put<ApiResponse<Skill>>(`/skills/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/skills/${id}`),

  download: (id: string) =>
    apiClient.get(`/skills/${id}/download`, {
      responseType: 'blob',
    }),

  rate: (id: string, data: RateSkillRequest) =>
    apiClient.post<ApiResponse<{ rating: number }>>(`/skills/${id}/ratings`, data),

  getVersions: (id: string) =>
    apiClient.get<ApiResponse<SkillVersion[]>>(`/skills/${id}/versions`),

  revertVersion: (id: string, versionId: string) =>
    apiClient.post<ApiResponse<Skill>>(`/skills/${id}/versions/${versionId}/revert`),
};
```

### 4.2 使用示例

```typescript
// 获取Skill列表
const fetchSkills = async (page = 1) => {
  const { data } = await skillsApi.list({
    page,
    pageSize: 12,
    sort: 'popular',
    visibility: 'public',
  });
  
  return data.data;
};

// 创建Skill
const createSkill = async (skillData: CreateSkillRequest) => {
  const { data } = await skillsApi.create(skillData, (progress) => {
    console.log(`上传进度: ${progress.percentage}%`);
  });
  
  return data.data;
};

// 下载Skill
const downloadSkill = async (id: string) => {
  const response = await skillsApi.download(id);
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `skill-${id}.zip`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
```

## 5. Prompt API

### 5.1 Prompt API模块

```typescript
// src/api/prompts.ts
import { apiClient } from './client';
import { ApiResponse, PaginatedResponse } from '../types/api';

export interface Prompt {
  _id: string;
  name: string;
  description: string;
  content: string;
  author: {
    _id: string;
    username: string;
  };
  category: string;
  variables: PromptVariable[];
  visibility: 'public' | 'enterprise' | 'private';
  rating: number;
  ratingCount: number;
  usageCount: number;
  enterpriseId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface PromptVariable {
  name: string;
  description: string;
  defaultValue?: string;
  required: boolean;
}

export interface CreatePromptRequest {
  name: string;
  description: string;
  content: string;
  category: string;
  variables?: PromptVariable[];
  visibility: 'public' | 'enterprise' | 'private';
}

export interface UpdatePromptRequest {
  name?: string;
  description?: string;
  content?: string;
  category?: string;
  variables?: PromptVariable[];
  visibility?: 'public' | 'enterprise' | 'private';
}

export interface PromptListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  visibility?: string;
  sort?: 'popular' | 'latest' | 'rating';
  keyword?: string;
}

export interface RatePromptRequest {
  rating: number;
}

export const promptsApi = {
  list: (params?: PromptListParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<Prompt>>>('/prompts', { params }),

  get: (id: string) =>
    apiClient.get<ApiResponse<Prompt>>(`/prompts/${id}`),

  create: (data: CreatePromptRequest) =>
    apiClient.post<ApiResponse<Prompt>>('/prompts', data),

  update: (id: string, data: UpdatePromptRequest) =>
    apiClient.put<ApiResponse<Prompt>>(`/prompts/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/prompts/${id}`),

  copy: (id: string) =>
    apiClient.post<ApiResponse<Prompt>>(`/prompts/${id}/copy`),

  rate: (id: string, data: RatePromptRequest) =>
    apiClient.post<ApiResponse<{ rating: number }>>(`/prompts/${id}/ratings`, data),
};
```

## 6. 企业API

### 6.1 企业API模块

```typescript
// src/api/enterprises.ts
import { apiClient } from './client';
import { ApiResponse, PaginatedResponse } from '../types/api';

export interface Enterprise {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  owner: {
    _id: string;
    username: string;
  };
  members: EnterpriseMember[];
  settings: EnterpriseSettings;
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseMember {
  user: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface EnterpriseSettings {
  maxMembers: number;
  maxStorage: number;
  allowUpload: boolean;
}

export interface CreateEnterpriseRequest {
  name: string;
  description: string;
}

export interface UpdateEnterpriseRequest {
  name?: string;
  description?: string;
  settings?: Partial<EnterpriseSettings>;
}

export interface InviteMemberRequest {
  email: string;
  role: 'admin' | 'member';
}

export interface UpdateMemberRequest {
  role: 'admin' | 'member';
}

export const enterprisesApi = {
  list: () =>
    apiClient.get<ApiResponse<Enterprise[]>>('/enterprises'),

  get: (id: string) =>
    apiClient.get<ApiResponse<Enterprise>>(`/enterprises/${id}`),

  create: (data: CreateEnterpriseRequest) =>
    apiClient.post<ApiResponse<Enterprise>>('/enterprises', data),

  update: (id: string, data: UpdateEnterpriseRequest) =>
    apiClient.put<ApiResponse<Enterprise>>(`/enterprises/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/enterprises/${id}`),

  getMembers: (id: string) =>
    apiClient.get<ApiResponse<EnterpriseMember[]>>(`/enterprises/${id}/members`),

  inviteMember: (id: string, data: InviteMemberRequest) =>
    apiClient.post<ApiResponse<EnterpriseMember>>(`/enterprises/${id}/members`, data),

  removeMember: (id: string, userId: string) =>
    apiClient.delete<ApiResponse<void>>(`/enterprises/${id}/members/${userId}`),

  updateMember: (id: string, userId: string, data: UpdateMemberRequest) =>
    apiClient.put<ApiResponse<EnterpriseMember>>(`/enterprises/${id}/members/${userId}`, data),
};
```

## 7. 文件上传API

### 7.1 上传API模块

```typescript
// src/api/upload.ts
import { apiClient } from './client';
import { ApiResponse, UploadProgress } from '../types/api';

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface UploadOptions {
  file: File;
  directory?: string;
  onProgress?: (progress: UploadProgress) => void;
}

export const uploadApi = {
  upload: (options: UploadOptions) => {
    const { file, directory = 'uploads', onProgress } = options;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('directory', directory);

    return apiClient.post<ApiResponse<UploadResponse>>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          });
        }
      },
    });
  },

  uploadMultiple: (files: File[], directory?: string, onProgress?: (progress: UploadProgress, fileIndex: number) => void) => {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    
    if (directory) {
      formData.append('directory', directory);
    }

    return apiClient.post<ApiResponse<UploadResponse[]>>('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          }, 0);
        }
      },
    });
  },

  delete: (url: string) =>
    apiClient.delete<ApiResponse<void>>('/upload', { data: { url } }),
};
```

## 8. Agent API

### 8.1 Agent API模块

```typescript
// src/api/agent.ts
import { apiClient } from './client';
import { ApiResponse, PaginatedResponse } from '../types/api';

export interface Agent {
  _id: string;
  name: string;
  description?: string;
  enterpriseId?: string;
  agentId: string;
  agentToken: string;
  tokenExpiresAt: string;
  permissions: AgentPermissions;
  rateLimit: AgentRateLimit;
  status: 'active' | 'inactive' | 'suspended';
  lastAccessAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentPermissions {
  canReadPublic: boolean;
  canReadEnterprise: boolean;
  canDownload: boolean;
  canUpload: boolean;
}

export interface AgentRateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  enterpriseId?: string;
  permissions: AgentPermissions;
  rateLimit: AgentRateLimit;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  enterpriseId?: string;
  permissions?: AgentPermissions;
  rateLimit?: AgentRateLimit;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface AgentConfig {
  agentId: string;
  name: string;
  enterpriseId?: string;
  permissions: AgentPermissions;
  rateLimit: AgentRateLimit;
}

export const agentApi = {
  list: () =>
    apiClient.get<ApiResponse<Agent[]>>('/agent'),

  get: (id: string) =>
    apiClient.get<ApiResponse<Agent>>(`/agent/${id}`),

  create: (data: CreateAgentRequest) =>
    apiClient.post<ApiResponse<Agent>>('/agent', data),

  update: (id: string, data: UpdateAgentRequest) =>
    apiClient.put<ApiResponse<Agent>>(`/agent/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/agent/${id}`),

  regenerateToken: (id: string) =>
    apiClient.post<ApiResponse<{ token: string; expiresAt: string }>>(`/agent/${id}/regenerate-token`),

  getConfig: () =>
    apiClient.get<ApiResponse<AgentConfig>>('/agent/config'),
};
```

### 8.2 Agent API客户端(供Agent使用)

```typescript
// src/api/agent-client.ts
import axios, { AxiosInstance } from 'axios';

export interface AgentClientConfig {
  agentId: string;
  agentToken: string;
  baseURL?: string;
}

const createAgentClient = (config: AgentClientConfig): AxiosInstance => {
  const baseURL = config.baseURL || '/api';

  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'X-Agent-Id': config.agentId,
      'X-Agent-Token': config.agentToken,
      'Content-Type': 'application/json',
    },
  });
};

export const createAgentSkillClient = (config: AgentClientConfig) => {
  const client = createAgentClient(config);

  return {
    listPublicSkills: (params?: { page?: number; pageSize?: number; category?: string }) =>
      client.get('/agent/skills', { params }),

    listEnterpriseSkills: (params?: { page?: number; pageSize?: number }) =>
      client.get('/agent/enterprise/skills', { params }),

    getSkill: (id: string) =>
      client.get(`/agent/skills/${id}`),

    downloadSkill: (id: string) =>
      client.get(`/agent/skills/${id}/download`, { responseType: 'blob' }),

    uploadSkill: (data: FormData) =>
      client.post('/agent/skills', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
  };
};

export const createAgentPromptClient = (config: AgentClientConfig) => {
  const client = createAgentClient(config);

  return {
    listPublicPrompts: (params?: { page?: number; pageSize?: number; category?: string }) =>
      client.get('/agent/prompts', { params }),

    listEnterprisePrompts: (params?: { page?: number; pageSize?: number }) =>
      client.get('/agent/enterprise/prompts', { params }),

    getPrompt: (id: string) =>
      client.get(`/agent/prompts/${id}`),
  };
};
```

## 9. API错误处理

### 9.1 统一错误处理

```typescript
// src/utils/errorHandler.ts
import { ApiError } from '../types/api';

export class ApiException extends Error {
  code: string;
  details?: Record<string, string[]>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.code = error.code;
    this.details = error.details;
  }
}

export const handleApiError = (error: unknown): ApiException => {
  if (axios.isAxiosError(error)) {
    const apiError: ApiError = {
      message: error.response?.data?.message || '网络错误，请稍后重试',
      code: error.response?.data?.code || 'NETWORK_ERROR',
      details: error.response?.data?.details,
    };
    return new ApiException(apiError);
  }

  if (error instanceof Error) {
    return new ApiException({
      message: error.message,
      code: 'UNKNOWN_ERROR',
    });
  }

  return new ApiException({
    message: '未知错误',
    code: 'UNKNOWN_ERROR',
  });
};

export const getErrorMessage = (error: unknown): string => {
  return handleApiError(error).message;
};
```

### 9.2 Hook中错误处理

```typescript
// src/hooks/useSkills.ts
import { useState, useCallback } from 'react';
import { skillsApi, Skill, SkillListParams } from '../api/skills';
import { handleApiError } from '../utils/errorHandler';

export const useSkills = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async (params?: SkillListParams) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await skillsApi.list(params);
      setSkills(data.data.data);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    skills,
    loading,
    error,
    fetchSkills,
  };
};
```
