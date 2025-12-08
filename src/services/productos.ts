// Servicio de API para gestión de productos del inventario
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";
import type { PaginationParams, PaginatedResponse } from "@/types/api";

export type Producto = {
  id: number;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
  imagen_url: string | null;
  precio_venta: string;
  costo_compra: string ;
  stock: number;
  stock_minimo: number | null;
  categoria_id: number | null;
  categoria?: { nombre: string | null } | null;
};

export type ProductoCreateInput = {
  nombre: string;
  precio_venta: number;
  stock: number;
  sku?: string | null;
  descripcion?: string | null;
  costo_compra?: number | null;
  stock_minimo?: number | null;
  categoria_id?: number | null;
};

export type ProductoUpdateInput = Partial<ProductoCreateInput> & {
  nombre?: string;
};

// V2: Retorna respuesta paginada completa con metadata
export async function listProductos(params: PaginationParams = {}): Promise<PaginatedResponse<Producto>> {
  const { page, limit, q } = params;
  const qs = new URLSearchParams();
  if (page != null) qs.set("page", String(page));
  if (limit != null) qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  const url = `${endpoints.productos.list()}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await http.get<PaginatedResponse<Producto>>(url);
  return res;
}

// Búsqueda remota de productos por término (nombre, SKU, código)
// Retorna solo el array de productos para compatibilidad con selectores
export async function searchProductos(term: string, params: Omit<PaginationParams, "q"> = {}): Promise<Producto[]> {
  const response = await listProductos({ ...params, q: term });
  return response.data;
}

export async function createProducto(data: ProductoCreateInput) {
  return http.post<Producto>(endpoints.productos.create(), data);
}

export async function updateProducto(id: number, data: ProductoUpdateInput) {
  return http.put<Producto>(endpoints.productos.update(id), data);
}

export async function deactivateProducto(id: number) {
  return http.patch<{ message: string }>(endpoints.productos.deactivate(id));
}
