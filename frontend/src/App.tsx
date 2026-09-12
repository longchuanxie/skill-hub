import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import RoleRoute from './components/router/RoleRoute';
import { useAuthStore } from './stores/authStore';

// Route-level code splitting: every page is its own chunk, loaded on demand.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const SkillsMarketPage = lazy(() => import('./pages/SkillsMarketPage'));
const PromptsMarketPage = lazy(() => import('./pages/PromptsMarketPage'));
const MyResourcesPage = lazy(() => import('./pages/MyResourcesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const SkillDetailPage = lazy(() => import('./pages/SkillDetailPage'));
const SkillEditPage = lazy(() => import('./pages/SkillEditPage'));
const SkillPermissionsPage = lazy(() => import('./pages/SkillPermissionsPage'));
const SkillVersionHistoryPage = lazy(() => import('./pages/SkillVersionHistoryPage'));
const SkillPreviewPage = lazy(() => import('./pages/SkillPreviewPage'));
const PromptDetailPage = lazy(() => import('./pages/PromptDetailPage'));
const PromptEditPage = lazy(() => import('./pages/PromptEditPage'));
const PromptVersionHistoryPage = lazy(() => import('./pages/PromptVersionHistoryPage'));
const CustomPageView = lazy(() => import('./pages/CustomPageView'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const ApiResourcesPage = lazy(() => import('./pages/ApiResourcesPage'));
const AgentDetailPage = lazy(() => import('./pages/AgentDetailPage'));
const CreateAgentPage = lazy(() => import('./pages/CreateAgentPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminEnterprisesPage = lazy(() => import('./pages/AdminEnterprisesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route
              path="/"
              element={
                <Layout>
                  <HomePage />
                </Layout>
              }
            />
            <Route
              path="/search"
              element={
                <Layout>
                  <SearchPage />
                </Layout>
              }
            />
            <Route path="/skills" element={<SkillsMarketPage />} />
            <Route path="/skills/:id" element={<SkillDetailPage />} />
            <Route path="/skills/:id/preview" element={<SkillPreviewPage />} />
            <Route
              path="/skills/:id/edit"
              element={
                <ProtectedRoute>
                  <SkillEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/skills/:id/permissions"
              element={
                <ProtectedRoute>
                  <SkillPermissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/skills/:id/versions"
              element={
                <ProtectedRoute>
                  <SkillVersionHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route path="/prompts" element={<PromptsMarketPage />} />
            <Route path="/prompts/:id" element={<PromptDetailPage />} />
            <Route
              path="/prompts/:id/edit"
              element={
                <ProtectedRoute>
                  <PromptEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prompts/:id/versions"
              element={
                <ProtectedRoute>
                  <PromptVersionHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route path="/page/:pageKey" element={<CustomPageView />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route
              path="/my/resources"
              element={
                <ProtectedRoute>
                  <MyResourcesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/agents" element={<ApiResourcesPage />} />
            <Route
              path="/agents/new"
              element={
                <ProtectedRoute>
                  <CreateAgentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/:id"
              element={
                <ProtectedRoute>
                  <AgentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <RoleRoute roles={['admin', 'super_admin']}>
                  <Layout>
                    <AdminDashboardPage />
                  </Layout>
                </RoleRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RoleRoute roles={['admin', 'super_admin']}>
                  <Layout>
                    <AdminUsersPage />
                  </Layout>
                </RoleRoute>
              }
            />
            <Route
              path="/admin/enterprises"
              element={
                <RoleRoute roles={['admin', 'super_admin']}>
                  <Layout>
                    <AdminEnterprisesPage />
                  </Layout>
                </RoleRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
