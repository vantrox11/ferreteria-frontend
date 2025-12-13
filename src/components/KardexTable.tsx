import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { KardexCompletoMovimientosItem } from "@/api/generated/model";
import { formatCurrency } from "@/hooks/usePurchaseOrderCalculator";

interface KardexTableProps {
  movimientos: KardexCompletoMovimientosItem[];
  tipoFiltro: string;
  fechaInicio: string;
  fechaFin: string;
}

export const KardexTable: React.FC<KardexTableProps> = ({
  movimientos,
  tipoFiltro,
  fechaInicio,
  fechaFin,
}) => {
  // Aplicar filtros del lado del cliente
  const movimientosFiltrados = useMemo(() => {
    let filtered = [...movimientos];

    // Filtrar por tipo
    if (tipoFiltro !== "todos") {
      filtered = filtered.filter((m) => m.tipo === tipoFiltro);
    }

    // Filtrar por fecha inicio
    if (fechaInicio) {
      const fechaInicioDate = new Date(fechaInicio);
      filtered = filtered.filter((m) => new Date(m.fecha) >= fechaInicioDate);
    }

    // Filtrar por fecha fin
    if (fechaFin) {
      const fechaFinDate = new Date(fechaFin);
      fechaFinDate.setHours(23, 59, 59, 999); // Incluir todo el día final
      filtered = filtered.filter((m) => new Date(m.fecha) <= fechaFinDate);
    }

    // Recalcular saldos después de filtrar
    if (filtered.length > 0) {
      let saldoAcumulado = 0;
      filtered = filtered.map((mov) => {
        // Entradas: compra, ajuste_entrada, devolucion_entrada
        const esEntrada = mov.tipo === "compra" || mov.tipo === "ajuste_entrada" || mov.tipo === "devolucion_entrada";
        if (esEntrada) {
          saldoAcumulado += mov.cantidad;
        } else {
          saldoAcumulado -= mov.cantidad;
        }
        return { ...mov, saldo: saldoAcumulado };
      });
    }

    return filtered;
  }, [movimientos, tipoFiltro, fechaInicio, fechaFin]);

  const getTipoBadge = (tipo: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: LucideIcon; className?: string }> = {
      compra: { variant: "default", label: "Compra", icon: TrendingUp },
      venta: { variant: "destructive", label: "Venta", icon: TrendingDown },
      ajuste_entrada: { variant: "secondary", label: "Ajuste +", icon: TrendingUp },
      ajuste_salida: { variant: "outline", label: "Ajuste -", icon: TrendingDown },
      devolucion_entrada: { variant: "secondary", label: "Devolución +", icon: RefreshCw, className: "bg-blue-100 text-blue-700 border-blue-200" },
      devolucion_salida: { variant: "outline", label: "Devolución -", icon: RefreshCw, className: "text-orange-600 border-orange-300" },
    };

    const item = config[tipo] || { variant: "outline" as const, label: tipo, icon: AlertCircle };
    const Icon = item.icon;

    return (
      <Badge variant={item.variant} className={`flex items-center gap-1 w-fit ${item.className || ""}`}>
        <Icon className="h-3 w-3" />
        {item.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (num: number) => {
    return num.toFixed(3).replace(/\.?0+$/, "");
  };

  if (movimientosFiltrados.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No hay movimientos que coincidan con los filtros seleccionados.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabla de movimientos */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader className="bg-muted sticky top-0">
              <TableRow>
                <TableHead className="text-left p-3 font-medium">Fecha</TableHead>
                <TableHead className="text-left p-3 font-medium">Tipo</TableHead>
                <TableHead className="text-left p-3 font-medium">Referencia</TableHead>
                <TableHead className="text-left p-3 font-medium">Tercero</TableHead>
                <TableHead className="text-left p-3 font-medium">Entrada</TableHead>
                <TableHead className="text-left p-3 font-medium">Salida</TableHead>
                <TableHead className="text-left p-3 font-medium">Saldo</TableHead>
                <TableHead className="text-left p-3 font-medium">Costo/Precio Unit.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimientosFiltrados.map((mov, index) => {
                const esEntrada = mov.tipo === "compra" || mov.tipo === "ajuste_entrada" || mov.tipo === "devolucion_entrada";

                return (
                  <TableRow key={index} className="border-t hover:bg-muted/50">
                    {/* Fecha */}
                    <TableCell className="p-3 text-muted-foreground">{formatDate(mov.fecha)}</TableCell>

                    {/* Tipo */}
                    <TableCell className="p-3">{getTipoBadge(mov.tipo)}</TableCell>

                    {/* Referencia */}
                    <TableCell className="p-3">
                      <span className="font-mono text-xs">{mov.referencia}</span>
                    </TableCell>

                    {/* Tercero */}
                    <TableCell className="p-3">
                      {mov.tercero ? (
                        <div>
                          <div className="font-medium">{mov.tercero}</div>
                          {mov.tercero_documento && (
                            <div className="text-xs text-muted-foreground">
                              {mov.tercero_documento}
                            </div>
                          )}
                        </div>
                      ) : mov.responsable ? (
                        <div>
                          <div className="font-medium">Ajuste Manual</div>
                          <div className="text-xs text-muted-foreground">{mov.responsable}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Entrada */}
                    <TableCell className="p-3 text-left tabular-nums">
                      {esEntrada ? (
                        <span className="text-green-600 font-medium">
                          +{formatNumber(mov.cantidad)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Salida */}
                    <TableCell className="p-3 text-left tabular-nums">
                      {!esEntrada ? (
                        <span className="text-red-600 font-medium">
                          -{formatNumber(mov.cantidad)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Saldo */}
                    <TableCell className="p-3 text-left tabular-nums">
                      <span className="font-semibold">{formatNumber(mov.saldo)}</span>
                    </TableCell>

                    {/* Precio Unitario */}
                    <TableCell className="p-3 text-left tabular-nums">
                      {mov.precio_unitario !== undefined && mov.precio_unitario !== null ? (
                        <span className="font-medium">
                          {formatCurrency(mov.precio_unitario)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Resumen inferior */}
      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
        <div className="text-sm text-muted-foreground">
          Total de movimientos: <span className="font-semibold">{movimientosFiltrados.length}</span>
        </div>
        <div className="text-left">
          <div className="text-sm text-muted-foreground">Saldo Final</div>
          <div className="text-2xl font-bold">
            {movimientosFiltrados.length > 0
              ? formatNumber(movimientosFiltrados[movimientosFiltrados.length - 1].saldo)
              : "0"}
          </div>
        </div>
      </div>
    </div>
  );
};
