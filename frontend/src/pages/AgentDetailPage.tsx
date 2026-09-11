import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agentApi, Agent, UpdateAgentRequest } from '../api/agents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const AgentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [formData, setFormData] = useState<UpdateAgentRequest>({
    name: '',
    description: '',
    endpoint: '',
    rateLimit: 100,
    isEnabled: true,
  });

  useEffect(() => {
    const fetchAgent = async () => {
      if (!id) return;
      try {
        const data = await agentApi.getAgent(id);
        setAgent(data);
        setFormData({
          name: data.name,
          description: data.description,
          endpoint: data.endpoint || '',
          rateLimit: data.rateLimit || 100,
          isEnabled: data.isEnabled,
        });
      } catch (error) {
        console.error('Failed to fetch agent:', error);
        navigate('/agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    try {
      const updated = await agentApi.updateAgent(id, formData);
      setAgent(updated);
    } catch (error) {
      console.error('Failed to update agent:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!id || !window.confirm('Are you sure you want to regenerate the API key? This action cannot be undone.')) {
      return;
    }

    try {
      const newKey = await agentApi.regenerateApiKey(id);
      setApiKey(newKey);
      setShowApiKey(true);
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Details</h1>
          <p className="text-gray-600 mt-1">Manage your agent configuration</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/agents')}>
          Back to Agents
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="endpoint">Endpoint URL</Label>
                <Input
                  id="endpoint"
                  type="url"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  placeholder="https://api.example.com/agent"
                />
              </div>

              <div>
                <Label htmlFor="rateLimit">Rate Limit (requests/minute)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={formData.rateLimit}
                  onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                  min={1}
                  max={1000}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isEnabled">Enabled</Label>
                <Switch
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                />
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">API Key</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </Button>
              </div>
              <code className="text-sm break-all">
                {showApiKey || apiKey ? (apiKey || agent.apiKey) : '••••••••••••••••'}
              </code>
            </div>

            <Button variant="outline" onClick={handleRegenerateKey} className="w-full">
              Regenerate API Key
            </Button>

            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Usage Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{new Date(agent.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated:</span>
                  <span>{new Date(agent.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentDetailPage;
