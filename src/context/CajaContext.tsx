/**
 * CajaContext - Estado global para control de sesiones de caja
 * 
 * Según doc_funcional_caja.md Sección 2:
 * "El navegador no almacena información crítica de la caja"
 * "La base de datos mantiene el registro persistente de la sesión"
 * 
 * Este contexto mantiene únicamente el ID de la sesión activa en memoria.
 * Al cerrar el navegador, el estado se pierde pero la sesión persiste en BD.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useGetApiSesionesCajaActiva } from '@/api/generated/sesiones-de-caja/sesiones-de-caja';
import type { SesionCaja } from '@/api/generated/model';

interface CajaContextType {
  currentSessionId: number | null;
  currentSession: SesionCaja | null;
  isLoading: boolean;
  setCurrentSession: (session: SesionCaja | null) => void;
  refreshSession: () => void;
  clearSession: () => void;
}

const CajaContext = createContext<CajaContextType | undefined>(undefined);

export function CajaProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSessionState] = useState<SesionCaja | null>(null);
  
  // Consulta GET /sesion-activa al montar el componente
  const { data: sesionActiva, isLoading, refetch } = useGetApiSesionesCajaActiva();

  // Sincronizar con la respuesta del backend
  useEffect(() => {
    if (sesionActiva?.tiene_sesion_activa && sesionActiva.sesion) {
      setCurrentSessionState(sesionActiva.sesion as SesionCaja);
    } else {
      setCurrentSessionState(null);
    }
  }, [sesionActiva]);

  const setCurrentSession = (session: SesionCaja | null) => {
    setCurrentSessionState(session);
  };

  const refreshSession = () => {
    refetch();
  };

  const clearSession = () => {
    setCurrentSessionState(null);
  };

  return (
    <CajaContext.Provider
      value={{
        currentSessionId: currentSession?.id ?? null,
        currentSession,
        isLoading,
        setCurrentSession,
        refreshSession,
        clearSession,
      }}
    >
      {children}
    </CajaContext.Provider>
  );
}

export function useCaja() {
  const context = useContext(CajaContext);
  if (context === undefined) {
    throw new Error('useCaja must be used within a CajaProvider');
  }
  return context;
}
