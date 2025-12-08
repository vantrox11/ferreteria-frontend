import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CornerUpLeft,
  TrendingUp,
  TrendingDown,
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  Receipt,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DetalleCompletoResponseMovimientosItem } from "@/api/generated/model/detalleCompletoResponseMovimientosItem";

interface LineaTiempoUnificadaProps {
  movimientos: DetalleCompletoResponseMovimientosItem[];
}

function getTipoIcon(tipo: string) {
  switch (tipo) {
    case "INGRESO":
      return <TrendingUp className="h-3 w-3" />;
    case "EGRESO":
      return <TrendingDown className="h-3 w-3" />;
    default:
      return <Receipt className="h-3 w-3" />;
  }
}

function getBadgeVariant(tipo: string) {
  switch (tipo) {
    case "INGRESO":
      return "outline"; // verde
    case "EGRESO":
      return "secondary"; // ámbar
    default:
      return "outline";
  }
}

function getMetodoIcon(metodo: string) {
  switch (metodo) {
    case "EFECTIVO":
      return <Banknote className="h-3 w-3" />;
    case "TARJETA":
      return <CreditCard className="h-3 w-3" />;
    case "YAPE":
    case "PLIN":
      return <Smartphone className="h-3 w-3" />;
    case "TRANSFERENCIA":
      return <Building2 className="h-3 w-3" />;
    default:
      return null;
  }
}

interface MovimientoRowProps {
  movimiento: DetalleCompletoResponseMovimientosItem;
}

function MovimientoRow({ movimiento: mov }: MovimientoRowProps) {
  const isDevolucionAutomatica = mov.es_automatico && mov.tipo === "EGRESO";

  return (
    <TableRow
      className={cn(
        isDevolucionAutomatica && "bg-red-50/50 hover:bg-red-50/70"
      )}
    >
      <TableCell className="font-mono text-sm">
        {format(new Date(mov.fecha_hora), "HH:mm", { locale: es })}
      </TableCell>

      <TableCell>
        <Badge variant={getBadgeVariant(mov.tipo)} className="gap-1">
          {getTipoIcon(mov.tipo)}
          {mov.tipo}
        </Badge>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          {isDevolucionAutomatica && (
            <CornerUpLeft className="h-4 w-4 text-red-500" />
          )}
          <span
            className={cn(
              isDevolucionAutomatica && "font-semibold text-red-700"
            )}
          >
            {mov.descripcion}
          </span>
        </div>
        {mov.referencia_tipo && mov.referencia_id && (
          <p className="text-xs text-muted-foreground mt-1">
            Ref: {mov.referencia_tipo} #{mov.referencia_id}
          </p>
        )}
      </TableCell>

      <TableCell>
        <Badge variant="outline" className="gap-1">
          {getMetodoIcon(String(mov.referencia_tipo))}
          {mov.referencia_tipo || "N/A"}
        </Badge>
      </TableCell>

      <TableCell className="text-right">
        <span
          className={cn(
            "font-mono font-semibold",
            mov.tipo === "INGRESO" ? "text-green-600" : "text-red-600"
          )}
        >
          {mov.tipo === "INGRESO" ? "+" : "-"} S/{" "}
          {Math.abs(mov.monto).toFixed(2)}
        </span>
      </TableCell>
    </TableRow>
  );
}

export function LineaTiempoUnificada({
  movimientos,
}: LineaTiempoUnificadaProps) {
  // Ordenar por fecha descendente (más reciente primero)
  const movimientosOrdenados = [...movimientos].sort(
    (a, b) =>
      new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Línea de Tiempo</CardTitle>
        <CardDescription>
          Todas las transacciones ordenadas cronológicamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        {movimientos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay movimientos registrados
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Hora</TableHead>
                  <TableHead className="w-[120px]">Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[140px]">Referencia</TableHead>
                  <TableHead className="text-right w-[140px]">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientosOrdenados.map((mov) => (
                  <MovimientoRow key={mov.id} movimiento={mov} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
