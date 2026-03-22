import { StorageAdapter } from '../interfaces/storage.interface';
import { LocalStorageAdapter, localStorageAdapter } from './LocalStorageAdapter';
import { getLocalPath } from '../config/storage';
import { createLogger } from '../utils/logger';

const logger = createLogger('StorageFactory');

let storageAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (storageAdapter) {
    return storageAdapter;
  }

  logger.info('Using local storage adapter', { localPath: getLocalPath() });
  storageAdapter = localStorageAdapter;

  return storageAdapter;
}

export function resetStorageAdapter(): void {
  storageAdapter = null;
}
