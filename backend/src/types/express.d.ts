import 'express';

declare module 'express' {
  interface Request {
    filePath?: string;
  }
}
