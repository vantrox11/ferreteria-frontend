export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type PaginationParams = {
  page?: number;
  limit?: number;
  q?: string;
  // Filtros comunes adicionales (usados por ventas)
  proveedor_id?: number;
  cliente_id?: number;
  fecha_inicio?: string; // formato 'YYYY-MM-DD' o ISO según backend
  fecha_fin?: string;    // formato 'YYYY-MM-DD' o ISO según backend
};