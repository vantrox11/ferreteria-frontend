// Configuración de entorno y construcción de URLs multi-tenant
// 1. Define la URL base de la API (sin subdominio)
const API_BASE_ORIGIN =
  import.meta.env.VITE_API_BASE_ORIGIN || "http://localhost:3001";

// 1.1 Clave de almacenamiento del token (localStorage)
export const TOKEN_KEY =
  import.meta.env.VITE_TOKEN_STORAGE_KEY || "ferreteria_token";

// 1.2 Clave de almacenamiento del usuario (localStorage)
export const USER_KEY =
  import.meta.env.VITE_USER_STORAGE_KEY || "ferreteria_user";

// 2. Función para OBTENER el subdominio actual del navegador (CORREGIDA)
function getSubdomain() {
  const parts = window.location.hostname.split(".");
  
  // La nueva lógica:
  // 1. Debe tener al menos 2 partes (ej. 'ferreteria-b.localhost')
  // 2. La primera parte NO puede ser 'localhost' (para el caso de http://localhost:5173)
  // 3. La primera parte NO puede ser 'www'
  if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
    return parts[0]; // Devuelve 'ferreteria-b'
  }
  return null;
}

// 3. Construye la URL de la API dinámicamente
export function getApiBaseUrl(): string {
  const subdomain = getSubdomain();

  // Si NO hay subdominio (estamos en la landing 'localhost'),
  // devuelve la URL base (para el registro)
  if (!subdomain) {
    return API_BASE_ORIGIN;
  }

  // Si SÍ hay subdominio, lo añade a la URL
  try {
    const url = new URL(API_BASE_ORIGIN);
    url.host = `${subdomain}.${url.host}`; // Ej: "central.localhost:3001"
    return url.toString().slice(0, -1); // Quita el "/" final
  } catch (error) {
    console.error("Error constructing API URL", error);
    return API_BASE_ORIGIN;
  }
}

// Alias para mantener compatibilidad con documentación y consumidores existentes
export function buildTenantApiBase(): string {
  return getApiBaseUrl();
}
