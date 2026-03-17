import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Layout from '../components/Layout';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { enterpriseApi } from '../api/enterprise';
import AuthSettingsSection from '../components/AuthSettingsSection';
import ResourceReviewSettingsSection from '../components/ResourceReviewSettingsSection';
import EnterpriseInfoCard from '../components/EnterpriseInfoCard';
import CreateEnterpriseForm from '../components/CreateEnterpriseForm';
import ApiKeysManager from '../components/ApiKeysManager';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { user } = useAuthStore();
  const [enterprise, setEnterprise] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadEnterprise();
  }, [user]);

  const loadEnterprise = async () => {
    if (user?.enterpriseId) {
      try {
        const enterpriseData = await enterpriseApi.getMyEnterprise();
        setEnterprise(enterpriseData);
        const isOwner = enterpriseData.owner._id === user.id;
        const member = enterpriseData.members?.find((m: any) => m.userId._id === user.id);
        setIsAdmin(isOwner || member?.role === 'admin');
      } catch (err) {
        console.error('Failed to load enterprise:', err);
      }
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError(t('settings.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('settings.passwordMinLength'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authApi.resetPassword({ token: 'manual', newPassword });
      setSuccess(t('settings.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h1 className="text-3xl font-bold text-black">{t('settings.title')}</h1>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 border-2 border-red-200 bg-red-50">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </div>
            </Alert>
          )}
          {success && (
            <Alert className="mb-6 border-2 border-green-200 bg-green-50">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-black mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('settings.changePassword')}
            </h2>
            <form onSubmit={handlePasswordChange}>
              <div className="mb-5">
                <label htmlFor="currentPassword" className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {t('settings.currentPassword')}
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                  placeholder={t('settings.passwordPlaceholder')}
                  required
                  className="w-full"
                />
              </div>

              <div className="mb-5">
                <label htmlFor="newPassword" className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t('settings.newPassword')}
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                  placeholder={t('settings.newPasswordPlaceholder')}
                  required
                  className="w-full"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-black mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {t('settings.confirmNewPassword')}
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.confirmPasswordPlaceholder')}
                  required
                  className="w-full"
                />
              </div>

              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {loading ? t('settings.changing') : t('settings.changePasswordButton')}
              </Button>
            </form>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-black mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {t('settings.notificationSettings')}
            </h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <Checkbox defaultChecked className="data-[state=checked]:bg-black data-[state=checked]:border-black" />
                <span className="text-gray-700 group-hover:text-black transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  {t('settings.ratingNotifications')}
                </span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <Checkbox defaultChecked className="data-[state=checked]:bg-black data-[state=checked]:border-black" />
                <span className="text-gray-700 group-hover:text-black transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('settings.downloadNotifications')}
                </span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <Checkbox className="data-[state=checked]:bg-black data-[state=checked]:border-black" />
                <span className="text-gray-700 group-hover:text-black transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {t('settings.enterpriseNotifications')}
                </span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
            <ApiKeysManager />
          </div>

          {enterprise && (
            <EnterpriseInfoCard enterprise={enterprise} isAdmin={isAdmin} onUpdate={loadEnterprise} />
          )}

          {!enterprise && user && (
            <CreateEnterpriseForm onSuccess={loadEnterprise} />
          )}

          {enterprise && (
            <AuthSettingsSection enterpriseId={enterprise._id} isAdmin={isAdmin} />
          )}

          {enterprise && (
            <ResourceReviewSettingsSection enterpriseId={enterprise._id} isAdmin={isAdmin} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
