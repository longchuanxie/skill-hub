# SkillHub 前端 - 路由设计

## 1. 路由架构

### 1.1 路由结构概览

使用React Router 6进行路由管理，采用嵌套路由结构。

```
App
├── PublicRoutes (无需登录)
│   ├── HomePage
│   ├── PublicMarketPage
│   ├── LoginPage
│   ├── RegisterPage
│   ├── ForgotPasswordPage
│   ├── ResetPasswordPage
│   └── VerifyEmailPage
│
├── ProtectedRoutes (需要登录)
│   ├── UserLayout
│   │   ├── EnterpriseLayout
│   │   │   ├── EnterpriseMarketPage
│   │   │   ├── EnterpriseSkillsPage
│   │   │   ├── EnterprisePromptsPage
│   │   │   └── EnterpriseSettingsPage
│   │   │
│   │   ├── ProfilePage
│   │   ├── SettingsPage
│   │   ├── MyResourcesPage
│   │   ├── CreateSkillPage
│   │   └── CreatePromptPage
│   │
│   └── AdminLayout
│       ├── AdminDashboardPage
│       ├── UserManagementPage
│       ├── ContentReviewPage
│       ├── EnterpriseManagementPage
│       └── AgentManagementPage
```

### 1.2 路由配置表

| 路径 | 页面组件 | 权限 | 布局 |
|------|----------|------|------|
| `/` | HomePage | 公开 | PublicLayout |
| `/market` | PublicMarketPage | 公开 | PublicLayout |
| `/market/skills` | PublicSkillsPage | 公开 | PublicLayout |
| `/market/prompts` | PublicPromptsPage | 公开 | PublicLayout |
| `/skills/:id` | SkillDetailPage | 按资源 | PublicLayout |
| `/prompts/:id` | PromptDetailPage | 按资源 | PublicLayout |
| `/login` | LoginPage | 公开 | BlankLayout |
| `/register` | RegisterPage | 公开 | BlankLayout |
| `/forgot-password` | ForgotPasswordPage | 公开 | BlankLayout |
| `/reset-password` | ResetPasswordPage | 公开 | BlankLayout |
| `/verify-email` | VerifyEmailPage | 公开 | BlankLayout |
| `/enterprise` | EnterpriseMarketPage | 企业成员 | UserLayout |
| `/enterprise/skills` | EnterpriseSkillsPage | 企业成员 | UserLayout |
| `/enterprise/prompts` | EnterprisePromptsPage | 企业成员 | UserLayout |
| `/enterprise/:id` | EnterpriseDetailPage | 企业成员 | UserLayout |
| `/enterprise/:id/members` | EnterpriseMembersPage | 企业成员 | UserLayout |
| `/enterprise/:id/settings` | EnterpriseSettingsPage | enterprise_admin | UserLayout |
| `/my/resources` | MyResourcesPage | 登录 | UserLayout |
| `/create/skill` | CreateSkillPage | developer+ | UserLayout |
| `/create/prompt` | CreatePromptPage | developer+ | UserLayout |
| `/profile` | ProfilePage | 登录 | UserLayout |
| `/settings` | SettingsPage | 登录 | UserLayout |
| `/admin` | AdminDashboardPage | admin | AdminLayout |
| `/admin/users` | UserManagementPage | admin | AdminLayout |
| `/admin/content` | ContentReviewPage | admin | AdminLayout |
| `/admin/enterprises` | EnterpriseManagementPage | admin | AdminLayout |
| `/admin/agents` | AgentManagementPage | admin | AdminLayout |

## 2. 路由实现

