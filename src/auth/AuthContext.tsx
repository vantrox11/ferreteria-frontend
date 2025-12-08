// Contexto de autenticación para gestionar el estado del usuario
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getToken, setToken as setLocalToken, removeToken } from "./token";
import { getStoredUser, setStoredUser, type AuthUser } from "./user";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
  // Mantener setUser para compatibilidad con código existente
  setUser: (u: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inicializar auth desde localStorage al montar
    const storedToken = getToken();
    const storedUser = getStoredUser();

    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUserState(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    setLocalToken(newToken);
    setStoredUser(newUser);
    setTokenState(newToken);
    setUserState(newUser);
  };

  const logout = () => {
    removeToken();
    setStoredUser(null);
    setTokenState(null);
    setUserState(null);
  };

  // Función legacy para compatibilidad (usada en código existente)
  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    setStoredUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

