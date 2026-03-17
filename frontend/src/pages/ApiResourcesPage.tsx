import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { openApiDocs as staticOpenApiDocs } from '../data/openApiDocs';
import { ApiEndpoint, ApiCategory } from '../types/openapi';
import ApiDocViewer from '../components/openapi/ApiDocViewer';
import { generateMarkdownDocs, downloadMarkdown } from '../utils/markdownGenerator';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';
import { openApiDocsApi } from '../api/openApiDocs';

const ApiResourcesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [selectedApi, setSelectedApi] = useState<ApiEndpoint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiDocs, setApiDocs] = useState<ApiCategory[]>(staticOpenApiDocs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiDocs = async () => {
      try {
        setLoading(true);
        setError(null);
        const docs = await openApiDocsApi.getApiDocs();
        if (docs && docs.length > 0) {
          setApiDocs(docs);
        }
      } catch (err) {
        console.error('Failed to load API docs:', err);
        setError('无法从服务器加载API文档，使用本地文档');
      } finally {
        setLoading(false);
      }
    };

    fetchApiDocs();
  }, []);

  const handleDownloadMarkdown = () => {
    const markdown = generateMarkdownDocs(apiDocs);
    downloadMarkdown(markdown, 'skillhub-api-docs.md');
  };

  const handleRefresh = () => {
    const fetchApiDocs = async () => {
      try {
        setLoading(true);
        setError(null);
        const docs = await openApiDocsApi.getApiDocs();
        if (docs && docs.length > 0) {
          setApiDocs(docs);
        }
      } catch (err) {
        console.error('Failed to load API docs:', err);
        setError('无法从服务器加载API文档，使用本地文档');
      } finally {
        setLoading(false);
      }
    };

    fetchApiDocs();
  };

  const categories = ['全部', ...apiDocs.map((cat) => cat.name)];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'POST':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="container mx-auto p-6" itemScope itemType="https://schema.org/APIReference">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold" itemProp="name">API 文档</h1>
            {error && (
              <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button
              onClick={handleDownloadMarkdown}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              下载 Markdown
            </Button>
          </div>
        </div>
        <p className="text-gray-600" itemProp="description">
          SkillHub 对外开放的 API 接口文档，包含所有可用的 RESTful API
        </p>
      </div>

      <Card className="mb-6 border-2 border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">如何获取 API Key</h3>
            </div>
            <div className="space-y-2 text-gray-800">
              <p>要使用 SkillHub 的 API，您需要先获取 API Key：</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>登录您的 SkillHub 账户</li>
                <li>进入 <strong>设置</strong> 页面</li>
                <li>在 <strong>API Keys</strong> 部分创建新的 API Key</li>
                <li>复制生成的 API Key（请妥善保存，仅显示一次）</li>
              </ol>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm">
                  <strong>使用方式：</strong> 在每个 API 请求的 HTTP Header 中添加 <code className="bg-gray-100 px-2 py-1 rounded">X-API-Key: your-api-key-here</code>
                </p>
              </div>
              <div className="mt-2">
                <Button
                  asChild
                  variant="outline"
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <a href="/settings" className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    前往设置页面
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Input
            placeholder="搜索 API 接口..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>API 列表</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-600">加载中...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiDocs.map((category) => (
                    <div key={category.name} itemProp="hasPart" itemScope itemType="https://schema.org/APIReference">
                      <h3 className="font-semibold text-sm text-gray-600 mb-2" itemProp="name">
                        {category.name}
                      </h3>
                      <div className="space-y-2">
                        {category.endpoints.map((endpoint) => (
                          <div
                            key={endpoint.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedApi?.id === endpoint.id
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                            onClick={() => {
                              console.log('Selected API:', endpoint);
                              setSelectedApi(endpoint);
                            }}
                            itemProp="hasPart" itemScope itemType="https://schema.org/APIReference"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                className={`${getMethodColor(endpoint.method)} text-xs py-1 px-2`}
                                itemProp="httpMethod"
                              >
                                {endpoint.method}
                              </Badge>
                              <span className="text-sm font-medium truncate" itemProp="name">
                                {endpoint.title}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 font-mono truncate" itemProp="endpointUrl">
                              {endpoint.path}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedApi ? (
            <ApiDocViewer api={selectedApi} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-lg mb-2">选择一个 API 查看详情</p>
                  <p className="text-sm">
                    点击左侧列表中的 API 接口，查看详细的文档信息
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 所有 API 详情 - 对爬虫可见 */}
      <div className="mt-12" aria-hidden="true" style={{ display: 'none' }}>
        {apiDocs.map((category) => (
          <div key={category.name} className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{category.name}</h2>
            {category.endpoints.map((endpoint) => (
              <div key={endpoint.id} className="mb-6">
                <ApiDocViewer api={endpoint} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiResourcesPage;
