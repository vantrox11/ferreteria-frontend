import { Inbox, Loader2 } from "lucide-react";
import CajaCard from "@/components/caja/CajaCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetApiSesionesCajaMonitorActivo } from "@/api/generated/sesiones-de-caja/sesiones-de-caja";

interface MonitorActivoTabProps {
  isAdmin?: boolean;
}

/**
 * Tab "Monitor Activo"
 * Grid de cards mostrando todas las cajas ABIERTAS con KPIs en tiempo real
 * Solo visible para administradores
 */
export default function MonitorActivoTab({ isAdmin = false }: MonitorActivoTabProps) {
  const { data, isLoading, error } = useGetApiSesionesCajaMonitorActivo();
  const cajasAbiertas = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error al cargar cajas abiertas: {error.message || "Error desconocido"}
          <br />
          <span className="text-xs mt-2 block">
            Asegúrate de que el backend esté corriendo y que tengas permisos para acceder a este recurso.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  if (cajasAbiertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Inbox className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No hay cajas abiertas</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Apertura una caja para comenzar a operar. Las cajas activas aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cajasAbiertas.map((caja) => (
        <CajaCard key={caja.id} caja={caja} isAdmin={isAdmin} />
      ))}
    </div>
  );
}
