# SkillHub 前端 - 状态管理

## 1. 状态管理设计

### 1.1 状态管理架构

使用Zustand作为状态管理方案，特点是轻量、简洁、TypeScript友好。

```
┌─────────────────────────────────────────────────────────────┐
│                     Global State (Zustand)                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ authStore   │  │ skillStore  │  │promptStore  │       │
│  │  - user    │  │  - skills   │  │  - prompts  │       │
│  │  - token   │  │  - loading  │  │  - loading  │       │
│  │  - login   │  │  - error    │  │  - error    │       │
│  │  - logout  │  │  - fetch    │  │  - fetch    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                        │
│  │enterpriseSto│  │  uiStore    │                        │
│  │  - enterprise│ │  - theme    │                        │
│  │  - members  │  │  - sidebar  │                        │
│  │  - loading  │  │  - modal    │                        │
│  └─────────────┘  └─────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Local State (useState/useEffect)          │
│  - 页面级状态                                                │
│  - 表单数据                                                  │
│  - 临时UI状态                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Store设计原则

- 每个Store职责单一
- 使用Zustand的persist中间件持久化必要状态
- 异步操作在Store内部处理
- 组件通过Selector只订阅需要的状态

## 2. 认证状态管理

### 2.1 认证Store

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'enterprise_admin' | 'developer' | 'user';
  enterpriseId?: string;
  avatar?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const { data } = await authClient.post('/auth/login', credentials);
          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          set({
            error: error.response?.data?.message || '登录失败',
            loading: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ loading: true, error: null });
        try {
          const { data: response } = await authClient.post('/auth/register', data);
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          set({
            error: error.response?.data?.message || '注册失败',
            loading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const { data } = await authClient.post('/auth/refresh-token', {
            refreshToken,
          });
          set({
            token: data.token,
            refreshToken: data.refreshToken,
          });
        } catch (error) {
          get().logout();
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 2.2 认证状态使用

```tsx
// 在组件中使用
const LoginPage: React.FC = () => {
  const { login, loading, error, clearError } = useAuthStore();
  
  const handleLogin = async () => {
    try {
      await login({ email, password });
      navigate('/');
    } catch (error) {
      // error已在store中处理
    }
  };
  
  return (
    // 组件实现
  );
};

// 使用Selector避免不必要渲染
const UserAvatar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const avatar = user?.avatar;
  
  return <img src={avatar} alt={user?.username} />;
};
```

## 3. Skill状态管理

### 3.1 Skill Store

```typescript
// src/stores/skillStore.ts
import { create } from 'zustand';

interface Skill {
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
  downloadCount: number;
  fileUrl?: string;
  enterpriseId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  current: number;
  total: number;
  pageSize: number;
  totalPages: number;
}

interface SkillFilters {
  category?: string;
  tags?: string[];
  visibility?: string;
  sort?: 'popular' | 'latest' | 'rating';
  keyword?: string;
}

interface SkillState {
  skills: Skill[];
  currentSkill: Skill | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  filters: SkillFilters;
  
  fetchSkills: (params?: { page?: number; filters?: SkillFilters }) => Promise<void>;
  fetchSkill: (id: string) => Promise<void>;
  createSkill: (data: CreateSkillData) => Promise<Skill>;
  updateSkill: (id: string, data: UpdateSkillData) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  rateSkill: (id: string, rating: number) => Promise<void>;
  downloadSkill: (id: string) => Promise<void>;
  setFilters: (filters: SkillFilters) => void;
  clearError: () => void;
}

interface CreateSkillData {
  name: string;
  description: string;
  category: string;
  tags: string[];
  visibility: 'public' | 'enterprise' | 'private';
  files: File[];
}

