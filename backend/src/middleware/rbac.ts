import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ErrorCode, createErrorResponse } from '../utils/errors';

type Role = 'super_admin' | 'admin' | 'audit_admin' | 'enterprise_admin' | 'developer' | 'user';

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(createErrorResponse(ErrorCode.UNAUTHORIZED));
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json(createErrorResponse(ErrorCode.ACCESS_DENIED));
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('super_admin', 'admin', 'audit_admin');
export const requireEnterpriseAdmin = requireRole('super_admin', 'admin', 'enterprise_admin');
export const requireDeveloper = requireRole('super_admin', 'admin', 'enterprise_admin', 'developer');
export const requireSuperAdmin = requireRole('super_admin');
