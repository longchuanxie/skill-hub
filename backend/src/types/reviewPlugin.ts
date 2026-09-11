export interface ReviewResult {
  passed: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high';
  warnings: string[];
  customData?: any;
}

export interface ReviewContext {
  resourceType: 'skill' | 'prompt';
  resourceData: any;
  filePath?: string;
  userId?: string;
  enterpriseId?: string;
  metadata?: Record<string, any>;
}

export interface ReviewPlugin {
  name: string;
  version: string;
  description: string;
  
  review: (context: ReviewContext) => Promise<ReviewResult>;
  validate?: () => Promise<boolean>;
  cleanup?: () => Promise<void>;
}

export interface ReviewPluginConfig {
  enabled: boolean;
  priority: number;
  timeout?: number;
  options?: Record<string, any>;
}

export interface ReviewError extends Error {
  code: string;
  context?: ReviewContext;
}
