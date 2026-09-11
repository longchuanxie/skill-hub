export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  title: string;
  description: string;
  category: string;
  authentication: boolean;
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  examples?: ApiExample[];
}

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  location: 'path' | 'query' | 'header';
  example?: any;
}

export interface ApiRequestBody {
  contentType: string;
  schema: Record<string, any>;
  required: boolean;
  description: string;
  example?: any;
}

export interface ApiResponse {
  statusCode: number;
  description: string;
  schema?: Record<string, any>;
  example?: any;
}

export interface ApiExample {
  title: string;
  description?: string;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response: {
    statusCode: number;
    body?: any;
  };
}

export interface ApiCategory {
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
}
