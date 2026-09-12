import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../stores/authStore';
import { enterpriseApi } from '../api/enterprise';

// Target of invitation email links: /invitations?token=xxx
// Accepts the invitation with the current account (email must match).
const InvitationAcceptPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || !isAuthenticated || status !== 'idle') return;
    setStatus('working');
    enterpriseApi
      .acceptInvitation(token)
      .then(() => {
        setStatus('done');
        setMessage(t('invitations.accepted'));
      })
      .catch((err: { response?: { data?: { message?: string; code?: string } } }) => {
        setStatus('error');
        setMessage(
          err.response?.data?.message || err.response?.data?.code || t('invitations.failed'),
        );
      });
  }, [token, isAuthenticated, status, t]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: { pathname: `/invitations?token=${token}` } }} />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">{t('invitations.title')}</h1>
      {status === 'idle' || status === 'working' ? (
        <>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
          <p className="text-muted-foreground">{t('invitations.accepting')}</p>
        </>
      ) : status === 'done' ? (
        <>
          <p className="text-green-600">{message}</p>
          <Button onClick={() => navigate('/settings')}>{t('invitations.goSettings')}</Button>
        </>
      ) : (
        <>
          <p className="text-red-600">{message}</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            {t('common.back')}
          </Button>
        </>
      )}
    </div>
  );
};

export default InvitationAcceptPage;
