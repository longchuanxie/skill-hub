import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Shared in-flight refresh: concurrent 401s wait on one refresh call instead
// of firing several and racing each other.
let refreshPromise: Promise<void> | null = null;

const refreshTokens = async (): Promise<void> => {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  const store = useAuthStore.getState();
  store.setToken(data.token);
  // Persist the rotated refresh token when the backend issues one.
  if (data.refreshToken) {
    store.setRefreshToken(data.refreshToken);
  }
};

// The single shared axios instance for the whole app. Route modules import
// this directly; the interceptors handle auth headers, token refresh and
// logout on failed refresh.
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshTokens().finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${useAuthStore.getState().token}`;
        return apiClient(originalRequest);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);
