// Definición centralizada de rutas de la API
export const endpoints = {
  auth: {
    register: () => "/api/auth/register",
    login: () => "/api/auth/login",
  },
  productos: {
    list: () => "/api/productos",
    detail: (id: number | string) => `/api/productos/${id}`,
    create: () => "/api/productos",
    update: (id: number | string) => `/api/productos/${id}`,
    deactivate: (id: number | string) => `/api/productos/${id}/desactivar`,
  },
  categorias: {
    list: () => "/api/categorias",
    detail: (id: number | string) => `/api/categorias/${id}`,
    create: () => "/api/categorias",
    update: (id: number | string) => `/api/categorias/${id}`,
    deactivate: (id: number | string) => `/api/categorias/${id}/desactivar`,
  },
  clientes: {
    list: () => "/api/clientes",
    detail: (id: number | string) => `/api/clientes/${id}`,
    create: () => "/api/clientes",
    update: (id: number | string) => `/api/clientes/${id}`,
    deactivate: (id: number | string) => `/api/clientes/${id}/desactivar`,
  },
  proveedores: {
    list: () => "/api/proveedores",
    detail: (id: number | string) => `/api/proveedores/${id}`,
    create: () => "/api/proveedores",
    update: (id: number | string) => `/api/proveedores/${id}`,
    deactivate: (id: number | string) => `/api/proveedores/${id}/desactivar`,
  },
  usuarios: {
    list: () => "/api/usuarios",
    detail: (id: number | string) => `/api/usuarios/${id}`,
    create: () => "/api/usuarios",
    update: (id: number | string) => `/api/usuarios/${id}`,
    deactivate: (id: number | string) => `/api/usuarios/${id}/desactivar`,
  },
  inventario: {
    ajustes: {
      list: () => "/api/inventario/ajustes",
      create: () => "/api/inventario/ajustes",
    },
  },
  ventas: {
    list: () => "/api/ventas",
    create: () => "/api/ventas",
  },
  compras: {
    list: () => "/api/compras",
    create: () => "/api/compras",
  },
  reportes: {
    kardex: (productoId: number | string) => `/api/reportes/kardex/${productoId}`,
  },
  dashboard: {
    ventasEstadisticas: () => "/api/dashboard/ventas/estadisticas",
  },
  healthcheck: () => "/api/healthcheck",
};