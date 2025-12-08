// Servicio de API para gestión de proveedores
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";
import type { PaginationParams, PaginatedResponse } from "@/types/api";

export type Proveedor = {
  id: number;
  nombre: string;
  ruc_identidad: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  tenant_id: number;
  isActive: boolean;
};

export type ProveedorCreateInput = {
  nombre: string;
  ruc_identidad?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
};

export type ProveedorUpdateInput = Partial<ProveedorCreateInput> & {
  nombre?: string;
};

export async function listProveedores(params: PaginationParams = {}): Promise<PaginatedResponse<Proveedor>> {
  const { page, limit, q } = params;
  const qs = new URLSearchParams();
  if (page != null) qs.set("page", String(page));
  if (limit != null) qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  const url = `${endpoints.proveedores.list()}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await http.get<PaginatedResponse<Proveedor>>(url);
  console.log("response proveedores →", res);
  return res;

}

export async function searchProveedores(term: string,params: Omit<PaginationParams, "q"> = {}): Promise<Proveedor[]> {
  const response = await listProveedores({ ...params, q: term });
  return response;
}


export async function createProveedor(data: ProveedorCreateInput) {
  return http.post<Proveedor>(endpoints.proveedores.create(), data);
}

export async function updateProveedor(id: number, data: ProveedorUpdateInput) {
  return http.put<Proveedor>(endpoints.proveedores.update(id), data);
}

export async function deactivateProveedor(id: number) {
  return http.patch<{ message: string }>(endpoints.proveedores.deactivate(id));
}
