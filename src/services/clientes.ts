// Servicio de API para gestión de clientes
import { http } from "@/services/http";
import { endpoints } from "@/services/endpoints";
import type { PaginationParams, PaginatedResponse } from "@/types/api";

export type Cliente = {
  id: number;
  nombre: string;
  documento_identidad: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  tenant_id: number;
  isActive: boolean;
};

export type ClienteCreateInput = {
  nombre: string;
  documento_identidad?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
};

export type ClienteUpdateInput = Partial<ClienteCreateInput> & {
  nombre?: string;
};

// V2: Retorna respuesta paginada completa con metadata
export async function listClientes(params: PaginationParams = {}): Promise<PaginatedResponse<Cliente>> {
  const { page, limit, q } = params;
  const qs = new URLSearchParams();
  if (page != null) qs.set("page", String(page));
  if (limit != null) qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  const url = `${endpoints.clientes.list()}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await http.get<PaginatedResponse<Cliente>>(url);
  console.log("listClientes response →", res);
  return res;
}

// Búsqueda remota de clientes por término (nombre, documento, email, teléfono)
// Retorna solo el array de clientes para compatibilidad con selectores
export async function searchClientes(term: string, params: Omit<PaginationParams, "q"> = {}): Promise<Cliente[]> {
  const response = await listClientes({ ...params, q: term });
  
  return response.data;
}

export async function createCliente(data: ClienteCreateInput) {
  return http.post<Cliente>(endpoints.clientes.create(), data);
}

export async function updateCliente(id: number, data: ClienteUpdateInput) {
  return http.put<Cliente>(endpoints.clientes.update(id), data);
}

export async function deactivateCliente(id: number) {
  return http.patch<{ message: string }>(endpoints.clientes.deactivate(id));
}
