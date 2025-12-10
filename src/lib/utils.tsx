import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un valor numérico como moneda peruana (PEN)
 * Maneja valores null, undefined, strings y NaN de forma segura
 */
export function formatCurrency(value: string | number | null | undefined, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num);
}
