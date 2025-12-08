import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, TrendingUp } from "lucide-react";
import type { OrdenCompra } from "@/api/generated/model";
import { formatCurrency } from "@/hooks/usePurchaseOrderCalculator";

interface PurchaseReportTableProps {
  compras: OrdenCompra[];
  mes: string;
  año: string;
}

export const PurchaseReportTable: React.FC<PurchaseReportTableProps> = ({
  compras,
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
      GUIA: { variant: "outline", label: "Guía" },
    };

    const item = config[tipo] || { variant: "outline", label: tipo };
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  // Calcular totales
  const totales = compras.reduce(
    (acc, compra) => ({
      subtotal_base: acc.subtotal_base + (Number(compra.subtotal_base) || 0),
      igv: acc.igv + (Number(compra.impuesto_igv) || 0),
      total: acc.total + (Number(compra.total) || 0),
    }),
    { subtotal_base: 0, igv: 0, total: 0 }
  );

  if (compras.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se encontraron compras en el período seleccionado.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header informativo */}
      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Libro de Compras
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Período: {mes}/{año} • {compras.length} registro(s)
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de compras */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="text-left p-3 font-medium">Fecha Emisión</th>
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Comprobante</th>
                <th className="text-left p-3 font-medium">Proveedor</th>
                <th className="text-left p-3 font-medium">RUC</th>
                <th className="text-left p-3 font-medium">Base Imponible</th>
                <th className="text-left p-3 font-medium">IGV (18%)</th>
                <th className="text-left p-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((compra, index) => (
                <tr key={compra.id || index} className="border-t hover:bg-muted/50">
                  {/* Fecha Emisión */}
                  <td className="p-3 text-muted-foreground">
                    {formatDate(compra.fecha_emision)}
                  </td>

                  {/* Tipo */}
                  <td className="p-3">{getTipoComprobanteBadge(compra.tipo_comprobante)}</td>

                  {/* Comprobante */}
                  <td className="p-3">
                    {compra.serie && compra.numero ? (
                      <span className="font-mono text-xs">
                        {compra.serie}-{compra.numero}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sin comprobante</span>
                    )}
                  </td>

                  {/* Proveedor */}
                  <td className="p-3">
                    <div className="font-medium">
                      {compra.proveedor?.nombre || "Sin proveedor"}
                    </div>
                  </td>

                  {/* RUC */}
                  <td className="p-3 font-mono text-xs">
                    {compra.proveedor?.ruc_identidad || "—"}
                  </td>

                  {/* Base Imponible */}
                  <td className="p-3 text-left font-medium tabular-nums">
                    {formatCurrency(Number(compra.subtotal_base) || 0)}
                  </td>

                  {/* IGV */}
                  <td className="p-3 text-left font-medium tabular-nums text-orange-600">
                    {formatCurrency(Number(compra.impuesto_igv) || 0)}
                  </td>

                  {/* Total */}
                  <td className="p-3 text-left font-semibold tabular-nums">
                    {formatCurrency(Number(compra.total) || 0)}
                  </td>
                </tr>
              ))}
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
          • Total: Monto final pagado al proveedor (Base + IGV)
        </p>
      </div>
    </div>
  );
};
