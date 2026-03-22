# SkillHub 前端 - OAuth2认证拓展设计

## 1. 概述

### 1.1 需求背景

企业私部署场景下，前端需要支持OAuth2/OIDC协议实现与企业身份提供商（IdP）的单点登录（SSO）。本设计涵盖用户登录、企业SSO配置、管理员OAuth2客户端管理等功能的完整前端实现。

### 1.2 设计目标

- 支持多种OAuth2提供商的登录按钮和流程
- 提供企业管理员SSO配置界面
- 支持用户账户关联和解绑OAuth2账户
- 提供管理员OAuth2客户端管理界面
- 保持现有邮箱登录方式不受影响

## 2. 登录页面OAuth2集成

### 2.1 登录页面改造

```tsx
// src/pages/User/LoginWithOAuthPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Alert } from '../../components/common/Alert';

interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const OAUTH_PROVIDERS: OAuthProvider[] = [
  { id: 'azure', name: 'Microsoft', icon: '/icons/azure.svg', color: '#0078D4' },
  { id: 'okta', name: 'Okta', icon: '/icons/okta.svg', color: '#007DC1' },
  { id: 'google', name: 'Google', icon: '/icons/google.svg', color: '#4285F4' },
  { id: 'github', name: 'GitHub', icon: '/icons/github.svg', color: '#333333' },
];

interface LoginWithOAuthPageProps {}

const LoginWithOAuthPage: React.FC<LoginWithOAuthPageProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const oauthParams = searchParams.get('oauth_params');
  const redirectUri = searchParams.get('redirect_uri') || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUri);
    }
  }, [isAuthenticated, navigate, redirectUri]);

  const initiateOAuthLogin = (providerId: string) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_redirect_uri', redirectUri);
    
    const params = new URLSearchParams({
      client_id: 'skillhub-web',
      redirect_uri: `${window.location.origin}/oauth/callback`,
      response_type: 'code',
      scope: 'openid profile email offline_access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      provider: providerId,
    });

    window.location.href = `/api/oauth/authorize?${params.toString()}`;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ email, password });
      navigate(redirectUri);
    } catch (err: any) {
      setError(err.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">登录 SkillHub</h1>
          <p className="text-gray-600 mt-2">欢迎回来</p>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" onClose={() => setError('')} />}

        <div className="space-y-3 mb-6">
          {OAUTH_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => initiateOAuthLogin(provider.id)}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <img src={provider.icon} alt={provider.name} className="w-5 h-5" />
              <span>使用 {provider.name} 账号登录</span>
            </button>
          ))}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">或使用邮箱登录</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              邮箱
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              密码
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          <div className="flex items-center justify-between mb-6">
            <Checkbox label="记住我" />
            <Link to="/forgot-password" className="text-sm text-primary">
              忘记密码?
            </Link>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            登录
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          还没有账号? <Link to="/register" className="text-primary">立即注册</Link>
        </div>
      </div>
    </div>
  );
};

const generateState = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(hash))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

export default LoginWithOAuthPage;
```

### 2.2 OAuth回调页面

