import { ApiCategory, ApiEndpoint } from '../types/openapi';

export const generateMarkdownDocs = (categories: ApiCategory[]): string => {
  let markdown = '# SkillHub API Documentation\n\n';
  markdown += 'This document provides comprehensive information about all available RESTful API endpoints.\n\n';
  markdown += '---\n\n';

  categories.forEach((category) => {
    markdown += `## ${category.name}\n\n`;
    markdown += `${category.description}\n\n`;

    category.endpoints.forEach((endpoint) => {
      markdown += `### ${endpoint.title}\n\n`;
      markdown += `**${endpoint.method}** \`${endpoint.path}\`\n\n`;
      markdown += `${endpoint.description}\n\n`;

      markdown += '**Authentication:** ';
      markdown += endpoint.authentication ? 'Required' : 'Not Required';
      markdown += '\n\n';

      if (endpoint.parameters && endpoint.parameters.length > 0) {
        markdown += '#### Parameters\n\n';
        markdown += '| Name | Type | Location | Required | Description |\n';
        markdown += '|------|------|-----------|-----------|-------------|\n';
        endpoint.parameters.forEach((param) => {
          markdown += `| \`${param.name}\` | ${param.type} | ${param.location} | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`;
        });
        markdown += '\n';
      }

      if (endpoint.requestBody) {
        markdown += '#### Request Body\n\n';
        markdown += `**Content-Type:** ${endpoint.requestBody.contentType}\n\n`;
        markdown += `**Required:** ${endpoint.requestBody.required ? 'Yes' : 'No'}\n\n`;
        markdown += `**Description:** ${endpoint.requestBody.description}\n\n`;

        if (endpoint.requestBody.example) {
          markdown += '**Example:**\n\n';
          markdown += '```json\n';
          markdown += JSON.stringify(endpoint.requestBody.example, null, 2);
          markdown += '\n```\n\n';
        }
      }

      markdown += '#### Responses\n\n';
      endpoint.responses.forEach((response) => {
        markdown += `**${response.statusCode}** - ${response.description}\n\n`;
        if (response.example) {
          markdown += '```json\n';
          markdown += JSON.stringify(response.example, null, 2);
          markdown += '\n```\n\n';
        }
      });

      if (endpoint.examples && endpoint.examples.length > 0) {
        markdown += '#### Examples\n\n';
        endpoint.examples.forEach((example) => {
          markdown += `**${example.title}**\n\n`;
          if (example.description) {
            markdown += `${example.description}\n\n`;
          }

          markdown += '**Request:**\n\n';
          markdown += '```http\n';
          markdown += `${example.request.method} ${example.request.url}\n`;
          if (example.request.headers) {
            Object.entries(example.request.headers).forEach(([key, value]) => {
              markdown += `${key}: ${value}\n`;
            });
          }
          if (example.request.body) {
            markdown += '\n';
            markdown += JSON.stringify(example.request.body, null, 2);
          }
          markdown += '\n```\n\n';

          if (example.response) {
            markdown += '**Response:**\n\n';
            markdown += '```json\n';
            markdown += JSON.stringify(example.response.body, null, 2);
            markdown += '\n```\n\n';
          }
        });
      }

      markdown += '---\n\n';
    });
  });

  return markdown;
};

export const downloadMarkdown = (markdown: string, filename: string = 'api-docs.md') => {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
