// Gestión de datos del usuario autenticado en localStorage
import { USER_KEY } from "../config/env";

/**
 * Tipo de usuario autenticado alineado con la respuesta del backend V2
 * Coincide con la respuesta de POST /api/auth/login
 */
export type AuthUser = {
  id: number;
  email: string;
  nombre: string | null;
  rol: string;
};

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null) {
  try {
    if (!user) {
      localStorage.removeItem(USER_KEY);
      return;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}