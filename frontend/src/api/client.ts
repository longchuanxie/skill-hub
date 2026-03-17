import axios, { 
  AxiosInstance, 
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError 
} from 'axios';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = useAuthStore.getState().refreshToken;
          if (refreshToken) {
            const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
            useAuthStore.getState().setToken(data.token);
            originalRequest.headers.Authorization = `Bearer ${data.token}`;
            return client(originalRequest);
          }
        } catch {
          useAuthStore.getState().logout();
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();
