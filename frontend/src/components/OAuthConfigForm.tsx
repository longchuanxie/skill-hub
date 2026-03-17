import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { oauthApi, OAuthProvider, UserInfoConfig } from '@/api/oauth';

interface OAuthConfigFormProps {
  enterpriseId: string;
  provider: OAuthProvider | null;
  onClose: () => void;
  onSuccess: () => void;
}

const providerOptions = [
  { value: 'google', label: 'Google Workspace' },
  { value: 'github', label: 'GitHub' },
  { value: 'microsoft', label: 'Microsoft Azure AD' },
  { value: 'slack', label: 'Slack' },
  { value: 'custom', label: 'Custom OAuth2' },
];

const defaultUserInfoConfig: UserInfoConfig = {
  method: 'GET',
  url: '',
  headers: {},
  body: '',
  userIdPath: '',
  emailPath: '',
  namePath: '',
  avatarPath: '',
};

const OAuthConfigForm: React.FC<OAuthConfigFormProps> = ({ enterpriseId, provider, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    provider: 'google',
    clientId: '',
    clientSecret: '',
    authorizationURL: '',
    tokenURL: '',
    scope: 'openid profile email',
    callbackPath: '/api/oauth/callback/google',
    isEnabled: false,
    userInfoConfig: defaultUserInfoConfig,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!provider;

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        provider: provider.provider,
        clientId: provider.clientId || '',
        clientSecret: '',
        authorizationURL: provider.authorizationURL,
        tokenURL: provider.tokenURL,
        scope: provider.scope,
        callbackPath: provider.callbackPath,
        isEnabled: provider.isEnabled,
        userInfoConfig: provider.userInfoConfig ? {
          method: provider.userInfoConfig.method || 'GET',
          url: provider.userInfoConfig.url || '',
          headers: provider.userInfoConfig.headers || {},
          body: provider.userInfoConfig.body || '',
          userIdPath: provider.userInfoConfig.userIdPath || '',
          emailPath: provider.userInfoConfig.emailPath || '',
          namePath: provider.userInfoConfig.namePath || '',
          avatarPath: provider.userInfoConfig.avatarPath || '',
        } : defaultUserInfoConfig,
      });
    }
  }, [provider]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUserInfoConfigChange = (field: keyof UserInfoConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      userInfoConfig: { ...prev.userInfoConfig, [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        enterpriseId,
        clientSecret: formData.clientSecret || undefined,
      };

      if (isEditing) {
        await oauthApi.updateProvider(provider._id, data);
      } else {
        await oauthApi.createProvider(data);
      }
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to save provider');
    } finally {
      setLoading(false);
    }
  };

  const isCustom = formData.provider === 'custom';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">
            {isEditing ? 'Edit OAuth Provider' : 'Add OAuth Provider'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider">Provider Type</Label>
              <Select value={formData.provider} onValueChange={(value) => handleChange('provider', value)}>
                <SelectTrigger id="provider" className="w-full mt-1">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Company SSO"
                className="mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={formData.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                placeholder="OAuth Client ID"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="clientSecret">
                Client Secret {isEditing && '(leave empty to keep current)'}
              </Label>
              <Input
                id="clientSecret"
                type="password"
                value={formData.clientSecret}
                onChange={(e) => handleChange('clientSecret', e.target.value)}
                placeholder="OAuth Client Secret"
                className="mt-1"
                required={!isEditing}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="authorizationURL">Authorization URL</Label>
            <Input
              id="authorizationURL"
              value={formData.authorizationURL}
              onChange={(e) => handleChange('authorizationURL', e.target.value)}
              placeholder="https://auth.example.com/authorize"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="tokenURL">Token URL</Label>
            <Input
              id="tokenURL"
              value={formData.tokenURL}
              onChange={(e) => handleChange('tokenURL', e.target.value)}
              placeholder="https://auth.example.com/token"
              className="mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scope">Scope</Label>
              <Input
                id="scope"
                value={formData.scope}
                onChange={(e) => handleChange('scope', e.target.value)}
                placeholder="openid profile email"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="callbackPath">Callback Path</Label>
              <Input
                id="callbackPath"
                value={formData.callbackPath}
                onChange={(e) => handleChange('callbackPath', e.target.value)}
                placeholder="/api/oauth/callback/custom"
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Full URL: {typeof window !== 'undefined' ? window.location.origin : ''}{formData.callbackPath}
              </p>
            </div>
          </div>

          {isCustom && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-black mb-4">Custom User Info Configuration</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure how to extract user information from the OAuth provider&apos;s response
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>HTTP Method</Label>
                  <Select value={formData.userInfoConfig.method} onValueChange={(value) => handleUserInfoConfigChange('method', value)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>User ID Path</Label>
                  <Input
                    value={formData.userInfoConfig.userIdPath}
                    onChange={(e) => handleUserInfoConfigChange('userIdPath', e.target.value)}
                    placeholder="e.g., data.id"
                    className="mt-1"
                    required={isCustom}
                  />
                </div>
              </div>

              <div className="mb-4">
                <Label>User Info Endpoint URL</Label>
                <Input
                  value={formData.userInfoConfig.url}
                  onChange={(e) => handleUserInfoConfigChange('url', e.target.value)}
                  placeholder="https://auth.example.com/api/user"
                  className="mt-1"
                  required={isCustom}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The endpoint to fetch user information after obtaining the access token
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Email Path</Label>
                  <Input
                    value={formData.userInfoConfig.emailPath}
                    onChange={(e) => handleUserInfoConfigChange('emailPath', e.target.value)}
                    placeholder="e.g., data.email"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Name Path</Label>
                  <Input
                    value={formData.userInfoConfig.namePath}
                    onChange={(e) => handleUserInfoConfigChange('namePath', e.target.value)}
                    placeholder="e.g., data.name"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Request Body (for POST)</Label>
                <Textarea
                  value={formData.userInfoConfig.body}
                  onChange={(e) => handleUserInfoConfigChange('body', e.target.value)}
                  placeholder='{"access_token": "{{access_token}}"}'
                  className="mt-1 font-mono text-sm"
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="isEnabled" className="text-base">Enable Provider</Label>
              <p className="text-sm text-gray-600">Allow users to login with this provider</p>
            </div>
            <Switch
              id="isEnabled"
              checked={formData.isEnabled}
              onCheckedChange={(checked) => handleChange('isEnabled', checked)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-black hover:bg-gray-800 text-white">
              {loading ? 'Saving...' : isEditing ? 'Update Provider' : 'Create Provider'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OAuthConfigForm;
