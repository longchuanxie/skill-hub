import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, UserListItem } from '@/api/admin';
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
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdminUsersPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    username: string;
    newRole: string;
  }>({ open: false, userId: '', username: '', newRole: '' });

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      if (search) {
        params.search = search;
      }
      const data = await adminApi.getUserList(params);
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleUpdateRole = (userId: string, username: string, newRole: string) => {
    setConfirmDialog({ open: true, userId, username, newRole });
  };

  const confirmUpdateRole = async () => {
    try {
      await adminApi.updateUserRole(confirmDialog.userId, confirmDialog.newRole);
      toast.success(`Role updated for ${confirmDialog.username}`);
      setConfirmDialog({ open: false, userId: '', username: '', newRole: '' });
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      enterprise_admin: 'bg-purple-100 text-purple-800',
      developer: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={colors[role] || colors.user}>{role}</Badge>;
  };

  const getVerificationBadge = (verified: boolean) => {
    return verified ? (
      <Badge className="bg-green-100 text-green-800">Verified</Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800">Unverified</Badge>
    );
  };

  if (loading && users.length === 0) {
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
            <Heading level={1}>{t('admin.users.title')}</Heading>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('admin.users.searchUsers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.searchUsers')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('admin.users.searchUsers')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.users.role')}</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.users.role')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.users.roleOptions.admin')}</SelectItem>
                  <SelectItem value="admin">{t('admin.users.roleOptions.admin')}</SelectItem>
                  <SelectItem value="enterprise_admin">{t('admin.users.roleOptions.enterprise_admin')}</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="user">{t('admin.users.roleOptions.user')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">{t('admin.users.searchUsers')}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.users.title')} ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.users.username')}</TableHead>
                <TableHead>{t('admin.users.role')}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>{t('admin.users.enterprise')}</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>{t('admin.users.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {user.avatar && (
                          <AvatarImage src={user.avatar} />
                        )}
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getVerificationBadge(user.isEmailVerified)}</TableCell>
                  <TableCell>
                    {user.enterpriseName || (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? (
                      new Date(user.lastLoginAt).toLocaleDateString()
                    ) : (
                      <span className="text-gray-400 text-sm">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.role}
                      onValueChange={(newRole) =>
                        handleUpdateRole(user._id, user.username, newRole)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{t('admin.users.roleOptions.admin')}</SelectItem>
                        <SelectItem value="enterprise_admin">{t('admin.users.roleOptions.enterprise_admin')}</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="user">{t('admin.users.roleOptions.user')}</SelectItem>
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
        title={t('admin.users.editRole')}
        message={`${t('admin.users.confirmDelete', { username: confirmDialog.username, newRole: confirmDialog.newRole })}`}
        onConfirm={confirmUpdateRole}
        onCancel={() => setConfirmDialog({ open: false, userId: '', username: '', newRole: '' })}
      />
    </div>
  );
};

export default AdminUsersPage;
