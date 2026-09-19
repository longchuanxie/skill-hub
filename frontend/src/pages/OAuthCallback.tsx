import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth';

// The backend redirects here with tokens in the URL fragment (#token=...),
// which never reaches server logs or referrers the way a query string does.
const readFragmentParams = (): URLSearchParams => {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash);
};

const OAuthCallback = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, setRefreshToken, setUser, isAuthenticated } = useAuthStore();
  const [message, setMessage] = useState(t('oauth.completing'));

  useEffect(() => {
    const handleCallback = async () => {
      const fragmentParams = readFragmentParams();
      // Query fallback covers error params from the backend (?error=...).
      const token = fragmentParams.get('token') || searchParams.get('token');
      const refreshToken = fragmentParams.get('refreshToken');
      const error = searchParams.get('error') || fragmentParams.get('error');

      if (error) {
        navigate('/login?error=oauth_failed', { replace: true });
        return;
      }

      if (!token) {
        navigate('/login?error=missing_token', { replace: true });
        return;
      }

      setToken(token);
      if (refreshToken) setRefreshToken(refreshToken);

      try {
        // Hydrate the user from the API instead of decoding the JWT - the
        // token payload carries ids/roles, not profile fields.
        const user = await authApi.getMe();
        setUser({
          id: (user as unknown as { _id: string })._id ?? user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          enterpriseId: (user as unknown as { enterpriseId?: string }).enterpriseId,
          avatar: user.avatar,
          createdAt: String(user.createdAt ?? new Date().toISOString()),
        });
        navigate('/', { replace: true });
      } catch {
        setMessage(t('oauth.failed'));
        navigate('/login?error=invalid_token', { replace: true });
      }
    };

    if (!isAuthenticated) {
      handleCallback();
    } else {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4" />
        <p className="text-gray-600 dark:text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
