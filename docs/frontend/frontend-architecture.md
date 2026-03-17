# SkillHub 前端 - 技术架构

## 1. 技术栈总览

### 1.1 核心技术选型

| 层级 | 技术选型 | 版本要求 | 说明 |
|------|----------|----------|------|
| 框架 | React | 18.x | 前端UI框架 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 构建工具 | Vite | 5.x | 快速构建工具 |
| UI组件库 | animate-ui | latest | 动画UI组件库 |
| 样式方案 | Tailwind CSS | 3.x | 原子化CSS框架 |
| 状态管理 | Zustand | 4.x | 轻量级状态管理 |
| 路由 | React Router | 6.x | 前端路由 |
| HTTP客户端 | Axios | 1.x | HTTP请求库 |
| 表单处理 | React Hook Form | 7.x | 表单管理 |
| 数据校验 | Zod | 3.x | Schema校验 |

### 1.2 技术选型理由

#### React 18.x
- 引入并发渲染机制，提升复杂应用性能
- 自动批处理优化，减少不必要的渲染
- 成熟的生态系统，丰富的第三方库支持

#### Vite 5.x
- 基于ESM的开发服务器，冷启动速度快
- HMR热更新，提升开发体验
- 内置TypeScript支持，构建性能优秀

#### Zustand 4.x
- 极简API，学习成本低
- 无Provider嵌套困扰
- 支持React外部更新状态
- TypeScript友好

#### Tailwind CSS
- 原子化CSS，减少样式代码量
- JIT模式，按需生成CSS
- 自定义配置灵活
- 响应式设计支持

## 2. 项目架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        App 层                               │
│                  (React Router 路由管理)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     Pages 层                                │
│                    (页面组件)                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Components 层                             │
│  ┌─────────────┬─────────────┬─────────────────────────┐ │
│  │  通用组件    │  业务组件    │      布局组件           │ │
│  └─────────────┴─────────────┴─────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     Stores 层                              │
│                    (Zustand 状态管理)                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      API 层                                │
│                   (Axios HTTP客户端)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
                    后端API服务
