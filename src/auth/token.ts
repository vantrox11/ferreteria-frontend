// Utilidades para gestionar el token JWT en localStorage
import { TOKEN_KEY } from "@/config/env";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

// Alias para compatibilidad
export const clearToken = removeToken;