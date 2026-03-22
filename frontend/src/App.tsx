import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import SkillsMarketPage from './pages/SkillsMarketPage';
import PromptsMarketPage from './pages/PromptsMarketPage';
import MyResourcesPage from './pages/MyResourcesPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import UploadPage from './pages/UploadPage';
import SkillDetailPage from './pages/SkillDetailPage';
import SkillEditPage from './pages/SkillEditPage';
import SkillOnlineTestPage from './pages/SkillOnlineTestPage';
import SkillPermissionsPage from './pages/SkillPermissionsPage';
import SkillVersionHistoryPage from './pages/SkillVersionHistoryPage';
import SkillVersionComparePage from './pages/SkillVersionComparePage';
import SkillPreviewPage from './pages/SkillPreviewPage';
import PromptDetailPage from './pages/PromptDetailPage';
import PromptEditPage from './pages/PromptEditPage';
import PromptVersionHistoryPage from './pages/PromptVersionHistoryPage';
import PromptVersionComparePage from './pages/PromptVersionComparePage';
import CustomPageView from './pages/CustomPageView';
import OAuthCallback from './pages/OAuthCallback';
import ApiResourcesPage from './pages/ApiResourcesPage';
import AgentDetailPage from './pages/AgentDetailPage';
import CreateAgentPage from './pages/CreateAgentPage';
import { useAuthStore } from './stores/authStore';

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
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/search" element={<Layout><SearchPage /></Layout>} />
        <Route path="/skills" element={<SkillsMarketPage />} />
        <Route path="/skills/:id" element={<SkillDetailPage />} />
        <Route path="/skills/:id/preview" element={<SkillPreviewPage />} />
        <Route path="/skills/:id/edit" element={<ProtectedRoute><SkillEditPage /></ProtectedRoute>} />
        <Route path="/skills/:id/test" element={<ProtectedRoute><SkillOnlineTestPage /></ProtectedRoute>} />
        <Route path="/skills/:id/permissions" element={<ProtectedRoute><SkillPermissionsPage /></ProtectedRoute>} />
        <Route path="/skills/:id/versions" element={<ProtectedRoute><SkillVersionHistoryPage /></ProtectedRoute>} />
        <Route path="/skills/:id/versions/compare" element={<ProtectedRoute><SkillVersionComparePage /></ProtectedRoute>} />
        <Route path="/prompts" element={<PromptsMarketPage />} />
        <Route path="/prompts/:id" element={<PromptDetailPage />} />
        <Route path="/prompts/:id/edit" element={<ProtectedRoute><PromptEditPage /></ProtectedRoute>} />
        <Route path="/prompts/:id/versions" element={<ProtectedRoute><PromptVersionHistoryPage /></ProtectedRoute>} />
        <Route path="/prompts/:id/compare" element={<ProtectedRoute><PromptVersionComparePage /></ProtectedRoute>} />
        <Route path="/page/:pageKey" element={<CustomPageView />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/my/resources" element={<ProtectedRoute><MyResourcesPage /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/agents" element={<ApiResourcesPage />} />
        <Route path="/agents/new" element={<ProtectedRoute><CreateAgentPage /></ProtectedRoute>} />
        <Route path="/agents/:id" element={<ProtectedRoute><AgentDetailPage /></ProtectedRoute>} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
