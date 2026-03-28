import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, EnterpriseListItem } from '@/api/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Heading } from '@/components/typography/Heading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Search, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdminEnterprisesPage = () => {
  const { t } = useTranslation();
  const [enterprises, setEnterprises] = useState<EnterpriseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    enterpriseId: string;
    enterpriseName: string;
    newPlan: string;
  }>({ open: false, enterpriseId: '', enterpriseName: '', newPlan: '' });

  useEffect(() => {
    fetchEnterprises();
  }, [page, planFilter]);

  const fetchEnterprises = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (planFilter !== 'all') {
        params.plan = planFilter;
      }
      if (search) {
        params.search = search;
      }
      const data = await adminApi.getEnterpriseList(params);
      setEnterprises(data.enterprises);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load enterprises');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEnterprises();
  };

  const handleUpdatePlan = (enterpriseId: string, enterpriseName: string, newPlan: string) => {
    setConfirmDialog({ open: true, enterpriseId, enterpriseName, newPlan });
  };

  const confirmUpdatePlan = async () => {
    try {
      await adminApi.updateEnterprisePlan(confirmDialog.enterpriseId, confirmDialog.newPlan);
      toast.success(`Plan updated for ${confirmDialog.enterpriseName}`);
      setConfirmDialog({ open: false, enterpriseId: '', enterpriseName: '', newPlan: '' });
      fetchEnterprises();
    } catch (error) {
      toast.error('Failed to update plan');
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800',
    };
    return <Badge className={colors[plan] || colors.free}>{plan}</Badge>;
  };

  if (loading && enterprises.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/admin" className="text-blue-600 hover:underline mb-2 inline-block">
              ← {t('admin.dashboard.title')}
            </Link>
            <Heading level={1}>{t('admin.enterprises.title')}</Heading>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('admin.enterprises.searchEnterprises')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.enterprises.searchEnterprises')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('admin.enterprises.searchEnterprises')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">{t('admin.enterprises.searchEnterprises')}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.enterprises.title')} ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.enterprises.name')}</TableHead>
                <TableHead>{t('admin.enterprises.owner')}</TableHead>
                <TableHead>{t('admin.enterprises.memberCount')}</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>{t('admin.enterprises.createdAt')}</TableHead>
                <TableHead>{t('admin.enterprises.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enterprises.map((enterprise) => (
                <TableRow key={enterprise._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {enterprise.logo && (
                          <AvatarImage src={enterprise.logo} />
                        )}
                        <AvatarFallback>
                          <Building2 className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{enterprise.name}</div>
                        {enterprise.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {enterprise.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>{enterprise.owner.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{enterprise.owner.username}</div>
                        <div className="text-xs text-gray-500">{enterprise.owner.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{enterprise.memberCount} members</Badge>
                  </TableCell>
                  <TableCell>{getPlanBadge(enterprise.subscription.plan)}</TableCell>
                  <TableCell>
                    {new Date(enterprise.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={enterprise.subscription.plan}
                      onValueChange={(newPlan) =>
                        handleUpdatePlan(enterprise._id, enterprise.name, newPlan)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDialog.open}
        title="Change Enterprise Plan"
        message={`Are you sure you want to change ${confirmDialog.enterpriseName}'s plan to ${confirmDialog.newPlan}?`}
        onConfirm={confirmUpdatePlan}
        onCancel={() => setConfirmDialog({ open: false, enterpriseId: '', enterpriseName: '', newPlan: '' })}
      />
    </div>
  );
};

export default AdminEnterprisesPage;
