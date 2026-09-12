import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, DashboardStats } from '@/api/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Heading } from '@/components/typography/Heading';
import { Text } from '@/components/typography/Text';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Heading level={1}>{t('admin.dashboard.title')}</Heading>
        <Text className="text-gray-600 mt-2">{t('admin.dashboard.subtitle')}</Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t('admin.dashboard.totalUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
            <div className="text-xs text-green-600 mt-1">
              +{stats?.newUsersToday || 0} {t('admin.dashboard.today')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t('admin.dashboard.totalEnterprises')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalEnterprises || 0}</div>
            <div className="text-xs text-green-600 mt-1">
              +{stats?.newEnterprisesToday || 0} {t('admin.dashboard.today')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t('admin.dashboard.totalSkills')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalSkills || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t('admin.dashboard.totalPrompts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalPrompts || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t('admin.dashboard.activeUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeUsersLast7Days || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t('admin.dashboard.pendingApprovals')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats?.pendingApprovals || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/admin/users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>{t('admin.dashboard.userManagement')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-gray-600">{t('admin.dashboard.userManagementDesc')}</Text>
              <Button className="mt-4">{t('admin.dashboard.goToUsers')}</Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/enterprises">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>{t('admin.dashboard.enterpriseManagement')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-gray-600">{t('admin.dashboard.enterpriseManagementDesc')}</Text>
              <Button className="mt-4">{t('admin.dashboard.goToEnterprises')}</Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/audit-logs">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>{t('admin.auditLogs.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-gray-600">{t('admin.auditLogs.subtitle')}</Text>
              <Button className="mt-4">{t('admin.auditLogs.goTo')}</Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
