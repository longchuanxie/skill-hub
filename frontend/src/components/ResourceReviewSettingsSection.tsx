import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { enterpriseApi } from '@/api/enterprise';

export interface ResourceReviewSettings {
  autoApprove: boolean;
  enableContentFilter: boolean;
}

interface ResourceReviewSettingsSectionProps {
  enterpriseId: string;
  isAdmin: boolean;
}

const ResourceReviewSettingsSection: React.FC<ResourceReviewSettingsSectionProps> = ({ enterpriseId, isAdmin }) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<ResourceReviewSettings>({
    autoApprove: false,
    enableContentFilter: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, [enterpriseId]);

  const loadSettings = async () => {
    try {
      const data = await enterpriseApi.getResourceReviewSettings(enterpriseId);
      setSettings(data);
    } catch (err) {
      console.error('Failed to load resource review settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof ResourceReviewSettings, value: boolean) => {
    if (!isAdmin) return;

    const newSettings = { ...settings, [key]: value };

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await enterpriseApi.updateResourceReviewSettings(enterpriseId, { [key]: value });
      setSettings(updated);
      setSuccess(t('settings.updateSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('errors.networkError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-black mb-6">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        {t('settings.resourceReviewSettings')}
      </h2>

      {error && (
        <Alert variant="destructive" className="mb-4 border-2 border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-4 border-2 border-green-200 bg-green-50">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <Label htmlFor="autoApprove" className="text-base font-medium text-black flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t('settings.autoApprove')}
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              {t('settings.autoApproveDesc')}
            </p>
          </div>
          <Switch
            id="autoApprove"
            checked={settings.autoApprove}
            onCheckedChange={(checked) => handleToggle('autoApprove', checked)}
            disabled={!isAdmin || saving}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <Label htmlFor="enableContentFilter" className="text-base font-medium text-black flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('settings.enableContentFilter')}
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              {t('settings.enableContentFilterDesc')}
            </p>
          </div>
          <Switch
            id="enableContentFilter"
            checked={settings.enableContentFilter}
            onCheckedChange={(checked) => handleToggle('enableContentFilter', checked)}
            disabled={!isAdmin || saving}
          />
        </div>
      </div>
    </div>
  );
};

export default ResourceReviewSettingsSection;
