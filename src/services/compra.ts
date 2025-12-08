// Servicio de API para gestión de Órdenes de Compra
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";
import type { PaginatedResponse, PaginationParams } from "@/types/api";

// --- Tipos ---
export type OrdenCompraDetalle = {
  id: number;
  orden_compra_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  producto?: {
    nombre: string;
    sku: string | null;
  };
};

export type OrdenCompra = {
  id: number;
  proveedor_id: number;
  usuario_id: number;
  estado: string;
  total: string;
  fecha_creacion?: string;
  proveedor?: {
    nombre: string;
    ruc: string | null;
  };
  usuario?: {
    nombre: string;
    email: string;
  };
  detalles?: OrdenCompraDetalle[];
};

// --- Inputs para crear ---
export type OrdenCompraDetalleInput = {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
};

export type OrdenCompraCreateInput = {
  proveedor_id: number;
  detalles: OrdenCompraDetalleInput[];
};

// --- Listado paginado ---
export async function listOrdenesCompra(
  params: PaginationParams = {}
): Promise<PaginatedResponse<OrdenCompra>> {

  const { page, limit, q, fecha_inicio, fecha_fin } = params;
  const qs = new URLSearchParams();

  if (page != null) qs.set("page", String(page));
  if (limit != null) qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  if (fecha_inicio) qs.set("fecha_inicio", fecha_inicio);
  if (fecha_fin) qs.set("fecha_fin", fecha_fin);

  const url = `${endpoints.compras.list()}${qs.toString() ? `?${qs.toString()}` : ""}`;
  return http.get<PaginatedResponse<OrdenCompra>>(url);
}

// --- Obtener por ID ---
export async function getOrdenCompraById(id: number): Promise<OrdenCompra> {
  return http.get<OrdenCompra>(`/api/ordenes-compra/${id}`);
}

// --- Crear nueva orden de compra ---
export async function createOrdenCompra(data: OrdenCompraCreateInput) {
  return http.post<OrdenCompra>(endpoints.compras.create(), data);
}
