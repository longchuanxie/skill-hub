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
                name: 'pageSize',
                type: 'number',
                required: false,
                description: '每页数量，默认12',
                location: 'query',
                example: 12,
              },
              {
                name: 'category',
                type: 'string',
                required: false,
                description: '分类筛选',
                location: 'query',
                example: '编程',
              },
              {
                name: 'search',
                type: 'string',
                required: false,
                description: '搜索关键词',
                location: 'query',
                example: '代码审查',
              },
            ],
            responses: [
              {
                statusCode: 200,
                description: '获取成功',
                schema: {
                  skills: 'array',
                  pagination: {
                    page: 'number',
                    pageSize: 'number',
                    total: 'number',
                    pages: 'number',
                  },
                },
                example: {
                  skills: [
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
                  pagination: {
                    page: 1,
                    pageSize: 12,
                    total: 156,
                    pages: 13,
                  },
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
                name: 'pageSize',
                type: 'number',
                required: false,
                description: '每页数量，默认12',
                location: 'query',
                example: 12,
              },
              {
                name: 'category',
                type: 'string',
                required: false,
                description: '分类筛选',
                location: 'query',
                example: '销售',
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
                  prompts: 'array',
                  pagination: {
                    page: 'number',
                    pageSize: 'number',
                    total: 'number',
                    pages: 'number',
                  },
                },
              },
            ],
          },
          {
            id: 'agent-skill-download',
            method: 'GET',
            path: '/api/agent/skills/:id/download',
            title: '下载Skill文件',
            description: '下载指定Skill的压缩包文件',
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
                description: '下载成功，返回文件流',
              },
              {
                statusCode: 403,
                description: '权限不足或无访问权限',
              },
              {
                statusCode: 404,
                description: 'Skill不存在或文件未找到',
              },
            ],
          },
          {
            id: 'agent-upload-skill',
            method: 'POST',
            path: '/api/agent/skills',
            title: '上传Skill',
            description: '上传新的Skill到企业资源，需要canWrite权限',
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
            description: '上传新的Prompt到企业资源，需要canWrite权限',
            category: 'Agent API',
            authentication: true,
            requestBody: {
              contentType: 'application/json',
              schema: {
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
          {
            id: 'agent-check-update',
            method: 'GET',
            path: '/api/agent/check-update',
            title: '检查资源更新',
            description: '检查是否有同名skill或prompt的新版本可用',
            category: 'Agent API',
            authentication: true,
            parameters: [
              {
                name: 'resourceType',
                type: 'string',
                required: true,
                description: '资源类型，skill或prompt',
                location: 'query',
                example: 'skill',
              },
              {
                name: 'name',
                type: 'string',
                required: true,
                description: '资源名称',
                location: 'query',
                example: '代码审查助手',
              },
              {
                name: 'version',
                type: 'string',
                required: true,
                description: '当前版本号',
                location: 'query',
                example: '1.0.0',
              },
            ],
            responses: [
              {
                statusCode: 200,
                description: '检查成功',
                schema: {
                  hasUpdate: 'boolean',
                  latestVersion: 'string',
                  currentVersion: 'string',
                  updateAvailable: 'boolean',
                  changelog: 'string | null',
                },
                example: {
                  hasUpdate: true,
                  latestVersion: '1.0.1',
                  currentVersion: '1.0.0',
                  updateAvailable: true,
                  changelog: 'Bug fixes',
                },
              },
              {
                statusCode: 400,
                description: '参数错误',
                example: {
                  error: 'MISSING_PARAMETERS',
                  message: 'resourceType, name and version are required',
                },
              },
              {
                statusCode: 404,
                description: '资源不存在',
                example: {
                  error: 'RESOURCE_NOT_FOUND',
                  message: 'No skill found with the given name',
                },
              },
            ],
          },
        ],
      },
    ];

    res.json({
      success: true,
      data: apiDocs,
    });
  } catch (error) {
    console.error('Error fetching API docs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API documentation',
    });
  }
};
