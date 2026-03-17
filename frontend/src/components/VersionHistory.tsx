import { useState, useEffect } from 'react';
import { versionsApi, ResourceVersion } from '../api/versions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface VersionHistoryProps {
  resourceId: string;
  resourceType: 'skill' | 'prompt';
  currentVersion: string;
  onRollback?: (version: string) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  resourceId,
  resourceType,
  currentVersion,
  onRollback
}) => {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<ResourceVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const data = await versionsApi.getVersions(resourceId, resourceType);
        setVersions(data);
      } catch (error) {
        console.error('Failed to fetch versions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [resourceId, resourceType]);

  const handleRollback = async (version: string) => {
    if (!window.confirm(t('version.rollbackConfirm', { version }))) {
      return;
    }

    try {
      setRollingBack(version);
      await versionsApi.rollbackVersion(resourceId, resourceType, version);
      onRollback?.(version);
      alert(t('version.rollbackSuccess'));
    } catch (error) {
      console.error('Failed to rollback:', error);
      alert(t('version.rollbackFailed'));
    } finally {
      setRollingBack(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">{t('version.noVersions')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('version.history')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {versions.map((version) => (
            <div
              key={version._id}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                version.version === currentVersion ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-lg">v{version.version}</span>
                  {version.version === currentVersion && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      {t('version.current')}
                    </span>
                  )}
                </div>
                {version.changelog && (
                  <p className="text-sm text-gray-600 mt-1">{version.changelog}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(version.createdAt).toLocaleDateString()}
                </p>
              </div>
              {version.version !== currentVersion && onRollback && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRollback(version.version)}
                  disabled={rollingBack === version.version}
                >
                  {rollingBack === version.version ? t('version.rollingBack') : t('version.rollback')}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VersionHistory;
