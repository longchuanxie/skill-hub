import { Request, Response, NextFunction } from 'express';
import { enterpriseContext } from '../config/enterpriseContext';
import { Enterprise } from '../models/Enterprise';

export interface EnterpriseRequest extends Request {
  enterpriseContext?: {
    enterpriseId: string | null;
    enterprise?: any;
    isSingleTenant: boolean;
    allowedEnterpriseIds: string[] | null;
  };
}

export const enterpriseMiddleware = async (
  req: EnterpriseRequest,
  res: Response,
  next: NextFunction
) => {
  const isSingleTenant = enterpriseContext.isSingleTenantMode();
  const enterpriseId = enterpriseContext.getEnterpriseId();

  let enterprise = null;
  if (isSingleTenant && enterpriseId) {
    enterprise = enterpriseContext.getEnterprise(enterpriseId);
    if (!enterprise) {
      try {
        enterprise = await Enterprise.findById(enterpriseId);
        if (enterprise) {
          enterpriseContext.setEnterprise(enterprise);
        }
      } catch (error) {
        console.error('[EnterpriseMiddleware] Failed to load enterprise:', error);
      }
    }
  }

  req.enterpriseContext = {
    enterpriseId,
    enterprise,
    isSingleTenant,
    allowedEnterpriseIds: enterpriseContext.getAllowedEnterpriseIds(),
  };

  next();
};

export const requireEnterprise = (
  req: EnterpriseRequest,
  res: Response,
  next: NextFunction
) => {
  if (enterpriseContext.isSingleTenantMode()) {
    const enterpriseId = enterpriseContext.getEnterpriseId();
    if (!enterpriseId) {
      res.status(500).json({
        error: 'Enterprise not configured for single-tenant mode'
      });
      return;
    }
  }
  next();
};

export const getEnterpriseFilter = (baseFilter: Record<string, any> = {}): Record<string, any> => {
  return enterpriseContext.getQueryFilter(baseFilter);
};

export const canAccessEnterprise = (
  enterpriseId: string | undefined,
  req: EnterpriseRequest
): boolean => {
  if (!enterpriseContext.isSingleTenantMode()) {
    return true;
  }

  if (!enterpriseId) {
    return false;
  }

  return enterpriseId === enterpriseContext.getEnterpriseId();
};
