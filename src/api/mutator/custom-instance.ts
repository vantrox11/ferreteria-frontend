/**
 * Custom Axios Instance para Orval
 * Maneja automáticamente:
 * - Autenticación JWT
 * - Multi-tenancy por subdominio o header X-Tenant-ID
 * - Manejo consistente de errores
 */

import Axios, { type AxiosRequestConfig } from 'axios';
import { getToken } from '@/auth/token';

/**
 * Obtiene el subdominio del hostname actual
 * Retorna null si no hay subdominio válido
 */
function getSubdomain(): string | null {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Debe tener al menos 2 partes y no ser 'localhost' o 'www'
  if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
    return parts[0];
  }
  return null;
}

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

  const subdomain = getSubdomain();

  if (subdomain) {
    const apiUrl = new URL(apiBaseOrigin);
    apiUrl.hostname = `${subdomain}.${apiUrl.hostname}`;
    return apiUrl.toString();
  }

  return apiBaseOrigin;
}

/**
 * Obtiene el tenant ID para desarrollo
 * Prioridad: subdominio > variable de entorno > null
 */
function getTenantIdForDev(): string | null {
  // 1. Intentar obtener del subdominio (ej: ferreteria-b.localhost:5173)
  const subdomain = getSubdomain();
  if (subdomain) {
    return subdomain;
  }

  // 2. Usar variable de entorno para desarrollo sin subdominio
  const defaultTenant = import.meta.env.VITE_DEFAULT_TENANT;
  if (defaultTenant) {
    return defaultTenant;
  }

  return null;
}

export const AXIOS_INSTANCE = Axios.create({
  baseURL: buildApiBaseUrl(),
});

// Interceptor para agregar token JWT y X-Tenant-ID automáticamente
AXIOS_INSTANCE.interceptors.request.use((config) => {
  // Inyectar token JWT
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // En desarrollo local (sin subdominio en la API), inyectar X-Tenant-ID
  const hostname = window.location.hostname;
  const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalDev) {
    const tenantId = getTenantIdForDev();
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
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
