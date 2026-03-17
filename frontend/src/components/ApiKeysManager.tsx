import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { agentApi, Agent, CreateAgentRequest } from '../api/agents';
import { Copy, Plus, Trash2, Key, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';

const ApiKeysManager = () => {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAgentDescription, setNewAgentDescription] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showNewApiKey, setShowNewApiKey] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await agentApi.getAgents();
      setAgents(response.agents);
    } catch (err: any) {
      setError(t('myResources.loadFailed'));
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      
      const data: CreateAgentRequest = {
        description: newAgentDescription,
      };

      const response = await agentApi.createAgent(data);
      setNewApiKey(response.apiKey);
      setShowNewApiKey(true);
      setSuccess(t('settings.apiKeyCreated'));
      
      setNewAgentDescription('');
      
      await loadAgents();
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.networkError'));
      console.error('Failed to create agent:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm(t('settings.deleteConfirm'))) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await agentApi.deleteAgent(id);
      setSuccess(t('settings.apiKeyDeleted'));
      await loadAgents();
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.networkError'));
      console.error('Failed to delete agent:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKey = async (id: string) => {
    if (!confirm(t('settings.regenerateConfirm'))) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await agentApi.regenerateApiKey(id);
      setSuccess(t('settings.apiKeyRegenerated'));
      setVisibleKeys(prev => new Set(prev).add(id));
      await loadAgents();
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.networkError'));
      console.error('Failed to regenerate key:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess(t('settings.copied'));
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(t('settings.copyFailed'));
    }
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const maskKey = (key: string) => {
    if (!key) return '••••••••••••••••••••••••••••••••';
    return key.substring(0, 8) + '••••••••••••••••••••••••••••••••';
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="border-2 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-2 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-black" />
          <h3 className="text-lg font-semibold text-black">{t('settings.apiKeys')}</h3>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('settings.createApiKey')}
        </Button>
      </div>

      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('settings.createApiKey')}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCreateDialog(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAgent} className="space-y-4">
                <div>
                  <label htmlFor="agentDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.apiKeyDescription')}
                  </label>
                  <Input
                    id="agentDescription"
                    type="text"
                    value={newAgentDescription}
                    onChange={(e) => setNewAgentDescription(e.target.value)}
                    placeholder={t('settings.apiKeyDescriptionPlaceholder')}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? t('settings.creating') : t('common.create')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {newApiKey && showNewApiKey && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{t('settings.apiKeyCreated')}</span>
                </div>
                <div className="bg-white border-2 border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {t('settings.saveKeyWarning')}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">
                      {newApiKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyToClipboard(newApiKey)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewApiKey('');
                    setShowNewApiKey(false);
                  }}
                >
                  {t('settings.savedKey')}
                </Button>
              </div>
          </CardContent>
        </Card>
      )}

      {loading && agents.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{t('settings.noApiKeys')}</p>
              <p className="text-sm text-gray-500">
                {t('settings.createApiKeyDesc')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <Card key={agent._id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-black">{t('settings.apiKeys')}</h4>
                        {agent.isEnabled ? (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">{t('settings.active')}</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">{t('settings.inactive')}</span>
                        )}
                      </div>
                      {agent.description && (
                        <p className="text-sm text-gray-600 mb-2">{agent.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{t('settings.created')}: {new Date(agent.createdAt).toLocaleDateString()}</span>
                        {agent.usage?.totalRequests && (
                          <span>• {t('settings.used')}: {agent.usage.totalRequests} {t('settings.times')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleKeyVisibility(agent._id)}
                        title={visibleKeys.has(agent._id) ? t('settings.hideKey') : t('settings.showKey')}
                      >
                        {visibleKeys.has(agent._id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRegenerateKey(agent._id)}
                        title={t('settings.regenerateKey')}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAgent(agent._id)}
                        title={t('settings.deleteKey')}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono text-gray-700">
                        {visibleKeys.has(agent._id) && agent.apiKey ? agent.apiKey : maskKey(agent.apiKey || '')}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => agent.apiKey && handleCopyToClipboard(agent.apiKey)}
                        title={t('settings.copyKey')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiKeysManager;