```

### 2.2 目录结构

```
frontend/
├── public/                     # 静态资源
│   ├── favicon.ico
│   └── logo.svg
│
├── src/
│   ├── api/                    # API请求模块
│   │   ├── client.ts           # Axios实例配置
│   │   ├── auth.ts             # 认证API
│   │   ├── skills.ts           # Skill API
│   │   ├── prompts.ts          # 提示词API
│   │   ├── enterprises.ts     # 企业API
│   │   ├── upload.ts           # 上传API
│   │   └── agent.ts            # Agent API
│   │
│   ├── components/             # 组件
│   │   ├── common/             # 通用组件
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Card/
│   │   │   ├── Table/
│   │   │   ├── Pagination/
│   │   │   ├── SearchBar/
│   │   │   ├── Tag/
│   │   │   ├── Rating/
│   │   │   ├── Loading/
│   │   │   ├── Empty/
│   │   │   └── ViewToggle/
│   │   │
│   │   ├── layout/             # 布局组件
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   ├── Footer/
│   │   │   └── Layout/
│   │   │
│   │   ├── skill/              # Skill相关组件
│   │   │   ├── SkillCard/
│   │   │   ├── SkillDetail/
│   │   │   ├── SkillForm/
│   │   │   ├── SkillList/
│   │   │   └── SkillVersionHistory/
│   │   │
│   │   ├── prompt/             # 提示词相关组件
│   │   │   ├── PromptCard/
│   │   │   ├── PromptDetail/
│   │   │   ├── PromptForm/
│   │   │   ├── PromptList/
│   │   │   └── PromptEditor/
│   │   │
│   │   ├── enterprise/         # 企业相关组件
│   │   │   ├── EnterpriseCard/
│   │   │   ├── EnterpriseMemberList/
│   │   │   └── EnterpriseSettings/
│   │   │
│   │   ├── user/               # 用户相关组件
│   │   │   ├── UserAvatar/
│   │   │   ├── UserProfile/
│   │   │   └── UserSettings/
│   │   │
│   │   └── agent/              # Agent相关组件
│   │       ├── AgentCard/
│   │       ├── AgentList/
│   │       └── AgentApiDoc/
│   │
│   ├── hooks/                  # 自定义Hooks
│   │   ├── useAuth.ts          # 认证相关
│   │   ├── useSkills.ts        # Skill相关
│   │   ├── usePrompts.ts       # 提示词相关
│   │   ├── useEnterprises.ts   # 企业相关
│   │   ├── usePagination.ts   # 分页相关
│   │   ├── useSearch.ts        # 搜索相关
│   │   ├── useUpload.ts        # 上传相关
│   │   └── useViewMode.ts      # 视图模式相关
│   │
│   ├── pages/                  # 页面组件
│   │   ├── Home/
│   │   ├── Market/
│   │   ├── Skill/
│   │   ├── Prompt/
│   │   ├── Enterprise/
│   │   ├── User/
│   │   ├── Agent/
│   │   └── Admin/
│   │
│   ├── stores/                 # Zustand状态管理
│   │   ├── authStore.ts        # 认证状态
│   │   ├── skillStore.ts       # Skill状态
│   │   ├── promptStore.ts     # 提示词状态
│   │   ├── enterpriseStore.ts # 企业状态
│   │   └── uiStore.ts          # UI状态
│   │
│   ├── types/                  # TypeScript类型
│   │   ├── user.ts
│   │   ├── skill.ts
│   │   ├── prompt.ts
│   │   ├── enterprise.ts
│   │   ├── agent.ts
│   │   ├── api.ts
│   │   └── common.ts
│   │
│   ├── utils/                  # 工具函数
│   │   ├── request.ts          # 请求封装
│   │   ├── storage.ts          # 存储封装
│   │   ├── validators.ts       # 校验函数
│   │   ├── formatters.ts       # 格式化函数
│   │   ├── constants.ts        # 常量定义
│   │   └── helpers.ts          # 辅助函数
│   │
│   ├── styles/                 # 样式文件
│   │   ├── globals.css
│   │   └── variables.css
│   │
│   ├── App.tsx                 # 根组件
│   ├── main.tsx                # 入口文件
│   └── vite-env.d.ts           # Vite类型定义
│
├── index.html                  # HTML入口
├── package.json                # 依赖配置
├── tsconfig.json               # TypeScript配置
├── tailwind.config.js          # Tailwind配置
├── postcss.config.js           # PostCSS配置
└── vite.config.ts              # Vite配置
```

## 3. 核心模块设计

### 3.1 API客户端设计

```typescript
// src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
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
    (response: AxiosResponse) => response,
    (error) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();
```

### 3.2 状态管理设计

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  enterpriseId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),
      
      updateUser: (userData) => set((state) => ({ 
        user: state.user ? { ...state.user, ...userData } : null 
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
```

### 3.3 路由设计

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import HomePage from './pages/Home';
import MarketPage from './pages/Market';
import LoginPage from './pages/User/Login';
import AdminPage from './pages/Admin';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/market" element={<MarketPage />} />
          
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## 4. 开发规范

### 4.1 组件规范

```typescript
// 组件命名: 功能 + 组件类型
// SkillCard, SkillList, SkillForm
// PromptCard, PromptDetail

// 组件文件结构
import React from 'react';
import { cn } from '../utils/cn';

interface ComponentNameProps {
  className?: string;
  // ... 其他props
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  className,
  ...props
}) => {
  return (
    <div className={cn('base-classes', className)} {...props}>
      {/* 组件内容 */}
    </div>
  );
};
```

### 4.2 样式规范

- 使用Tailwind CSS类名
- 避免内联样式
- 使用cn工具函数合并类名
- 遵循响应式设计规范

### 4.3 状态管理规范

- 认证状态全局管理
- 页面级状态使用useState
- 复杂状态使用Zustand
- 避免状态冗余

### 4.4 API调用规范

- 使用try-catch处理错误
- 统一错误处理逻辑
- 避免在组件中直接调用API
- 使用custom hooks封装
