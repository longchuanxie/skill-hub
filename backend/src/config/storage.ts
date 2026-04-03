import dotenv from 'dotenv';

dotenv.config();

export interface StorageConfig {
  localPath: string;
  baseUrl: string;
}

export const storageConfig: StorageConfig = {
  localPath: process.env.STORAGE_LOCAL_PATH || 'uploads',
  baseUrl: process.env.STORAGE_BASE_URL || '',
};

export const getLocalPath = (): string => {
  return storageConfig.localPath;
};

export const getBaseUrl = (): string => {
  return storageConfig.baseUrl;
};

export const getStorageConfig = (): StorageConfig => {
  return { ...storageConfig };
};
