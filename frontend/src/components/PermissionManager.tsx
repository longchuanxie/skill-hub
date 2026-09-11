import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { permissionsApi, SkillPermissions, Visibility } from '../api/permissions';
import { userApi } from '../api/user';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

interface PermissionManagerProps {
  skillId: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

const PermissionManager: React.FC<PermissionManagerProps> = ({ skillId }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<SkillPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);

  const hasEnterprise = !!user?.enterpriseId;

  useEffect(() => {
    loadPermissions();
  }, [skillId]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await permissionsApi.getPermissions(skillId);
      setPermissions(data);
    } catch (error) {
      toast.error(t('permissions.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const { users } = await userApi.searchUsers(query);
      const existingUserIds = permissions?.collaborators.map(c => c.userId) || [];
      const filteredUsers = users.filter((u: User) => !existingUserIds.includes(u._id));
      setSearchResults(filteredUsers);
    } catch (error) {
      toast.error(t('permissions.searchFailed'));
    } finally {
      setSearching(false);
    }
  };

  const handleAddCollaborator = async (user: User) => {
    if (!permissions) return;
    
    try {
      setUpdating(true);
      await permissionsApi.addCollaborator(skillId, user._id, 'editor');
      await loadPermissions();
      setSearchQuery('');
      setSearchResults([]);
      toast.success(t('permissions.collaboratorAdded'));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || '';
      if (errorMessage.includes('same enterprise')) {
        toast.error(t('permissions.enterpriseCollaboratorOnly'));
      } else {
        toast.error(t('permissions.addCollaboratorFailed'));
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!permissions) return;
    
    try {
      setUpdating(true);
      await permissionsApi.removeCollaborator(skillId, userId);
      await loadPermissions();
      toast.success(t('permissions.collaboratorRemoved'));
    } catch (error) {
      toast.error(t('permissions.removeCollaboratorFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateCollaboratorRole = async (userId: string, role: 'viewer' | 'editor' | 'admin') => {
    if (!permissions) return;
    
    try {
      setUpdating(true);
      await permissionsApi.updateCollaboratorRole(skillId, userId, role);
      await loadPermissions();
      toast.success(t('permissions.roleUpdated'));
    } catch (error) {
      toast.error(t('permissions.updateRoleFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateVisibility = async (visibility: Visibility) => {
    if (!permissions) return;
    
    try {
      setUpdating(true);
      await permissionsApi.updatePermissions(skillId, { visibility });
      await loadPermissions();
      toast.success(t('permissions.visibilityUpdated'));
    } catch (error) {
      toast.error(t('permissions.updateVisibilityFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">{t('permissions.roleAdmin')}</Badge>;
      case 'editor':
        return <Badge variant="secondary">{t('permissions.roleWrite')}</Badge>;
      case 'viewer':
        return <Badge variant="outline">{t('permissions.roleRead')}</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getVisibilityBadge = (visibility: Visibility) => {
    switch (visibility) {
      case 'public':
        return <Badge variant="default">{t('permissions.visibilityPublic')}</Badge>;
      case 'private':
        return <Badge variant="destructive">{t('permissions.visibilityPrivate')}</Badge>;
      case 'enterprise':
        return <Badge variant="secondary">{t('permissions.visibilityEnterprise')}</Badge>;
      case 'shared':
        return <Badge variant="outline">{t('permissions.visibilityShared')}</Badge>;
      default:
        return <Badge>{visibility}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('permissions.visibilitySettings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('permissions.currentVisibility')}</p>
              <p className="text-sm text-gray-500">{t('permissions.visibilityDescription')}</p>
            </div>
            <div className="flex items-center gap-3">
              {getVisibilityBadge(permissions?.visibility || 'private')}
              <Select
                value={permissions?.visibility}
                onValueChange={(value: Visibility) => handleUpdateVisibility(value)}
                disabled={updating}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex flex-col">
                      <span>{t('permissions.visibilityPrivate')}</span>
                    </div>
                  </SelectItem>
                  {hasEnterprise && (
                    <SelectItem value="enterprise">
                      <div className="flex flex-col">
                        <span>{t('permissions.visibilityEnterprise')}</span>
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="shared">
                    <div className="flex flex-col">
                      <span>{t('permissions.visibilityShared')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex flex-col">
                      <span>{t('permissions.visibilityPublic')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              {permissions?.visibility === 'private' && t('permissions.visibilityPrivateDesc')}
              {permissions?.visibility === 'public' && t('permissions.visibilityPublicDesc')}
              {permissions?.visibility === 'enterprise' && t('permissions.visibilityEnterpriseDesc')}
              {permissions?.visibility === 'shared' && t('permissions.visibilitySharedDesc')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('permissions.collaborators')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hasEnterprise && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">提示：</span>
                  {t('permissions.collaboratorsEnterpriseNote')}
                </p>
              </div>
            )}
            <div className="relative">
              <Input
                placeholder={t('permissions.searchUsers')}
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                disabled={updating}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg p-4 space-y-2">
                {searchResults.map((user) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {user.avatar ? <AvatarImage src={user.avatar} /> : null}
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddCollaborator(user)}
                      disabled={updating}
                    >
                      {t('permissions.add')}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {permissions?.collaborators && permissions.collaborators.length > 0 ? (
              <div className="space-y-3">
                {permissions.collaborators.map((collaborator) => (
                  <div key={collaborator.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {collaborator.user?.avatar ? (
                          <AvatarImage src={collaborator.user.avatar} />
                        ) : null}
                        <AvatarFallback>
                          {collaborator.user?.username?.slice(0, 2).toUpperCase() || collaborator.username.slice(0, 2).toUpperCase() || 'UK'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{collaborator.user?.username || collaborator.username}</p>
                        <p className="text-sm text-gray-500">{collaborator.user?.email || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getRoleBadge(collaborator.role)}
                      <Select
                        value={collaborator.role}
                        onValueChange={(value: 'viewer' | 'editor' | 'admin') => 
                          handleUpdateCollaboratorRole(collaborator.userId, value)
                        }
                        disabled={updating}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">{t('permissions.roleRead')}</SelectItem>
                          <SelectItem value="editor">{t('permissions.roleWrite')}</SelectItem>
                          <SelectItem value="admin">{t('permissions.roleAdmin')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveCollaborator(collaborator.userId)}
                        disabled={updating}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('permissions.noCollaborators')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionManager;