interface UpdateSkillData {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  visibility?: 'public' | 'enterprise' | 'private';
}

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: [],
  currentSkill: null,
  loading: false,
  error: null,
  pagination: {
    current: 1,
    total: 0,
    pageSize: 12,
    totalPages: 0,
  },
  filters: {
    sort: 'popular',
  },

  fetchSkills: async (params) => {
    set({ loading: true, error: null });
    try {
      const { filters, pagination } = get();
      const queryParams = {
        page: params?.page || pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
        ...params?.filters,
      };

      const { data } = await skillsClient.get('/skills', { params: queryParams });
      
      set({
        skills: data.skills,
        pagination: {
          current: data.pagination.current,
          total: data.pagination.total,
          pageSize: data.pagination.pageSize,
          totalPages: data.pagination.totalPages,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || '获取Skill列表失败',
        loading: false,
      });
    }
  },

  fetchSkill: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await skillsClient.get(`/skills/${id}`);
      set({ currentSkill: data, loading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || '获取Skill详情失败',
        loading: false,
      });
    }
  },

  createSkill: async (skillData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      Object.entries(skillData).forEach(([key, value]) => {
        if (key === 'files') {
          (value as File[]).forEach((file) => formData.append('files', file));
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string);
        }
      });

      const { data } = await skillsClient.post('/skills', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      set((state) => ({
        skills: [data, ...state.skills],
        loading: false,
      }));
      
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || '创建Skill失败',
        loading: false,
      });
      throw error;
    }
  },

  updateSkill: async (id, skillData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await skillsClient.put(`/skills/${id}`, skillData);
      set((state) => ({
        skills: state.skills.map((s) => (s._id === id ? data : s)),
        currentSkill: state.currentSkill?._id === id ? data : state.currentSkill,
        loading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || '更新Skill失败',
        loading: false,
      });
      throw error;
    }
  },

  deleteSkill: async (id) => {
    set({ loading: true, error: null });
    try {
      await skillsClient.delete(`/skills/${id}`);
      set((state) => ({
        skills: state.skills.filter((s) => s._id !== id),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || '删除Skill失败',
        loading: false,
      });
      throw error;
    }
  },

  rateSkill: async (id, rating) => {
    try {
      const { data } = await skillsClient.post(`/skills/${id}/ratings`, { rating });
      set((state) => ({
        skills: state.skills.map((s) => 
          s._id === id ? { ...s, rating: data.rating } : s
        ),
        currentSkill: state.currentSkill?._id === id 
          ? { ...state.currentSkill, rating: data.rating } 
          : state.currentSkill,
      }));
    } catch (error) {
      throw error;
    }
  },

  downloadSkill: async (id) => {
    try {
      const { data } = await skillsClient.get(`/skills/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `skill-${id}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      throw error;
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
    get().fetchSkills({ page: 1 });
  },

  clearError: () => {
    set({ error: null });
  },
}));
```

## 4. 企业状态管理

### 4.1 企业Store

```typescript
// src/stores/enterpriseStore.ts
import { create } from 'zustand';

