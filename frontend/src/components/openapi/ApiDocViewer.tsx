import { ApiEndpoint } from '../../types/openapi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ApiDocViewerProps {
  api: ApiEndpoint;
}

const ApiDocViewer: React.FC<ApiDocViewerProps> = ({ api }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <div className="space-y-4" itemScope itemType="https://schema.org/APIReference">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={getMethodColor(api.method)}>
                  {api.method}
                </Badge>
                <code className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                  {api.path}
                </code>
              </div>
              <CardTitle className="text-xl" itemProp="name">{api.title}</CardTitle>
              <p className="text-gray-600 mt-2" itemProp="description">{api.description}</p>
            </div>
            {api.authentication && (
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                需要认证
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="w-full">
        <div className="flex mb-4" role="navigation" aria-label="API 文档导航">
          <div className="flex space-x-2 w-full">
            <button className="flex-1 py-2 px-4 bg-gray-100 rounded-md font-medium" aria-current="page">描述</button>
            <button className="flex-1 py-2 px-4 bg-gray-50 rounded-md font-medium">参数</button>
            <button className="flex-1 py-2 px-4 bg-gray-50 rounded-md font-medium">响应</button>
            <button className="flex-1 py-2 px-4 bg-gray-50 rounded-md font-medium">示例</button>
          </div>
        </div>

        {/* 描述部分 - 始终可见 */}
        <section className="space-y-4" itemProp="description">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">接口说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">分类：</span>
                  <span className="ml-2" itemProp="category">{api.category}</span>
                </div>
                <div>
                  <span className="font-semibold">方法：</span>
                  <span className="ml-2" itemProp="httpMethod">{api.method}</span>
                </div>
                <div>
                  <span className="font-semibold">路径：</span>
                  <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded" itemProp="endpointUrl">
                    {api.path}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">认证：</span>
                  <span className="ml-2">
                    {api.authentication ? '需要认证' : '公开接口'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 参数部分 - 始终可见 */}
        <section className="space-y-4 mt-6" itemProp="parameters">
          <h2 className="text-lg font-semibold">参数</h2>
          {api.parameters && api.parameters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">请求参数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-semibold">参数名</th>
                        <th className="text-left py-2 px-3 font-semibold">类型</th>
                        <th className="text-left py-2 px-3 font-semibold">位置</th>
                        <th className="text-left py-2 px-3 font-semibold">必填</th>
                        <th className="text-left py-2 px-3 font-semibold">说明</th>
                        <th className="text-left py-2 px-3 font-semibold">示例</th>
                      </tr>
                    </thead>
                    <tbody>
                      {api.parameters.map((param, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-3 font-mono" itemProp="name">{param.name}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" itemProp="type">{param.type}</Badge>
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant="secondary" itemProp="in">{param.location}</Badge>
                          </td>
                          <td className="py-2 px-3" itemProp="required">
                            {param.required ? (
                              <Badge variant="destructive">是</Badge>
                            ) : (
                              <Badge variant="outline">否</Badge>
                            )}
                          </td>
                          <td className="py-2 px-3" itemProp="description">{param.description}</td>
                          <td className="py-2 px-3 font-mono text-sm text-gray-600" itemProp="example">
                            {param.example !== undefined ? (
                              typeof param.example === 'object' ? 
                                JSON.stringify(param.example) : 
                                param.example
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {api.requestBody && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">请求体</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">内容类型：</span>
                    <span className="ml-2 font-mono" itemProp="contentType">{api.requestBody.contentType}</span>
                  </div>
                  <div>
                    <span className="font-semibold">必填：</span>
                    <span className="ml-2">
                      {api.requestBody.required ? '是' : '否'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">说明：</span>
                    <span className="ml-2" itemProp="description">{api.requestBody.description}</span>
                  </div>
                  {api.requestBody.example && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">示例：</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(api.requestBody?.example, null, 2)
                            )
                          }
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm" itemProp="example">
                        {JSON.stringify(api.requestBody.example, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* 响应部分 - 始终可见 */}
        <section className="space-y-4 mt-6" itemProp="responses">
          <h2 className="text-lg font-semibold">响应</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">响应状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {api.responses.map((response, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4"
                    itemProp="possibleResponse"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Badge
                        variant={
                          response.statusCode >= 200 && response.statusCode < 300
                            ? 'default'
                            : 'destructive'
                        }
                        itemProp="statusCode"
                      >
                        {response.statusCode}
                      </Badge>
                      <span className="font-semibold" itemProp="description">{response.description}</span>
                    </div>
                    {response.example && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">响应示例：</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopy(JSON.stringify(response.example, null, 2))
                            }
                          >
                            {copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm" itemProp="example">
                          {JSON.stringify(response.example, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 示例部分 - 始终可见 */}
        <section className="space-y-4 mt-6" itemProp="examples">
          <h2 className="text-lg font-semibold">示例</h2>
          {api.examples && api.examples.length > 0 ? (
            api.examples.map((example, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{example.title}</CardTitle>
                  {example.description && (
                    <p className="text-gray-600">{example.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">请求：</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(
                              `${example.request.method} ${example.request.url}`
                            )
                          }
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-sm">
                        <div className="mb-2">
                          <span className="text-yellow-400">
                            {example.request.method}
                          </span>{' '}
                          <span className="text-white">
                            {example.request.url}
                          </span>
                        </div>
                        {example.request.headers && (
                          <div className="space-y-1">
                            {Object.entries(example.request.headers).map(
                              ([key, value]) => (
                                <div key={key}>
                                  <span className="text-purple-400">{key}:</span>{' '}
                                  <span className="text-green-400">{value}</span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                        {example.request.body && (
                          <pre className="mt-2 text-green-400">
                            {JSON.stringify(example.request.body, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                    {example.response && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">响应：</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopy(
                                JSON.stringify(example.response.body, null, 2)
                              )
                            }
                          >
                            {copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                          <div className="mb-2 text-yellow-400">
                            {example.response.statusCode}
                          </div>
                          {example.response.body && (
                            <pre>
                              {JSON.stringify(example.response.body, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                暂无示例
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
};

export default ApiDocViewer;
