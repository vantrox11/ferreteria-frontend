/**
 * Custom Axios Instance para Orval
 * Maneja automáticamente:
 * - Autenticación JWT
 * - Multi-tenancy por subdominio
 * - Manejo consistente de errores
 */

import Axios, { type AxiosRequestConfig } from 'axios';
import { getToken } from '@/auth/token';

/**
 * Construye la URL base según el subdominio actual
 */
function buildApiBaseUrl(): string {
  const apiBaseOrigin = import.meta.env.VITE_API_BASE_ORIGIN || 'http://localhost:3001';
  
  const hostname = window.location.hostname;
  
  // En desarrollo local, siempre usar localhost sin subdominio
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return apiBaseOrigin;
  }
  
  const parts = hostname.split('.');
  
  if (parts.length >= 2) {
    const subdomain = parts[0];
    const apiUrl = new URL(apiBaseOrigin);
    apiUrl.hostname = `${subdomain}.${apiUrl.hostname}`;
    return apiUrl.toString();
  }
  
  return apiBaseOrigin;
}

export const AXIOS_INSTANCE = Axios.create({
  baseURL: buildApiBaseUrl(),
});

// Interceptor para agregar token JWT automáticamente
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejo de errores
AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('token');
      // Solo redirigir si NO estamos ya en login/register
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Custom instance para Orval con React Query
 * Esta es la firma que Orval espera cuando se usa con react-query client
 */
export const customInstance = <T>(
  config: AxiosRequestConfig | string,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = Axios.CancelToken.source();

  // Si config es un string, es la URL
  const promise = AXIOS_INSTANCE({
    ...(typeof config === 'string' ? { url: config } : config),
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore - Añadir método cancel para React Query
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export type ErrorType<Error> = Error;

export default customInstance;
