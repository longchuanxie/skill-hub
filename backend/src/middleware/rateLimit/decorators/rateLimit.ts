import { RateLimitOptions, ApiType } from '../RateLimitOptions';

export function RateLimit(
  apiType: ApiType,
  customOptions?: Partial<RateLimitOptions>
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return originalMethod.apply(this, args);
    };

    Reflect.defineMetadata('rateLimitApiType', apiType, descriptor.value);
    if (customOptions) {
      Reflect.defineMetadata('rateLimitOptions', customOptions, descriptor.value);
    }

    return descriptor;
  };
}

export function getRateLimitMetadata(target: any, propertyKey: string): {
  apiType: ApiType;
  options?: Partial<RateLimitOptions>;
} | null {
  const method = target[propertyKey];
  if (!method) return null;

  const apiType = Reflect.getMetadata('rateLimitApiType', method) as ApiType | undefined;
  const options = Reflect.getMetadata('rateLimitOptions', method) as Partial<RateLimitOptions> | undefined;

  if (!apiType) return null;

  return {
    apiType,
    options,
  };
}
