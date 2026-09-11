import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Text } from '@/components/typography/Text';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { UserPlus, UserMinus, Users, Mail, X } from 'lucide-react';
import { enterpriseApi, Invitation } from '@/api/enterprise';
import { useTranslation } from 'react-i18next';

interface EnterpriseMemberManagerProps {
  enterpriseId: string;
  isAdmin: boolean;
  members: Array<{
    userId: {
      _id: string;
      username: string;
      email: string;
      avatar?: string;
    };
    role: 'admin' | 'member';
    joinedAt: string;
  }>;
  onUpdate?: () => void;
}

const EnterpriseMemberManager: React.FC<EnterpriseMemberManagerProps> = ({
  enterpriseId,
  isAdmin,
  members,
  onUpdate
}) => {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'remove_member' | 'cancel_invitation';
    targetId: string;
    targetName: string;
  }>({ open: false, type: 'remove_member', targetId: '', targetName: '' });

  useEffect(() => {
    if (isAdmin) {
      loadInvitations();
    }
  }, [enterpriseId, isAdmin]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await enterpriseApi.getInvitations(enterpriseId);
      setInvitations(data);
    } catch (error) {
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setLoading(true);
      await enterpriseApi.inviteMember(enterpriseId, { email: inviteEmail, role: inviteRole });
      toast.success('Invitation sent successfully');
      setInviteEmail('');
      loadInvitations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (memberId: string, username: string) => {
    setConfirmDialog({
      open: true,
      type: 'remove_member',
      targetId: memberId,
      targetName: username
    });
  };

  const handleCancelInvitation = (invitationId: string, email: string) => {
    setConfirmDialog({
      open: true,
      type: 'cancel_invitation',
      targetId: invitationId,
      targetName: email
    });
  };

  const confirmAction = async () => {
    try {
      if (confirmDialog.type === 'remove_member') {
        await enterpriseApi.removeMember(enterpriseId, confirmDialog.targetId);
        toast.success('Member removed successfully');
      } else if (confirmDialog.type === 'cancel_invitation') {
        await enterpriseApi.cancelInvitation(enterpriseId, confirmDialog.targetId);
        toast.success('Invitation cancelled successfully');
      }
      setConfirmDialog({ open: false, type: 'remove_member', targetId: '', targetName: '' });
      loadInvitations();
      onUpdate?.();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      await enterpriseApi.updateMemberRole(enterpriseId, memberId, newRole);
      toast.success('Member role updated');
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      member: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={colors[role] || colors.member}>{role}</Badge>;
  };

  const getInvitationStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={colors[status] || colors.pending}>{status}</Badge>;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('admin.enterprises.members.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="members">
          <TabsList className="mb-4">
            <TabsTrigger value="members">{t('admin.enterprises.members.title')} ({members.length})</TabsTrigger>
            <TabsTrigger value="invitations">Invitations ({invitations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <div className="mb-4">
              <form onSubmit={handleInvite} className="flex gap-2 flex-wrap">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 min-w-[200px]"
                />
                <Select
                  value={inviteRole}
                  onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">{t('admin.enterprises.members.roleOptions.member')}</SelectItem>
                    <SelectItem value="admin">{t('admin.enterprises.members.roleOptions.admin')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={loading}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('admin.enterprises.members.inviteMember')}
                </Button>
              </form>
            </div>

            {loading && members.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.users.username')}</TableHead>
                    <TableHead>{t('admin.users.role')}</TableHead>
                    <TableHead>{t('admin.enterprises.members.joinedAt')}</TableHead>
                    <TableHead>{t('admin.enterprises.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.userId._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {member.userId.avatar && (
                              <AvatarImage src={member.userId.avatar} />
                            )}
                            <AvatarFallback>{member.userId.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.userId.username}</div>
                            <div className="text-sm text-gray-500">{member.userId.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={member.role}
                          onValueChange={(value: 'admin' | 'member') =>
                            handleUpdateMemberRole(member.userId._id, value)
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">{t('admin.enterprises.members.roleOptions.member')}</SelectItem>
                            <SelectItem value="admin">{t('admin.enterprises.members.roleOptions.admin')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleRemoveMember(member.userId._id, member.userId.username)
                          }
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="invitations">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <Text>No pending invitations</Text>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>{t('admin.users.role')}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>{t('admin.enterprises.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation._id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                      <TableCell>{getInvitationStatusBadge(invitation.status)}</TableCell>
                      <TableCell>{invitation.invitedBy.username}</TableCell>
                      <TableCell>
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {invitation.status === 'pending' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleCancelInvitation(invitation._id, invitation.email)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.type === 'remove_member' ? t('admin.enterprises.members.removeMember') : 'Cancel Invitation'}
        message={
          confirmDialog.type === 'remove_member'
            ? t('admin.enterprises.members.confirmRemove', { targetName: confirmDialog.targetName })
            : `Are you sure you want to cancel the invitation for ${confirmDialog.targetName}?`
        }
        onConfirm={confirmAction}
        onCancel={() => setConfirmDialog({ open: false, type: 'remove_member', targetId: '', targetName: '' })}
      />
    </Card>
  );
};

export default EnterpriseMemberManager;
