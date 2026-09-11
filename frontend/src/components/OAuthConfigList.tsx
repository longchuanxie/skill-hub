import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { oauthApi, OAuthProvider } from '@/api/oauth';
import OAuthConfigForm from './OAuthConfigForm';

interface OAuthConfigListProps {
  enterpriseId: string;
}

const providerIcons: Record<string, string> = {
  google: 'https://www.google.com/favicon.ico',
  github: 'https://github.com/favicon.ico',
  microsoft: 'https://www.microsoft.com/favicon.ico',
  slack: 'https://slack.com/favicon.ico',
  custom: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIj48cGF0aCBkPSJNMyA5LjV2NS41YTIuMiAyLjIgMCAwIDEgMi4xLTIuMUw5LjUgNi41YTIuMSAyLjEgMCAwIDEgMS41LjV2My41YTIuMSAyLjEgMCAwIDEgMy4zIDEuN2wtMi41IDQuNGEyLjEgMi4xIDAgMCAxLTMuMy0xLjd2LTMuNWEyLjEgMi4xIDAgMCAxLTEuNS0uNWw1LjYtNS42YTIuMiAyLjIgMCAwIDEgMi4xIDIuMXpNMTIgMjF2LTVhMi4yIDIuMiAwIDAgMC0yLjEgMi4xTDUuNSAxNy41YTIuMSAyLjEgMCAwIDAtMS41LS41di0zLjVhMi4xIDIuMSAwIDAgMC0zLjMtMS43bDIuNS00LjRhMi4xIDIuMSAwIDAgMCAzLjMgMS43djMuNWEyLjEgMi4xIDAgMCAxIDEuNS41bC01LjYgNS42YTIuMiAyLjIgMCAwIDEgMi4xLTIuMXoiLz48L3N2Zz4=',
};

const providerLabels: Record<string, string> = {
  google: 'Google Workspace',
  github: 'GitHub',
  microsoft: 'Microsoft Azure AD',
  slack: 'Slack',
  custom: 'Custom OAuth2',
};

const OAuthConfigList: React.FC<OAuthConfigListProps> = ({ enterpriseId }) => {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, [enterpriseId]);

  const loadProviders = async () => {
    try {
      const data = await oauthApi.getEnterpriseProviders(enterpriseId);
      setProviders(data);
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this OAuth provider?')) return;
    
    setDeleting(id);
    setError('');
    try {
      await oauthApi.deleteProvider(id);
      setProviders(providers.filter(p => p._id !== id));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to delete provider');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (provider: OAuthProvider) => {
    setEditingProvider(provider);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingProvider(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProvider(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProvider(null);
    loadProviders();
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-gray-200 rounded-lg"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {providers.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-gray-600 mb-4">No OAuth providers configured</p>
          <Button onClick={handleAdd} className="bg-black hover:bg-gray-800 text-white">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add OAuth Provider
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {providers.map((provider) => (
              <div
                key={provider._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={providerIcons[provider.provider] || providerIcons.custom}
                    alt={provider.name}
                    className="w-8 h-8 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = providerIcons.custom;
                    }}
                  />
                  <div>
                    <div className="font-medium text-black">{provider.name}</div>
                    <div className="text-sm text-gray-500">
                      {providerLabels[provider.provider] || provider.provider}
                      {provider.isEnabled && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Enabled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(provider)}
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(provider._id)}
                    disabled={deleting === provider._id}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {deleting === provider._id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleAdd} variant="outline" className="w-full border-dashed border-2 border-gray-300 hover:bg-gray-50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add OAuth Provider
          </Button>
        </>
      )}

      {showForm && (
        <OAuthConfigForm
          enterpriseId={enterpriseId}
          provider={editingProvider}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default OAuthConfigList;
