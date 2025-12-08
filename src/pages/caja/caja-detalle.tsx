import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetApiSesionesCajaIdDetalleCompleto } from "@/api/generated/sesiones-de-caja/sesiones-de-caja";
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

  const [modalIngreso, setModalIngreso] = useState(false);
  const [modalEgreso, setModalEgreso] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);

  const { data, isLoading, error, refetch } =
    useGetApiSesionesCajaIdDetalleCompleto(Number(id));

  const handleRegistrarMovimiento = async (_data: any) => {
    try {
      // TODO: Implementar API call para registrar movimiento
      console.log("Registrando movimiento:", _data);
      setModalIngreso(false);
      setModalEgreso(false);
      refetch();
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
    }
  };

  const handleCerrarCaja = async (_data: any) => {
    try {
      // TODO: Implementar API call para cerrar caja
      console.log("Cerrando caja:", _data);
      setTimeout(() => {
        navigate("/dashboard/cajas");
      }, 2000);
    } catch (error) {
      console.error("Error al cerrar caja:", error);
    }
  };

  const handleImprimir = () => {
    console.log("Generando reporte PDF");
    // TODO: Implementar generación de PDF
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

  const sesion = data.sesion;
  const kpis = data.kpis;
  const desglose = data.desglose_metodos;
  const resumen = data.resumen_operativo;
  const movimientos = data.movimientos || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
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
              {sesion.caja?.nombre || "Caja"} - Detalle de Sesión
            </h1>
            <p className="text-muted-foreground">
              Cajero: {sesion.usuario?.nombre || "Sin asignar"}
            </p>
          </div>
        </div>
      </div>

      {/* Banner si está cerrada */}
      {sesion.estado === "CERRADA" && sesion.fecha_cierre && (
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
      <KPIsSection kpis={kpis} estado={sesion.estado} />

      {/* Sección 2: Grid 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DesgloseMetodosPago desglose={desglose} />
        <ResumenOperativo resumen={resumen} />
      </div>

      {/* Sección 3: Línea de Tiempo */}
      <LineaTiempoUnificada movimientos={movimientos} />

      {/* Barra de Acciones */}
      <BarraAcciones
        estado={sesion.estado}
        onRegistrarIngreso={() => setModalIngreso(true)}
        onRegistrarEgreso={() => setModalEgreso(true)}
        onAbrirModalCierre={() => setModalCierre(true)}
        onImprimir={handleImprimir}
      />

      {/* Modales */}
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

      <ModalArqueoCiego
        open={modalCierre}
        onOpenChange={setModalCierre}
        saldoTeorico={kpis.saldo_teorico}
        onSubmit={handleCerrarCaja}
      />
    </div>
  );
}
