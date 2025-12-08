# Configuración del Frontend (Ferretería Multi-Tenant)

Este proyecto está listo para conectarse a un backend multi-tenant que requiere subdominio en el host.

## Variables de entorno

Copia `.env.example` como `.env.development` o `.env` y ajusta valores:

```
VITE_API_BASE_ORIGIN=http://localhost:3001
VITE_TENANT_SUBDOMAIN=central
VITE_TOKEN_STORAGE_KEY=ferreteria_token
```

## Componentes de configuración añadidos

- `src/config/env.ts`: Centraliza lectura de envs y construye `buildTenantApiBase()`.
- `src/services/http.ts`: Wrapper `fetch` con inyección de `Authorization` y manejo básico de errores.
- `src/services/endpoints.ts`: Helper de rutas de API según contrato.
- `src/auth/token.ts`: Utilidades para leer/escribir el token en `localStorage`.
- `src/router/ProtectedRoute.tsx`: Componente para proteger rutas (requiere token presente).

## Notas de desarrollo

- Mantén el frontend en `http://localhost:5173` (el backend ya permite este origen via CORS).
- Las llamadas al backend se realizan contra `http://<subdominio>.localhost:3001` (se genera automáticamente).
- No se implementan formularios ni CRUD en esta fase; esto es únicamente la configuración base.