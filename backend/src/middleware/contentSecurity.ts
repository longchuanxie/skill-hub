import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

const DANGEROUS_PATTERNS = [
  /ignore\s+(previous|all|above)\s+(instructions?|rules?|constraints?)/i,
  /disregard\s+(previous|all|above)/i,
  /forget\s+(everything|all|your)/i,
  /system\s*prompt\s*injection/i,
  /jailbreak/i,
  /you\s+are\s+now/i,
  /roleplay\s+as\s+without\s+limit/i,
  /override\s+(your|safety)/i,
  /bypass\s+(restriction|filter|limit)/i,
  /<\/?script/i,
  /javascript:/i,
  /on\w+\s*=/i,
];

interface CheckResult {
  safe: boolean;
  issues: string[];
}

const checkContent = (content: string): CheckResult => {
  const issues: string[] = [];
  
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      issues.push(`Dangerous pattern detected: ${pattern.source}`);
    }
  }

  return {
    safe: issues.length === 0,
    issues,
  };
};

export const contentSecurityCheck = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const { name, description, content } = req.body;
  const allContent = [name, description, content].filter(Boolean).join(' ');
  
  const result = checkContent(allContent);
  
  if (!result.safe) {
    res.status(400).json({
      error: 'Content contains potentially unsafe patterns',
      issues: result.issues,
    });
    return;
  }

  next();
};

export const sanitizeContent = (content: string): string => {
  return content
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};
