import { Express } from 'express';

export interface StorageAdapter {
  upload(file: Express.Multer.File, destination?: string): Promise<string>;
  delete(filename: string): Promise<void>;
  getUrl(filename: string): string;
  getLocalPath(filename: string): string;
}

export interface UploadResult {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
}
