import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentApi, CreateAgentRequest } from '../api/agents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CreateAgentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [createdAgent, setCreatedAgent] = useState<{ name: string; apiKey: string } | null>(null);
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    description: '',
    endpoint: '',
    rateLimit: 100,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const agent = await agentApi.createAgent(formData);
      setCreatedAgent({
        name: agent.name,
        apiKey: agent.apiKey
      });
    } catch (error) {
      console.error('Failed to create agent:', error);
    } finally {
      setLoading(false);
    }
  };

  if (createdAgent) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-green-600">Agent Created Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-medium mb-2">
                Important: Please save your API key now. You won't be able to see it again!
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white rounded text-sm break-all">
                  {createdAgent.apiKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(createdAgent.apiKey)}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => navigate('/agents')} className="flex-1">
                Go to Agents
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreatedAgent(null);
                  setFormData({
                    name: '',
                    description: '',
                    endpoint: '',
                    rateLimit: 100,
                  });
                }}
                className="flex-1"
              >
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create Agent</h1>
          <p className="text-gray-600 mt-1">Create a new API agent for external integrations</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/agents')}>
          Cancel
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Agent Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My API Agent"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A brief description of what this agent does"
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
              <p className="text-sm text-gray-500 mt-1">
                Optional: The base URL for your agent API
              </p>
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
              <p className="text-sm text-gray-500 mt-1">
                Maximum number of requests per minute (1-1000)
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Agent'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAgentPage;
