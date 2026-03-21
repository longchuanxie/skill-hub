import { useTranslation } from 'react-i18next';

export interface ApiError {
  code?: string;
  message?: string;
  details?: any;
}

export function useErrorHandler() {
  const { t } = useTranslation();

  const getErrorMessage = (error: ApiError | Error | any): string => {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.response?.data) {
      const errorData = error.response.data;

      if (errorData.code) {
        const translated = t(`errors.${errorData.code}`);
        if (translated !== `errors.${errorData.code}`) {
          return translated;
        }
      }

      if (errorData.message) {
        return errorData.message;
      }

      if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        return errorData.errors.join(', ');
      }
    }

    if (error?.message) {
      if (error.message === 'Network Error' || error.message.includes('fetch')) {
        return t('errors.networkError');
      }
      return error.message;
    }

    if (error?.code === 'ECONNABORTED') {
      return t('errors.timeout');
    }

    return t('errors.serverError');
  };

  const getErrorCode = (error: ApiError | Error | any): string | undefined => {
    if (error?.response?.data?.code) {
      return error.response.data.code;
    }
    return undefined;
  };

  const isUnauthorized = (error: ApiError | Error | any): boolean => {
    const code = getErrorCode(error);
    return code === 'UNAUTHORIZED' || code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID';
  };

  const isForbidden = (error: ApiError | Error | any): boolean => {
    const code = getErrorCode(error);
    return code === 'FORBIDDEN' || code === 'ACCESS_DENIED' || code === 'NOT_AUTHORIZED';
  };

  const isNotFound = (error: ApiError | Error | any): boolean => {
    const code = getErrorCode(error);
    return code === 'RESOURCE_NOT_FOUND' || 
           code === 'SKILL_NOT_FOUND' || 
           code === 'PROMPT_NOT_FOUND' || 
           code === 'USER_NOT_FOUND' || 
           code === 'FILE_NOT_FOUND';
  };

  const isValidationError = (error: ApiError | Error | any): boolean => {
    const code = getErrorCode(error);
    return code?.startsWith('VAL_') || false;
  };

  const isServerError = (error: ApiError | Error | any): boolean => {
    const code = getErrorCode(error);
    return code?.startsWith('SRV_') || false;
  };

  return {
    getErrorMessage,
    getErrorCode,
    isUnauthorized,
    isForbidden,
    isNotFound,
    isValidationError,
    isServerError,
  };
}