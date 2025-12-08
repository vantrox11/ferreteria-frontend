import { Plus, Minus, Lock, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarraAccionesProps {
  estado: "ABIERTA" | "CERRADA";
  onRegistrarIngreso: () => void;
  onRegistrarEgreso: () => void;
  onAbrirModalCierre: () => void;
  onImprimir: () => void;
}

export function BarraAcciones({
  estado,
  onRegistrarIngreso,
  onRegistrarEgreso,
  onAbrirModalCierre,
  onImprimir,
}: BarraAccionesProps) {
  if (estado === "ABIERTA") {
    return (
      <div className="sticky bottom-0 bg-background border-t p-4 shadow-lg z-10">
        <div className="container mx-auto flex items-center gap-3">
          <Button variant="outline" onClick={onRegistrarIngreso}>
            <Plus className="h-4 w-4" /> Registrar Ingreso
          </Button>

          <Button variant="outline" onClick={onRegistrarEgreso}>
            <Minus className="h-4 w-4" /> Registrar Egreso
          </Button>

          <div className="flex-1" />

          <Button
            variant="default"
            size="lg"
            onClick={onAbrirModalCierre}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Lock className="h-4 w-4" /> CERRAR CAJA
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 justify-end">
      <Button variant="outline" onClick={onImprimir}>
        <Printer className="h-4 w-4" /> Imprimir Reporte
      </Button>
    </div>
  );
}
