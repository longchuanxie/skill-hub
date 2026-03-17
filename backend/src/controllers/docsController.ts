import { Response } from 'express';

export const getApiDocs = async (req: any, res: Response) => {
  try {
    const apiDocs = [
      {
        name: 'Agent API',
        description: '基于API Key认证的智能体接口，用于外部系统访问平台资源',
        endpoints: [
          {
            id: 'agent-skills',
            method: 'GET',
            path: '/api/agent/skills',
            title: '获取公开Skill列表',
            description: '获取平台上的公开Skill列表，支持分页和搜索',
            category: 'Agent API',
            authentication: true,
            parameters: [
              {
                name: 'page',
                type: 'number',
                required: false,
                description: '页码，默认1',
                location: 'query',
                example: 1,
              },
              {
                name: 'limit',
                type: 'number',
                required: false,
                description: '每页数量，默认20',
                location: 'query',
                example: 20,
              },
              {
                name: 'search',
                type: 'string',
                required: false,
                description: '搜索关键词',
                location: 'query',
                example: '代码审查',
              },
              {
                name: 'tags',
                type: 'string[]',
                required: false,
                description: '标签筛选',
                location: 'query',
                example: ['code', 'review'],
              },
            ],
            responses: [
              {
                statusCode: 200,
                description: '获取成功',
                schema: {
                  items: 'array',
                  total: 'number',
                  page: 'number',
                  limit: 'number',
                },
                example: {
                  items: [
                    {
                      id: 'skill_123',
                      description: '自动审查代码质量问题',
                      version: '1.2.0',
                      tags: ['code', 'review'],
                      author: {
                        id: 'user_456',
                        username: 'developer1',
                      },
                      stats: {
                        downloadCount: 1234,
                        avgRating: 4.5,
                        ratingCount: 89,
                      },
                      createdAt: '2024-01-15T10:00:00Z',
                    },
                  ],
                  total: 156,
                  page: 1,
                  limit: 20,
                },
              },
            ],
          },
          {
            id: 'agent-prompts',
            method: 'GET',
            path: '/api/agent/prompts',
            title: '获取公开Prompt列表',
            description: '获取平台上的公开Prompt列表，支持分页和搜索',
            category: 'Agent API',
            authentication: true,
            parameters: [
              {
                name: 'page',
                type: 'number',
                required: false,
                description: '页码，默认1',
                location: 'query',
                example: 1,
              },
              {
                name: 'limit',
                type: 'number',
                required: false,
                description: '每页数量，默认20',
                location: 'query',
                example: 20,
              },
              {
                name: 'search',
                type: 'string',
                required: false,
                description: '搜索关键词',
                location: 'query',
                example: '销售话术',
              },
            ],
            responses: [
              {
                statusCode: 200,
                description: '获取成功',
                schema: {
                  items: 'array',
                  total: 'number',
                  page: 'number',
                  limit: 'number',
                },
              },
            ],
          },
          {
            id: 'agent-enterprise-skills',
            method: 'GET',
            path: '/api/agent/enterprise/skills',
            title: '获取企业Skill列表',
            description: '获取当前Agent所属企业的Skill列表，需要canReadEnterprise权限',
            category: 'Agent API',
            authentication: true,
            parameters: [
              {
                name: 'page',
                type: 'number',
                required: false,
                description: '页码，默认1',
                location: 'query',
                example: 1,
              },
              {
                name: 'limit',
                type: 'number',
                required: false,
                description: '每页数量，默认20',
                location: 'query',
                example: 20,
              },
            ],
            responses: [
              {
                statusCode: 200,
                description: '获取成功',
              },
              {
                statusCode: 403,
                description: '权限不足',
              },
            ],
          },
          {
            id: 'agent-enterprise-prompts',
            method: 'GET',
            path: '/api/agent/enterprise/prompts',
            title: '获取企业Prompt列表',
            description: '获取当前Agent所属企业的Prompt列表，需要canReadEnterprise权限',
            category: 'Agent API',
            authentication: true,
            parameters: [
              {
                name: 'page',
                type: 'number',
                required: false,
                description: '页码，默认1',
                location: 'query',
                example: 1,
              },
              {
                name: 'limit',
                type: 'number',
                required: false,
                description: '每页数量，默认20',
                location: 'query',
                example: 20,
              },
            ],
            responses: [
              {
                statusCode: 200,
                description: '获取成功',
              },
              {
                statusCode: 403,
                description: '权限不足',
              },
            ],
          },
          {
            id: 'agent-skill-download',
            method: 'GET',
            path: '/api/agent/skills/:id/download',
            title: '下载Skill',
            description: '下载指定Skill文件，需要canDownload权限',
            category: 'Agent API',
            authentication: true,
            parameters: [
              {
                name: 'id',
                type: 'string',
                required: true,
                description: 'Skill ID',
                location: 'path',
                example: 'skill_123456',
              },
            ],
            responses: [
              {
                statusCode: 200,
                description: '下载成功，返回文件',
              },
              {
                statusCode: 403,
                description: '权限不足或无下载权限',
              },
              {
                statusCode: 404,
                description: 'Skill不存在',
              },
            ],
          },
          {
            id: 'agent-prompt-detail',
            method: 'GET',
            path: '/api/agent/prompts/:id',
            title: '获取Prompt详情',
            description: '获取指定Prompt的详细信息',
            category: 'Agent API',
            authentication: true,
            parameters: [
              {
                name: 'id',
                type: 'string',
                required: true,
                description: 'Prompt ID',
                location: 'path',
                example: 'prompt_123456',
              },
            ],
            responses: [
              {
                statusCode: 200,
                description: '获取成功',
              },
              {
                statusCode: 404,
                description: 'Prompt不存在',
              },
            ],
          },
          {
            id: 'agent-upload-skill',
            method: 'POST',
            path: '/api/agent/skills',
            title: '上传Skill',
            description: '上传新的Skill到企业资源，需要canUpload权限',
            category: 'Agent API',
            authentication: true,
            requestBody: {
              contentType: 'application/json',
              schema: {
                name: 'string',
                description: 'string',
                content: 'string',
                tags: 'array',
                marketType: 'string',
              },
              required: true,
              description: 'Skill信息',
              example: {
                name: '新Skill名称',
                description: 'Skill描述',
                content: 'base64编码的Skill文件内容',
                tags: ['ai', 'assistant'],
                marketType: 'enterprise',
              },
            },
            responses: [
              {
                statusCode: 201,
                description: '上传成功',
              },
              {
                statusCode: 403,
                description: '权限不足或无上传权限',
              },
            ],
          },
          {
            id: 'agent-upload-prompt',
            method: 'POST',
            path: '/api/agent/prompts',
            title: '上传Prompt',
            description: '上传新的Prompt到企业资源，需要canUpload权限',
            category: 'Agent API',
            authentication: true,
            requestBody: {
              contentType: 'application/json',
              schema: {
                name: 'string',
                content: 'string',
                tags: 'array',
                marketType: 'string',
              },
              required: true,
              description: 'Prompt信息',
              example: {
                content: '你是一个专业的销售顾问，帮助用户制定销售策略',
                tags: ['销售', '咨询'],
                marketType: 'enterprise',
              },
            },
            responses: [
              {
                statusCode: 201,
                description: '上传成功',
              },
              {
                statusCode: 403,
                description: '权限不足或无上传权限',
              },
            ],
          },
        ],
      },
    ];

    res.json({ data: apiDocs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get API docs' });
  }
};
