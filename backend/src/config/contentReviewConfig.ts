import dotenv from 'dotenv';

dotenv.config();

export interface ContentReviewConfig {
  enabled: boolean;
  strictMode: boolean;
  customPluginPath?: string;
  timeout: number;
  skipMaliciousCodeCheck: boolean;
  skipSensitiveInfoCheck: boolean;
  skipFormatValidation: boolean;
}

export const contentReviewConfig: ContentReviewConfig = {
  enabled: process.env.CONTENT_REVIEW_ENABLED !== 'false',
  strictMode: process.env.CONTENT_REVIEW_STRICT_MODE === 'true',
  customPluginPath: process.env.CUSTOM_REVIEW_PLUGIN_PATH || undefined,
  timeout: parseInt(process.env.CONTENT_REVIEW_TIMEOUT || '30000', 10),
  
  skipMaliciousCodeCheck: process.env.SKIP_MALICIOUS_CODE_CHECK === 'true',
  skipSensitiveInfoCheck: process.env.SKIP_SENSITIVE_INFO_CHECK === 'true',
  skipFormatValidation: process.env.SKIP_FORMAT_VALIDATION === 'true',
};

export const isReviewEnabled = (): boolean => {
  return contentReviewConfig.enabled;
};

export const isStrictMode = (): boolean => {
  return contentReviewConfig.strictMode;
};

export const shouldUseCustomPlugin = (): boolean => {
  return !!contentReviewConfig.customPluginPath;
};

export const getReviewConfig = (): ContentReviewConfig => {
  return { ...contentReviewConfig };
};
