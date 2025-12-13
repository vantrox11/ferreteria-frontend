import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetApiSesionesCajaIdDetalleCompleto,
  usePostApiSesionesCajaIdCierre,
  usePostApiSesionesCajaIdCierreAdministrativo,
  getGetApiSesionesCajaMonitorActivoQueryKey,
  getGetApiSesionesCajaHistorialQueryKey,
} from "@/api/generated/sesiones-de-caja/sesiones-de-caja";
import { useAuth } from "@/auth/AuthContext";
import { KPIsSection } from "@/components/caja/KPIsSection.tsx";
import { DesgloseMetodosPago } from "@/components/caja/DesgloseMetodosPago.tsx";
import { ResumenOperativo } from "@/components/caja/ResumenOperativo.tsx";
import { LineaTiempoUnificada } from "@/components/caja/LineaTiempoUnificada.tsx";
import { BarraAcciones } from "@/components/caja/BarraAcciones.tsx";
import { ModalRegistroMovimiento } from "@/components/caja/ModalRegistroMovimiento.tsx";
import { ModalArqueoCiego } from "@/components/caja/ModalArqueoCiego.tsx";

export default function CajaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [modalIngreso, setModalIngreso] = useState(false);
  const [modalEgreso, setModalEgreso] = useState(false);
  const [modalCierreNormal, setModalCierreNormal] = useState(false);
  const [modalCierreAdmin, setModalCierreAdmin] = useState(false);
  const [cerrarError, setCerrarError] = useState<string | null>(null);

  // Estado para cierre administrativo
  const [motivoCierre, setMotivoCierre] = useState("");
  const [montoFinalAdmin, setMontoFinalAdmin] = useState<number>(0);

  const { data, isLoading, error, refetch } =
    useGetApiSesionesCajaIdDetalleCompleto(Number(id));

  // Determinar si es el dueño de la sesión o es admin
  const sesion = data?.sesion;
  const isOwner = sesion?.usuario?.id === user?.id;
  const isAdmin = user?.rol === "admin";
  const canDoNormalClose = isOwner; // Solo el dueño puede hacer cierre normal
  const canDoAdminClose = isAdmin && !isOwner; // Admin puede cerrar cajas de otros

  // Mutation para cierre normal
  const cerrarCajaMutation = usePostApiSesionesCajaIdCierre({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSesionesCajaMonitorActivoQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetApiSesionesCajaHistorialQueryKey() });
        navigate("/dashboard/cajas");
      },
      onError: (err) => {
        setCerrarError(err?.message || "Ocurrió un error al cerrar la caja.");
      },
    },
  });

  // Mutation para cierre administrativo
  const cerrarCajaAdminMutation = usePostApiSesionesCajaIdCierreAdministrativo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSesionesCajaMonitorActivoQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetApiSesionesCajaHistorialQueryKey() });
        navigate("/dashboard/cajas");
      },
      onError: (err) => {
        setCerrarError(err?.message || "Ocurrió un error al cerrar la caja administrativamente.");
      },
    },
  });

  const handleRegistrarMovimiento = async (_data: unknown) => {
    try {
      console.log("Registrando movimiento:", _data);
      setModalIngreso(false);
      setModalEgreso(false);
      refetch();
    } catch (err) {
      console.error("Error al registrar movimiento:", err);
    }
  };

  // Cierre normal (solo para el dueño)
  const handleCerrarCajaNormal = async (formData: { monto_real: number }) => {
    setModalCierreNormal(false);
    setCerrarError(null);
    cerrarCajaMutation.mutate({
      id: Number(id),
      data: {
        monto_final: formData.monto_real,
      },
    });
  };

  // Cierre administrativo (para admins)
  const handleCerrarCajaAdmin = async () => {
    if (motivoCierre.trim().length < 10) {
      setCerrarError("El motivo debe tener al menos 10 caracteres.");
      return;
    }
    setModalCierreAdmin(false);
    setCerrarError(null);
    cerrarCajaAdminMutation.mutate({
      id: Number(id),
      data: {
        monto_final: montoFinalAdmin,
        motivo: motivoCierre,
      },
    });
  };

  const handleAbrirModalCierre = () => {
    if (canDoNormalClose) {
      setModalCierreNormal(true);
    } else if (canDoAdminClose) {
      // Pre-cargar el monto teórico
      setMontoFinalAdmin(data?.kpis?.saldo_teorico ?? 0);
      setModalCierreAdmin(true);
    } else {
      setCerrarError("No tienes permisos para cerrar esta caja.");
    }
  };

  const handleImprimir = () => {
    console.log("Generando reporte PDF");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Error al cargar los detalles de la sesión. Por favor, intente
            nuevamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const kpis = data.kpis;
  const desglose = data.desglose_metodos;
  const resumen = data.resumen_operativo;
  const movimientos = data.movimientos || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Alert de error al cerrar */}
      {cerrarError && (
        <Alert variant="destructive">
          <AlertDescription>{cerrarError}</AlertDescription>
        </Alert>
      )}

      {/* Banner de cierre administrativo */}
      {canDoAdminClose && sesion?.estado === "ABIERTA" && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-900/20">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            <strong>Modo Supervisor:</strong> Esta caja pertenece a otro usuario ({sesion.usuario?.nombre || sesion.usuario?.email}).
            Solo puedes realizar un <strong>cierre administrativo</strong> con motivo justificado.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/cajas")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {sesion?.caja?.nombre || "Caja"} - Detalle de Sesión
            </h1>
            <p className="text-muted-foreground">
              Cajero: {sesion?.usuario?.nombre || sesion?.usuario?.email || "Sin asignar"}
              {isOwner && <span className="ml-2 text-green-600">(Tu caja)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Banner si está cerrada */}
      {sesion?.estado === "CERRADA" && sesion.fecha_cierre && (
        <Alert className="border-slate-300 bg-slate-50">
          <AlertDescription className="text-slate-700">
            Esta sesión fue cerrada el{" "}
            {new Date(sesion.fecha_cierre).toLocaleString("es-PE", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* Sección 1: KPIs */}
      <KPIsSection kpis={kpis} estado={sesion?.estado || "ABIERTA"} />

      {/* Sección 2: Grid 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DesgloseMetodosPago desglose={desglose} />
        <ResumenOperativo resumen={resumen} />
      </div>

      {/* Sección 3: Línea de Tiempo */}
      <LineaTiempoUnificada movimientos={movimientos} />

      {/* Barra de Acciones */}
      <BarraAcciones
        estado={sesion?.estado || "ABIERTA"}
        onRegistrarIngreso={() => setModalIngreso(true)}
        onRegistrarEgreso={() => setModalEgreso(true)}
        onAbrirModalCierre={handleAbrirModalCierre}
        onImprimir={handleImprimir}
        isAdmin={canDoAdminClose}
      />

      {/* Modal Cierre Normal (para el dueño) */}
      <ModalArqueoCiego
        open={modalCierreNormal}
        onOpenChange={setModalCierreNormal}
        saldoTeorico={kpis.saldo_teorico}
        onSubmit={handleCerrarCajaNormal}
      />

      {/* Modal Cierre Administrativo (para admins) */}
      <Dialog open={modalCierreAdmin} onOpenChange={setModalCierreAdmin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Cierre Administrativo
            </DialogTitle>
            <DialogDescription>
              Estás cerrando la caja de <strong>{sesion?.usuario?.nombre || sesion?.usuario?.email}</strong>.
              Debes proporcionar un motivo justificado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="monto_final">Monto Contado (S/)</Label>
              <Input
                id="monto_final"
                type="number"
                step="0.01"
                value={montoFinalAdmin}
                onChange={(e) => setMontoFinalAdmin(Number(e.target.value))}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Saldo teórico: S/ {(kpis.saldo_teorico ?? 0).toFixed(2)}
              </p>
            </div>

            <div>
              <Label htmlFor="motivo">Motivo del Cierre Administrativo *</Label>
              <Textarea
                id="motivo"
                value={motivoCierre}
                onChange={(e) => setMotivoCierre(e.target.value)}
                placeholder="Ej: Usuario ausente por emergencia médica, se debe cuadrar caja..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 10 caracteres. Este registro quedará en auditoría.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCierreAdmin(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCerrarCajaAdmin}
              disabled={motivoCierre.trim().length < 10 || cerrarCajaAdminMutation.isPending}
            >
              {cerrarCajaAdminMutation.isPending ? "Cerrando..." : "Confirmar Cierre Administrativo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modales de Movimientos */}
      <ModalRegistroMovimiento
        open={modalIngreso}
        onOpenChange={setModalIngreso}
        tipo="INGRESO"
        onSubmit={handleRegistrarMovimiento}
      />

      <ModalRegistroMovimiento
        open={modalEgreso}
        onOpenChange={setModalEgreso}
        tipo="EGRESO"
        onSubmit={handleRegistrarMovimiento}
      />
    </div>
  );
}