```tsx
// src/pages/OAuthCallbackPage.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const storedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
      const redirectUri = sessionStorage.getItem('oauth_redirect_uri') || '/';

      if (error) {
        navigate('/login', { state: { error: searchParams.get('error_description') } });
        return;
      }

      if (!code || !state || state !== storedState) {
        navigate('/login', { state: { error: '无效的授权请求' } });
        return;
      }

      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_code_verifier');
      sessionStorage.removeItem('oauth_redirect_uri');

      try {
        const response = await fetch('/api/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${window.location.origin}/oauth/callback`,
            client_id: 'skillhub-web',
            client_secret: 'web-client-secret',
            code_verifier: codeVerifier || '',
          }).toString(),
        });

        if (!response.ok) {
          throw new Error('Token exchange failed');
        }

        const tokens = await response.json();
        await loginWithOAuthToken(tokens.access_token);
        navigate(redirectUri);
      } catch (err) {
        navigate('/login', { state: { error: 'OAuth登录失败' } });
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner className="h-16 w-16 mx-auto mb-4" />
        <p className="text-gray-600">正在完成登录...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
```

## 3. 企业SSO配置页面

### 3.1 企业SSO设置页面

```tsx
// src/pages/Enterprise/EnterpriseSSOSettingsPage.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Switch } from '../../components/common/Switch';
import { Alert } from '../../components/common/Alert';

interface SSOConfig {
  enabled: boolean;
  provider: 'azure' | 'okta' | 'keycloak' | 'custom';
  config: {
    clientId: string;
    clientSecret: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    issuer: string;
    scopes: string[];
  };
  mappings: {
    emailField: string;
    usernameField?: string;
    firstNameField?: string;
    lastNameField?: string;
  };
  autoProvision: boolean;
  allowedDomains: string[];
  enforceSSO: boolean;
}

const PROVIDER_TEMPLATES = {
  azure: {
    name: 'Microsoft Azure AD',
    authorizationEndpoint: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
    issuer: 'https://login.microsoftonline.com/{tenant}/v2.0',
    scopes: ['openid', 'profile', 'email', 'User.Read'],
  },
  okta: {
    name: 'Okta',
    authorizationEndpoint: 'https://{your-domain}.okta.com/oauth2/default/v1/authorize',
    tokenEndpoint: 'https://{your-domain}.okta.com/oauth2/default/v1/token',
    issuer: 'https://{your-domain}.okta.com/oauth2/default',
    scopes: ['openid', 'profile', 'email'],
  },
  keycloak: {
    name: 'Keycloak',
    authorizationEndpoint: 'https://keycloak.example.com/realms/{realm}/protocol/openid-connect/auth',
    tokenEndpoint: 'https://keycloak.example.com/realms/{realm}/protocol/openid-connect/token',
    issuer: 'https://keycloak.example.com/realms/{realm}',
    scopes: ['openid', 'profile', 'email'],
  },
};

const EnterpriseSSOSettingsPage: React.FC = () => {
  const { id: enterpriseId } = useParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [config, setConfig] = useState<SSOConfig>({
    enabled: false,
    provider: 'azure',
    config: {
      clientId: '',
      clientSecret: '',
      authorizationEndpoint: '',
      tokenEndpoint: '',
      issuer: '',
      scopes: ['openid', 'profile', 'email'],
    },
    mappings: {
      emailField: 'email',
      usernameField: 'username',
      firstNameField: 'given_name',
      lastNameField: 'family_name',
    },
    autoProvision: true,
    allowedDomains: [],
    enforceSSO: false,
  });

  const handleProviderChange = (provider: SSOConfig['provider']) => {
    const template = PROVIDER_TEMPLATES[provider];
    if (template) {
      setConfig({
        ...config,
        provider,
        config: {
          ...config.config,
          authorizationEndpoint: template.authorizationEndpoint,
          tokenEndpoint: template.tokenEndpoint,
          issuer: template.issuer,
          scopes: template.scopes,
        },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await enterprisesApi.updateSSO(enterpriseId!, config);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/enterprises/${enterpriseId}/sso/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error('连接测试失败');
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '连接测试失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">企业SSO设置</h1>

      {error && <Alert type="error" message={error} className="mb-4" onClose={() => setError('')} />}
      {success && <Alert type="success" message="保存成功" className="mb-4" onClose={() => setSuccess(false)} />}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>基本设置</CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">启用SSO</label>
                  <p className="text-sm text-gray-500">启用后用户可通过企业IdP登录</p>
                </div>
                <Switch
                  checked={config.enabled}
                  onChange={(checked) => setConfig({ ...config, enabled: checked })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">身份提供商</label>
                <Select
                  value={config.provider}
                  onChange={(e) => handleProviderChange(e.target.value as SSOConfig['provider'])}
                  options={[
                    { value: 'azure', label: 'Microsoft Azure AD' },
                    { value: 'okta', label: 'Okta' },
                    { value: 'keycloak', label: 'Keycloak' },
                    { value: 'custom', label: '自定义OIDC' },
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>身份提供商配置</CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Client ID</label>
                <Input
                  value={config.config.clientId}
                  onChange={(e) => setConfig({
                    ...config,
                    config: { ...config.config, clientId: e.target.value }
                  })}
                  placeholder="在IdP中注册的应用ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Client Secret</label>
                <Input
                  type="password"
                  value={config.config.clientSecret}
                  onChange={(e) => setConfig({
                    ...config,
                    config: { ...config.config, clientSecret: e.target.value }
                  })}
                  placeholder="在IdP中注册的密钥"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Authorization Endpoint</label>
                <Input
                  value={config.config.authorizationEndpoint}
                  onChange={(e) => setConfig({
                    ...config,
                    config: { ...config.config, authorizationEndpoint: e.target.value }
                  })}
                  placeholder="授权端点URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Token Endpoint</label>
                <Input
                  value={config.config.tokenEndpoint}
                  onChange={(e) => setConfig({
                    ...config,
                    config: { ...config.config, tokenEndpoint: e.target.value }
                  })}
                  placeholder="令牌端点URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Issuer</label>
                <Input
                  value={config.config.issuer}
                  onChange={(e) => setConfig({
                    ...config,
                    config: { ...config.config, issuer: e.target.value }
                  })}
                  placeholder="发行者标识"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Scopes</label>
                <Input
                  value={config.config.scopes.join(' ')}
                  onChange={(e) => setConfig({
                    ...config,
                    config: { ...config.config, scopes: e.target.value.split(' ') }
                  })}
                  placeholder="空格分隔的权限列表"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>用户属性映射</CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">邮箱字段</label>
                <Input
                  value={config.mappings.emailField}
                  onChange={(e) => setConfig({
                    ...config,
                    mappings: { ...config.mappings, emailField: e.target.value }
                  })}
                  placeholder="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">用户名字段</label>
                <Input
                  value={config.mappings.usernameField || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    mappings: { ...config.mappings, usernameField: e.target.value }
                  })}
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">名字段</label>
                <Input
                  value={config.mappings.firstNameField || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    mappings: { ...config.mappings, firstNameField: e.target.value }
                  })}
                  placeholder="given_name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">姓字段</label>
                <Input
                  value={config.mappings.lastNameField || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    mappings: { ...config.mappings, lastNameField: e.target.value }
                  })}
                  placeholder="family_name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>高级设置</CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">自动创建用户</label>
                  <p className="text-sm text-gray-500">首次SSO登录时自动创建账户</p>
                </div>
                <Switch
                  checked={config.autoProvision}
                  onChange={(checked) => setConfig({ ...config, autoProvision: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">强制SSO</label>
                  <p className="text-sm text-gray-500">要求企业成员必须使用SSO登录</p>
                </div>
                <Switch
                  checked={config.enforceSSO}
                  onChange={(checked) => setConfig({ ...config, enforceSSO: checked })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">允许的邮箱域名</label>
                <Input
                  value={config.allowedDomains.join(', ')}
                  onChange={(e) => setConfig({
                    ...config,
                    allowedDomains: e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                  })}
                  placeholder="example.com, company.com"
                />
                <p className="text-sm text-gray-500 mt-1">逗号分隔，不限制请留空</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={testConnection} loading={loading}>
            测试连接
          </Button>
          <Button type="submit" loading={loading}>
            保存配置
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnterpriseSSOSettingsPage;
```

## 4. 账户关联页面

### 4.1 账户关联设置

```tsx
// src/pages/User/LinkedAccountsPage.tsx
import { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';

interface LinkedAccount {
  provider: string;
  email: string;
  linkedAt: string;
  profile?: {
    name?: string;
    picture?: string;
  };
}

const PROVIDER_INFO: Record<string, { name: string; icon: string; color: string }> = {
  azure: { name: 'Microsoft', icon: '/icons/azure.svg', color: '#0078D4' },
  okta: { name: 'Okta', icon: '/icons/okta.svg', color: '#007DC1' },
  google: { name: 'Google', icon: '/icons/google.svg', color: '#4285F4' },
  github: { name: 'GitHub', icon: '/icons/github.svg', color: '#333333' },
};

const LinkedAccountsPage: React.FC = () => {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const fetchLinkedAccounts = async () => {
    try {
      const { data } = await authApi.getLinkedAccounts();
      setLinkedAccounts(data.accounts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initiateLink = async (provider: string) => {
    const state = generateState();
    sessionStorage.setItem('oauth_link_state', state);
    sessionStorage.setItem('oauth_link_provider', provider);

    const params = new URLSearchParams({
      client_id: 'skillhub-web',
      redirect_uri: `${window.location.origin}/oauth/link/callback`,
      response_type: 'code',
      scope: 'openid profile email',
      state,
      link_account: 'true',
      provider,
    });

    window.location.href = `/api/oauth/authorize?${params.toString()}`;
  };

  const unlinkAccount = async (provider: string) => {
    if (!confirm(`确定要解除与 ${PROVIDER_INFO[provider]?.name || provider} 的关联吗？`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.unlinkOAuthAccount(provider);
      setSuccess('账户已解除关联');
      fetchLinkedAccounts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const availableProviders = Object.entries(PROVIDER_INFO).filter(
    ([provider]) => !linkedAccounts.some(account => account.provider === provider)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">关联账户</h1>

      {error && <Alert type="error" message={error} className="mb-4" onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} className="mb-4" onClose={() => setSuccess('')} />}

      <Card className="mb-6">
        <CardHeader>已关联的账户</CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner />
          ) : linkedAccounts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无关联账户</p>
          ) : (
            <div className="space-y-4">
              {linkedAccounts.map((account) => (
                <div
                  key={account.provider}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={PROVIDER_INFO[account.provider]?.icon}
                      alt={account.provider}
                      className="w-8 h-8"
                    />
                    <div>
                      <p className="font-medium">
                        {PROVIDER_INFO[account.provider]?.name || account.provider}
                      </p>
                      <p className="text-sm text-gray-500">{account.email}</p>
                      <p className="text-xs text-gray-400">
                        关联于 {new Date(account.linkedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => unlinkAccount(account.provider)}
                    disabled={linking !== null}
                  >
                    解除关联
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>关联新账户</CardHeader>
        <CardContent>
          {availableProviders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">已关联所有支持的提供商</p>
          ) : (
            <div className="space-y-3">
              {availableProviders.map(([provider, info]) => (
                <button
                  key={provider}
                  onClick={() => initiateLink(provider)}
                  disabled={linking !== null}
                  className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img src={info.icon} alt={info.name} className="w-8 h-8" />
                    <span className="font-medium">{info.name}</span>
                  </div>
                  <Button variant="secondary" size="sm">
                    关联
                  </Button>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedAccountsPage;
```

## 5. OAuth2客户端管理页面

### 5.1 管理员OAuth客户端列表

```tsx
// src/pages/Admin/OAuthClientsPage.tsx
import { useState, useEffect } from 'react';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';

interface OAuthClient {
  clientId: string;
  name: string;
  description?: string;
  provider: string;
  redirectUris: string[];
  grantTypes: string[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

const OAuthClientsPage: React.FC = () => {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider: 'custom',
    redirectUris: '',
    grantTypes: ['authorization_code'],
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await oauthClientApi.list();
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await oauthClientApi.create({
        ...formData,
        redirectUris: formData.redirectUris.split('\n').filter(Boolean),
      });
      setModalVisible(false);
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('确定要删除这个OAuth客户端吗？')) return;
    
    try {
      await oauthClientApi.delete(clientId);
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { key: 'name', title: '名称' },
    { key: 'provider', title: '提供商' },
    { key: 'redirectUris', title: '回调地址', render: (client: OAuthClient) => (
      <div className="max-w-xs truncate">{client.redirectUris.join(', ')}</div>
    )},
    { key: 'grantTypes', title: '授权类型', render: (client: OAuthClient) => (
      <div className="flex gap-1">
        {client.grantTypes.map(type => (
          <Badge key={type}>{type}</Badge>
        ))}
      </div>
    )},
    { key: 'status', title: '状态', render: (client: OAuthClient) => (
      <Badge variant={client.status === 'active' ? 'success' : 'secondary'}>
        {client.status}
      </Badge>
    )},
    { key: 'actions', title: '操作', render: (client: OAuthClient) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => {}}>编辑</Button>
        <Button variant="danger" size="sm" onClick={() => handleDelete(client.clientId)}>删除</Button>
      </div>
    )},
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">OAuth2客户端管理</h1>
        <Button onClick={() => setModalVisible(true)}>创建客户端</Button>
      </div>

      <Card>
        <Table columns={columns} data={clients} loading={loading} />
      </Card>

      <Modal
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        title="创建OAuth2客户端"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">客户端名称</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="客户端名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">描述</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="可选描述"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">提供商类型</label>
            <Select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              options={[
                { value: 'custom', label: '自定义OIDC' },
                { value: 'azure', label: 'Azure AD' },
                { value: 'okta', label: 'Okta' },
                { value: 'keycloak', label: 'Keycloak' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">回调地址（每行一个）</label>
            <textarea
              className="w-full border rounded-lg p-2 min-h-[100px]"
              value={formData.redirectUris}
              onChange={(e) => setFormData({ ...formData, redirectUris: e.target.value })}
              placeholder="https://app.example.com/callback"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalVisible(false)}>取消</Button>
            <Button onClick={handleCreate}>创建</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OAuthClientsPage;
```

## 6. API客户端扩展

### 6.1 OAuth API模块

```typescript
// src/api/oauth.ts
import { apiClient } from './client';
import { ApiResponse } from '../types/api';

export interface OAuthClient {
  clientId: string;
  name: string;
  description?: string;
  provider: string;
  redirectUris: string[];
  grantTypes: string[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

export interface CreateOAuthClientRequest {
  name: string;
  description?: string;
  provider: string;
  redirectUris: string[];
  grantTypes: string[];
  tokenEndpointAuthMethod?: string;
  allowedOrigins?: string[];
}

export interface EnterpriseSSOConfig {
  enabled: boolean;
  provider: string;
  config: {
    clientId: string;
    clientSecret: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    issuer: string;
    scopes: string[];
  };
  mappings: {
    emailField: string;
    usernameField?: string;
    firstNameField?: string;
    lastNameField?: string;
  };
  autoProvision: boolean;
  allowedDomains: string[];
  enforceSSO: boolean;
}

export interface LinkedAccount {
  provider: string;
  email: string;
  linkedAt: string;
}

export const oauthClientApi = {
  list: () =>
    apiClient.get<ApiResponse<OAuthClient[]>>('/oauth/clients'),

  get: (clientId: string) =>
    apiClient.get<ApiResponse<OAuthClient>>(`/oauth/clients/${clientId}`),

  create: (data: CreateOAuthClientRequest) =>
    apiClient.post<ApiResponse<OAuthClient>>('/oauth/clients', data),

  update: (clientId: string, data: Partial<CreateOAuthClientRequest>) =>
    apiClient.put<ApiResponse<OAuthClient>>(`/oauth/clients/${clientId}`, data),

  delete: (clientId: string) =>
    apiClient.delete<ApiResponse<void>>(`/oauth/clients/${clientId}`),

  regenerateSecret: (clientId: string) =>
    apiClient.post<ApiResponse<{ clientSecret: string }>>(`/oauth/clients/${clientId}/regenerate-secret`),
};

export const enterpriseSSOApi = {
  get: (enterpriseId: string) =>
    apiClient.get<ApiResponse<EnterpriseSSOConfig>>(`/enterprises/${enterpriseId}/sso`),

  update: (enterpriseId: string, config: EnterpriseSSOConfig) =>
    apiClient.put<ApiResponse<EnterpriseSSOConfig>>(`/enterprises/${enterpriseId}/sso`, config),

  testConnection: (enterpriseId: string, config: EnterpriseSSOConfig) =>
    apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
      `/enterprises/${enterpriseId}/sso/test`,
      config
    ),
};

export const authApi = {
  getLinkedAccounts: () =>
    apiClient.get<ApiResponse<{ accounts: LinkedAccount[] }>>('/users/me/oauth/linked'),

  linkOAuthAccount: (provider: string, authorizationCode: string) =>
    apiClient.post<ApiResponse<void>>('/users/me/oauth/link', {
      provider,
      authorizationCode,
    }),

  unlinkOAuthAccount: (provider: string) =>
    apiClient.delete<ApiResponse<void>>(`/users/me/oauth/link/${provider}`),
};
```

## 7. 路由配置

### 7.1 OAuth相关路由

```typescript
// 在App.tsx中添加
<Route path="/oauth/callback" element={<OAuthCallbackPage />} />
<Route path="/oauth/link/callback" element={<OAuthLinkCallbackPage />} />

// 在ProtectedRoutes中添加
<Route path="/settings/linked-accounts" element={<LinkedAccountsPage />} />

// 在AdminRoutes中添加
<Route path="/admin/oauth-clients" element={<OAuthClientsPage />} />

// 在EnterpriseRoutes中添加
<Route path="/enterprise/:id/settings/sso" element={<EnterpriseSSOSettingsPage />} />
```

## 8. 状态管理扩展

### 8.1 Auth Store OAuth扩展

```typescript
// src/stores/authStore.ts 扩展
interface AuthState {
  // ... 现有字段
  
  // OAuth2相关
  oauthLinkState: {
    provider: string;
    redirectUri: string;
  } | null;
  
  // 设置OAuth链接状态
  setOAuthLinkState: (state: { provider: string; redirectUri: string } | null) => void;
  
  // 使用OAuth令牌登录
  loginWithOAuthToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ... 现有状态和方法
      
      oauthLinkState: null,
      
      setOAuthLinkState: (state) => set({ oauthLinkState: state }),
      
      loginWithOAuthToken: async (token) => {
        const response = await fetch('/api/oauth/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) {
          throw new Error('Failed to get user info');
        }
        
        const userInfo = await response.json();
        
        // 获取完整的用户信息
        const { data } = await authClient.get('/auth/me');
        
        set({
          user: data.user,
          token,
          isAuthenticated: true,
        });
      },
    }),
    // ... persist配置
  )
);
```
