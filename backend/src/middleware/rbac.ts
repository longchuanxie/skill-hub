import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

type Role = 'admin' | 'enterprise_admin' | 'developer' | 'user';

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireEnterpriseAdmin = requireRole('admin', 'enterprise_admin');
export const requireDeveloper = requireRole('admin', 'enterprise_admin', 'developer');
