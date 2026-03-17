import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { enterpriseApi } from '@/api/enterprise';
import { authApi } from '@/api/auth';
import { useAuthStore } from '../stores/authStore';

interface CreateEnterpriseFormProps {
  onSuccess?: () => void;
}

const CreateEnterpriseForm: React.FC<CreateEnterpriseFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t('errors.required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await enterpriseApi.createEnterprise({ name, description });
      setName('');
      setDescription('');
      
      const updatedUser = await authApi.getMe();
      setUser(updatedUser);
      
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-black mb-6">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {t('settings.createEnterprise')}
      </h2>

      {error && (
        <Alert variant="destructive" className="mb-4 border-2 border-red-200 bg-red-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label htmlFor="enterpriseName" className="flex items-center gap-2 text-sm font-medium text-black mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {t('settings.enterpriseName')}
          </label>
          <Input
            id="enterpriseName"
            type="text"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder={t('settings.enterpriseNamePlaceholder')}
            required
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">{t('settings.createEnterpriseDesc')}</p>
        </div>

        <div className="mb-6">
          <label htmlFor="enterpriseDescription" className="flex items-center gap-2 text-sm font-medium text-black mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('settings.enterpriseDescription')}
          </label>
          <Textarea
            id="enterpriseDescription"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder={t('settings.enterpriseDescriptionPlaceholder')}
            rows={3}
            className="w-full"
          />
        </div>

        <Button type="submit" disabled={loading} className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {loading ? t('settings.creating') : t('settings.createEnterprise')}
        </Button>
      </form>
    </div>
  );
};

export default CreateEnterpriseForm;