### 2.1 主路由配置

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import PublicRoutes from './routes/PublicRoutes';
import ProtectedRoutes from './routes/ProtectedRoutes';
import AdminRoutes from './routes/AdminRoutes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/" element={<PublicRoutes />}>
          <Route index element={<HomePage />} />
          <Route path="market" element={<PublicMarketPage />} />
          <Route path="market/skills" element={<PublicSkillsPage />} />
          <Route path="market/prompts" element={<PublicPromptsPage />} />
          <Route path="skills/:id" element={<SkillDetailPage />} />
          <Route path="prompts/:id" element={<PromptDetailPage />} />
        </Route>

        {/* 认证路由 - 无需布局 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* 受保护路由 */}
        <Route element={<ProtectedRoutes />}>
          <Route element={<UserLayout />}>
            <Route path="/enterprise" element={<EnterpriseMarketPage />} />
            <Route path="/enterprise/skills" element={<EnterpriseSkillsPage />} />
            <Route path="/enterprise/prompts" element={<EnterprisePromptsPage />} />
            <Route path="/enterprise/:id" element={<EnterpriseDetailPage />} />
            <Route path="/enterprise/:id/members" element={<EnterpriseMembersPage />} />
            <Route path="/enterprise/:id/settings" element={<EnterpriseSettingsPage />} />
            <Route path="/my/resources" element={<MyResourcesPage />} />
            <Route path="/create/skill" element={<CreateSkillPage />} />
            <Route path="/create/prompt" element={<CreatePromptPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* 管理后台路由 */}
          <Route element={<AdminRoutes />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="content" element={<ContentReviewPage />} />
              <Route path="enterprises" element={<EnterpriseManagementPage />} />
              <Route path="agents" element={<AgentManagementPage />} />
            </Route>
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### 2.2 公开路由组件

```tsx
// src/routes/PublicRoutes.tsx
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const PublicRoutes: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={null} onLogout={() => {}} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicRoutes;
```

### 2.3 受保护路由组件

```tsx
// src/routes/ProtectedRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRoutesProps {
  allowedRoles?: string[];
}

const ProtectedRoutes: React.FC<ProtectedRoutesProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoutes;
```

### 2.4 管理员路由组件

```tsx
// src/routes/AdminRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const AdminRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoutes;
```

### 2.5 用户布局组件

```tsx
// src/layouts/UserLayout.tsx
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuthStore } from '../stores/authStore';

const UserLayout: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={logout} />
      <main className="flex-1 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
```

### 2.6 管理后台布局组件

```tsx
// src/layouts/AdminLayout.tsx
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const menuItems = [
    { path: '/admin', label: '概览', icon: <DashboardIcon /> },
    { path: '/admin/users', label: '用户管理', icon: <UserIcon /> },
    { path: '/admin/content', label: '内容审核', icon: <CheckIcon /> },
    { path: '/admin/enterprises', label: '企业管理', icon: <BuildingIcon /> },
    { path: '/admin/agents', label: 'Agent管理', icon: <BotIcon /> },
  ];

  return (
    <div className="min-h-screen flex">
      {/* 侧边栏 */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-gray-800">
          <span className="font-semibold">管理后台</span>
        </div>

        <nav className="flex-1 py-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 transition-colors ${
                  isActive || (item.path !== '/admin' && location.pathname.startsWith(item.path))
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:bg-gray-800'
                }`
              }
            >
              <span className="w-5">{item.icon}</span>
              <span className="ml-3">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.username}</div>
              <div className="text-xs text-gray-400 truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">
            {menuItems.find((item) => 
              item.path === '/admin' 
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path)
            )?.label || '管理后台'}
          </h1>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => logout()}>
              退出登录
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
```

## 3. 路由守卫

### 3.1 权限守卫

```tsx
// src/components/route-guards/RoleGuard.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

### 3.2 企业成员守卫

```tsx
// src/components/route-guards/EnterpriseGuard.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface EnterpriseGuardProps {
  children: React.ReactNode;
}

export const EnterpriseGuard: React.FC<EnterpriseGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.enterpriseId) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

### 3.3 开发者守卫

```tsx
// src/components/route-guards/DeveloperGuard.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface DeveloperGuardProps {
  children: React.ReactNode;
}

const DEVELOPER_ROLES = ['admin', 'enterprise_admin', 'developer'];

export const DeveloperGuard: React.FC<DeveloperGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !DEVELOPER_ROLES.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

## 4. 路由使用示例

### 4.1 创建Skill页面路由保护

```tsx
// 在App.tsx中使用
<Route
  path="/create/skill"
  element={
    <DeveloperGuard>
      <UserLayout>
        <CreateSkillPage />
      </UserLayout>
    </DeveloperGuard>
  }
/>
```

### 4.2 企业设置页面路由保护

```tsx
// 在App.tsx中使用
<Route
  path="/enterprise/:id/settings"
  element={
    <RoleGuard allowedRoles={['admin', 'enterprise_admin']}>
      <UserLayout>
        <EnterpriseSettingsPage />
      </UserLayout>
    </RoleGuard>
  }
/>
```

### 4.3 动态路由参数

```tsx
// Skill详情页
<Route path="/skills/:id" element={<SkillDetailPage />} />

// 在SkillDetailPage中获取参数
const { id } = useParams(); // id为Skill的ID

// 企业详情页
<Route path="/enterprise/:id" element={<EnterpriseDetailPage />} />

// 在EnterpriseDetailPage中获取参数
const { id } = useParams(); // id为企业的ID

// 企业成员管理
<Route path="/enterprise/:id/members" element={<EnterpriseMembersPage />} />

// 企业设置
<Route path="/enterprise/:id/settings" element={<EnterpriseSettingsPage />} />
```

## 5. 路由动画

### 5.1 页面切换动画

```tsx
// src/components/route-animations/PageTransition.tsx
import { ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const prevLocation = useRef(location);

  useEffect(() => {
    if (location.pathname !== prevLocation.current.pathname) {
      window.scrollTo(0, 0);
      prevLocation.current = location;
    }
  }, [location]);

  return (
    <div
      key={location.pathname}
      className="animate-fade-in"
    >
      {children}
    </div>
  );
};
```

### 5.2 应用动画配置

```tsx
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
};
```