interface Enterprise {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  owner: {
    _id: string;
    username: string;
  };
  members: EnterpriseMember[];
  settings: {
    maxMembers: number;
    maxStorage: number;
    allowUpload: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface EnterpriseMember {
  user: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

interface EnterpriseState {
  enterprises: Enterprise[];
  currentEnterprise: Enterprise | null;
  loading: boolean;
  error: string | null;
  
  fetchEnterprises: () => Promise<void>;
  fetchEnterprise: (id: string) => Promise<void>;
  createEnterprise: (data: CreateEnterpriseData) => Promise<Enterprise>;
  updateEnterprise: (id: string, data: UpdateEnterpriseData) => Promise<void>;
  deleteEnterprise: (id: string) => Promise<void>;
  inviteMember: (enterpriseId: string, email: string) => Promise<void>;
  removeMember: (enterpriseId: string, userId: string) => Promise<void>;
  updateMemberRole: (enterpriseId: string, userId: string, role: string) => Promise<void>;
  clearError: () => void;
}

interface CreateEnterpriseData {
  name: string;
  description: string;
}

interface UpdateEnterpriseData {
  name?: string;
  description?: string;
  settings?: {
    maxMembers?: number;
    maxStorage?: number;
    allowUpload?: boolean;
  };
}

export const useEnterpriseStore = create<EnterpriseState>((set, get) => ({
  enterprises: [],
  currentEnterprise: null,
  loading: false,
  error: null,

  fetchEnterprises: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await enterprisesClient.get('/enterprises');
      set({ enterprises: data, loading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || '获取企业列表失败',
        loading: false,
      });
    }
  },

  fetchEnterprise: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await enterprisesClient.get(`/enterprises/${id}`);
      set({ currentEnterprise: data, loading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || '获取企业详情失败',
        loading: false,
      });
    }
  },

  createEnterprise: async (enterpriseData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await enterprisesClient.post('/enterprises', enterpriseData);
      set((state) => ({
        enterprises: [...state.enterprises, data],
        loading: false,
      }));
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || '创建企业失败',
        loading: false,
      });
      throw error;
    }
  },

  updateEnterprise: async (id, enterpriseData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await enterprisesClient.put(`/enterprises/${id}`, enterpriseData);
      set((state) => ({
        enterprises: state.enterprises.map((e) => (e._id === id ? data : e)),
        currentEnterprise: state.currentEnterprise?._id === id ? data : state.currentEnterprise,
        loading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || '更新企业失败',
        loading: false,
      });
      throw error;
    }
  },

  deleteEnterprise: async (id) => {
    set({ loading: true, error: null });
    try {
      await enterprisesClient.delete(`/enterprises/${id}`);
      set((state) => ({
        enterprises: state.enterprises.filter((e) => e._id !== id),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || '删除企业失败',
        loading: false,
      });
      throw error;
    }
  },

  inviteMember: async (enterpriseId, email) => {
    try {
      const { data } = await enterprisesClient.post(
        `/enterprises/${enterpriseId}/members`,
        { email }
      );
      set((state) => ({
        currentEnterprise: state.currentEnterprise?._id === enterpriseId
          ? { ...state.currentEnterprise, members: [...state.currentEnterprise.members, data] }
          : state.currentEnterprise,
      }));
    } catch (error) {
      throw error;
    }
  },

  removeMember: async (enterpriseId, userId) => {
    try {
      await enterprisesClient.delete(`/enterprises/${enterpriseId}/members/${userId}`);
      set((state) => ({
        currentEnterprise: state.currentEnterprise?._id === enterpriseId
          ? {
              ...state.currentEnterprise,
              members: state.currentEnterprise.members.filter((m) => m.user._id !== userId),
            }
          : state.currentEnterprise,
      }));
    } catch (error) {
      throw error;
    }
  },

  updateMemberRole: async (enterpriseId, userId, role) => {
    try {
      const { data } = await enterprisesClient.put(
        `/enterprises/${enterpriseId}/members/${userId}`,
        { role }
      );
      set((state) => ({
        currentEnterprise: state.currentEnterprise?._id === enterpriseId
          ? {
              ...state.currentEnterprise,
              members: state.currentEnterprise.members.map((m) =>
                m.user._id === userId ? { ...m, role: data.role } : m
              ),
            }
          : state.currentEnterprise,
      }));
    } catch (error) {
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
```

## 5. UI状态管理

### 5.1 UI Store

```typescript
// src/stores/uiStore.ts
import { create } from 'zustand';

interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  modals: Modal[];
  notifications: Notification[];
  globalLoading: boolean;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  setGlobalLoading: (loading: boolean) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: number;
}

let modalIdCounter = 0;

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'system',
  sidebarCollapsed: false,
  modals: [],
  notifications: [],
  globalLoading: false,

  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },

  openModal: (modal) => {
    const id = `modal-${++modalIdCounter}`;
    set((state) => ({
      modals: [...state.modals, { ...modal, id }],
    }));
    return id;
  },

  closeModal: (id) => {
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id),
    }));
  },

  addNotification: (notification) => {
    const id = `notification-${Date.now()}`;
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id, timestamp: Date.now() },
      ],
    }));
    
    setTimeout(() => {
      get().removeNotification(id);
    }, 5000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  setGlobalLoading: (loading) => {
    set({ globalLoading: loading });
  },
}));
```

## 6. 自定义Hooks

### 6.1 useSkills Hook

```typescript
// src/hooks/useSkills.ts
import { useEffect, useCallback } from 'react';
import { useSkillStore } from '../stores/skillStore';

interface UseSkillsOptions {
  enterprise?: boolean;
  autoFetch?: boolean;
}

export const useSkills = (options: UseSkillsOptions = {}) => {
  const { enterprise = false, autoFetch = true } = options;
  
  const {
    skills,
    loading,
    error,
    pagination,
    filters,
    fetchSkills,
    setFilters,
    clearError,
  } = useSkillStore();

  useEffect(() => {
    if (autoFetch) {
      fetchSkills({ 
        page: 1, 
        filters: { ...filters, visibility: enterprise ? 'enterprise' : 'public' } 
      });
    }
  }, [enterprise]);

  const refresh = useCallback(() => {
    fetchSkills({ page: pagination.current });
  }, [pagination.current]);

  const handlePageChange = useCallback((page: number) => {
    fetchSkills({ page });
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setFilters({ sort: sort as 'popular' | 'latest' | 'rating' });
  }, []);

  return {
    skills,
    loading,
    error,
    pagination,
    filters,
    refresh,
    handlePageChange,
    handleSortChange,
    setFilters,
    clearError,
  };
};
```

### 6.2 useAuth Hook

```typescript
// src/hooks/useAuth.ts
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
  } = useAuthStore();

  const isAdmin = user?.role === 'admin';
  const isEnterpriseAdmin = user?.role === 'enterprise_admin' || user?.role === 'admin';
  const isDeveloper = ['admin', 'enterprise_admin', 'developer'].includes(user?.role || '');

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
    isAdmin,
    isEnterpriseAdmin,
    isDeveloper,
  };
};
```
