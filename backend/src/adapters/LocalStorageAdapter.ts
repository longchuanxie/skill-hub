import { StorageAdapter } from '../interfaces/storage.interface';
import { Express } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getLocalPath, getBaseUrl } from '../config/storage';
import { createLogger } from '../utils/logger';

const logger = createLogger('LocalStorageAdapter');

export class LocalStorageAdapter implements StorageAdapter {
  private localPath: string;
  private baseUrl: string;

  constructor() {
    this.localPath = getLocalPath();
    this.baseUrl = getBaseUrl();
  }

  async upload(file: Express.Multer.File, destination?: string): Promise<string> {
    const uploadDir = destination ? path.resolve(destination) : path.resolve(this.localPath);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filepath, file.buffer);

    logger.debug('File uploaded to local storage', { filename, filepath });

    return filename;
  }

  async delete(filename: string): Promise<void> {
    const filepath = path.join(path.resolve(this.localPath), filename);

    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
      logger.debug('File deleted from local storage', { filename });
    }
  }

  getUrl(filename: string): string {
    if (this.baseUrl) {
      return `${this.baseUrl.replace(/\/$/, '')}/${filename}`;
    }
    return `/uploads/${filename}`;
  }

  getLocalPath(filename: string): string {
    return path.join(path.resolve(this.localPath), filename);
  }

  async fileExists(filename: string): Promise<boolean> {
    const filepath = this.getLocalPath(filename);
    return fs.existsSync(filepath);
  }

  async getFileBuffer(filename: string): Promise<Buffer> {
    const filepath = this.getLocalPath(filename);

    if (!fs.existsSync(filepath)) {
      throw new Error(`File not found: ${filename}`);
    }

    return fs.promises.readFile(filepath);
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
