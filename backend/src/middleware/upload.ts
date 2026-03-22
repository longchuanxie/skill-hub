import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('uploadMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    '.zip',
    '.js', '.ts', '.py', '.json', '.md', '.txt',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    logger.warn('File upload rejected - invalid file type', { 
      filename: file.originalname, 
      mimetype: file.mimetype, 
      ext,
      ip: req.ip 
    });
    cb(new Error(`File type ${ext} not allowed`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const skillFileUpload = upload.single('file');
export const avatarUpload = upload.single('avatar');
export const enterpriseLogoUpload = upload.single('logo');
