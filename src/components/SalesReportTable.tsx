import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, TrendingDown } from "lucide-react";
import type { Venta } from "@/api/generated/model";
import { formatCurrency } from "@/hooks/usePurchaseOrderCalculator";

interface SalesReportTableProps {
  ventas: Venta[];
  mes: string;
  año: string;
}

export const SalesReportTable: React.FC<SalesReportTableProps> = ({
  ventas,
  mes,
  año,
}) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getTipoComprobanteBadge = (tipo: string | null | undefined) => {
    if (!tipo) return <Badge variant="outline">Sin Tipo</Badge>;

    const config: Record<string, { variant: any; label: string }> = {
      FACTURA: { variant: "default", label: "Factura" },
      BOLETA: { variant: "secondary", label: "Boleta" },
      TICKET: { variant: "outline", label: "Ticket" },
    };

    const item = config[tipo] || { variant: "outline", label: tipo };
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  // Calcular totales y valores IGV (calculados ya que aún no están en el modelo)
  const totales = ventas.reduce(
    (acc, venta) => {
      const total = Number(venta.total) || 0;
      const subtotal_base = total / 1.18;
      const igv = subtotal_base * 0.18;
      
      return {
        subtotal_base: acc.subtotal_base + subtotal_base,
        igv: acc.igv + igv,
        total: acc.total + total,
      };
    },
    { subtotal_base: 0, igv: 0, total: 0 }
  );

  const calcularDesglose = (total: number) => {
    const subtotal_base = total / 1.18;
    const igv = subtotal_base * 0.18;
    return { subtotal_base, igv };
  };

  if (ventas.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se encontraron ventas en el período seleccionado.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header informativo */}
      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <TrendingDown className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Libro de Ventas
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Período: {mes}/{año} • {ventas.length} registro(s)
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="text-left p-3 font-medium">Fecha Emisión</th>
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Comprobante</th>
                <th className="text-left p-3 font-medium">Cliente</th>
                <th className="text-left p-3 font-medium">Documento</th>
                <th className="text-left p-3 font-medium">Base Imponible</th>
                <th className="text-left p-3 font-medium">IGV (18%)</th>
                <th className="text-left p-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta, index) => {
                const desglose = calcularDesglose(Number(venta.total) || 0);
                
                return (
                <tr key={venta.id || index} className="border-t hover:bg-muted/50">
                  {/* Fecha Emisión */}
                  <td className="p-3 text-muted-foreground">
                    {formatDate(venta.created_at)}
                  </td>

                  {/* Tipo */}
                  <td className="p-3">
                    {venta.serie?.tipo_comprobante ? (
                      getTipoComprobanteBadge(venta.serie.tipo_comprobante)
                    ) : (
                      <Badge variant="outline">Sin Tipo</Badge>
                    )}
                  </td>

                  {/* Comprobante */}
                  <td className="p-3">
                    {venta.numero_comprobante ? (
                      <span className="font-mono text-xs">
                        {String(venta.numero_comprobante).padStart(8, "0")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sin comprobante</span>
                    )}
                  </td>

                  {/* Cliente */}
                  <td className="p-3">
                    <div className="font-medium">
                      {venta.cliente?.nombre || "Cliente General"}
                    </div>
                  </td>

                  {/* Documento */}
                  <td className="p-3 font-mono text-xs">
                    {venta.cliente?.documento_identidad || "—"}
                  </td>

                  {/* Base Imponible */}
                  <td className="p-3 text-left font-medium tabular-nums">
                    {formatCurrency(desglose.subtotal_base)}
                  </td>

                  {/* IGV */}
                  <td className="p-3 text-left font-medium tabular-nums text-orange-600">
                    {formatCurrency(desglose.igv)}
                  </td>

                  {/* Total */}
                  <td className="p-3 text-left font-semibold tabular-nums">
                    {formatCurrency(Number(venta.total) || 0)}
                  </td>
                </tr>
                );
              })}
            </tbody>

            {/* Totales */}
            <tfoot className="bg-muted/50 border-t-2 border-foreground/20">
              <tr>
                <td colSpan={5} className="p-3 text-left font-bold">
                  TOTALES:
                </td>
                <td className="p-3 text-left font-bold tabular-nums">
                  {formatCurrency(totales.subtotal_base)}
                </td>
                <td className="p-3 text-left font-bold tabular-nums text-orange-600">
                  {formatCurrency(totales.igv)}
                </td>
                <td className="p-3 text-left font-bold tabular-nums text-lg">
                  {formatCurrency(totales.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notas al pie */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          • Base Imponible: Monto sin IGV (Total / 1.18)
        </p>
        <p>
          • IGV: Impuesto General a las Ventas (18% de la Base Imponible)
        </p>
        <p>
          • Total: Monto final cobrado al cliente (Base + IGV)
        </p>
      </div>
    </div>
  );
};
