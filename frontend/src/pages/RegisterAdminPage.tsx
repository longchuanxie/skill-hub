import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '../api/auth';

// Target of admin invitation email links: /register/admin?code=xxx
const RegisterAdminPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    inviteCode: searchParams.get('code') || '',
    email: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.registerAdmin(form);
      navigate('/login');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || t('registerAdmin.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">{t('registerAdmin.title')}</h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          {t('registerAdmin.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="inviteCode">{t('registerAdmin.inviteCode')}</Label>
            <Input
              id="inviteCode"
              value={form.inviteCode}
              onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">{t('registerAdmin.email')}</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="username">{t('registerAdmin.username')}</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">{t('registerAdmin.password')}</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t('registerAdmin.submitting') : t('registerAdmin.submit')}
          </Button>
        </form>

        <p className="text-center mt-4 text-sm">
          {t('registerAdmin.hasAccount')}{' '}
          <Link to="/login" className="underline">
            {t('registerAdmin.login')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterAdminPage;
