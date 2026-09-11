export interface EnterpriseConfig {
  enterpriseId: string | null;
  mode: 'multi-tenant' | 'single-tenant';
  allowPublicResources: boolean;
  customDomain?: string;
}

class EnterpriseContext {
  private config: EnterpriseConfig = {
    enterpriseId: null,
    mode: 'multi-tenant',
    allowPublicResources: true,
  };

  private enterpriseCache: Map<string, any> = new Map();

  initialize(config?: Partial<EnterpriseConfig>) {
    if (config) {
      this.config = {
        ...this.config,
        ...config,
      };
    }

    const envEnterpriseId = process.env.ENTERPRISE_ID;
    const envMode = process.env.ENTERPRISE_MODE;

    if (envEnterpriseId) {
      this.config.enterpriseId = envEnterpriseId;
      this.config.mode = 'single-tenant';
    }

    if (envMode === 'single-tenant') {
      this.config.mode = 'single-tenant';
    }

    if (envMode === 'multi-tenant') {
      this.config.mode = 'multi-tenant';
    }

    console.log(`[EnterpriseContext] Initialized in ${this.config.mode} mode`, {
      enterpriseId: this.config.enterpriseId,
    });
  }

  getConfig(): EnterpriseConfig {
    return { ...this.config };
  }

  isSingleTenantMode(): boolean {
    return this.config.mode === 'single-tenant';
  }

  isMultiTenantMode(): boolean {
    return this.config.mode === 'multi-tenant';
  }

  getEnterpriseId(): string | null {
    return this.config.enterpriseId;
  }

  getAllowedEnterpriseIds(): string[] | null {
    if (this.isSingleTenantMode() && this.config.enterpriseId) {
      return [this.config.enterpriseId];
    }
    return null;
  }

  shouldAllowPublicResources(): boolean {
    if (this.isSingleTenantMode()) {
      return this.config.allowPublicResources;
    }
    return true;
  }

  setEnterprise(enterprise: any): void {
    if (this.isSingleTenantMode() && enterprise?._id) {
      this.enterpriseCache.set(enterprise._id.toString(), enterprise);
    }
  }

  getEnterprise(enterpriseId?: string): any | null {
    const id = enterpriseId || this.config.enterpriseId;
    if (id) {
      return this.enterpriseCache.get(id.toString()) || null;
    }
    return null;
  }

  getQueryFilter(baseFilter: Record<string, any> = {}): Record<string, any> {
    if (this.isSingleTenantMode() && this.config.enterpriseId) {
      return {
        ...baseFilter,
        enterpriseId: this.config.enterpriseId,
      };
    }
    return baseFilter;
  }

  validateEnterpriseAccess(enterpriseId: string | undefined): boolean {
    if (!enterpriseId) {
      return !this.isSingleTenantMode();
    }

    if (this.isSingleTenantMode()) {
      return enterpriseId === this.config.enterpriseId;
    }

    return true;
  }
}

export const enterpriseContext = new EnterpriseContext();

export const initializeEnterpriseContext = (config?: Partial<EnterpriseConfig>) => {
  enterpriseContext.initialize(config);
};

export default enterpriseContext;
