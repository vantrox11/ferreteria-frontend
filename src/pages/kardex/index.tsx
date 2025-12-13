/**
 * Página: Kardex Fiscal
 * Reporte completo de movimientos de inventario con información fiscal
 */

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText, FileDown } from "lucide-react";
import { KardexFilters } from "@/components/KardexFilters";
import { KardexTable } from "@/components/KardexTable";
import { useGetApiReportesKardexProductoId } from "@/api/generated/reportes/reportes";
import type { KardexCompletoProducto, KardexCompletoMovimientosItem } from "@/api/generated/model";
import { toast } from "sonner";

const KardexPage = () => {
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState<string>("todos");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch kardex data solo si hay producto seleccionado
  const {
    data: kardexData,
    isLoading,
    isError,
    error,
  } = useGetApiReportesKardexProductoId(selectedProductoId!, {
    query: {
      enabled: !!selectedProductoId,
    },
  });

  const handleExportExcel = async () => {
    if (!kardexData || !selectedProductoId) {
      toast.error("No hay datos para exportar");
      return;
    }

    setIsExporting(true);
    try {
      // Preparar datos para exportar
      const movimientos = kardexData.movimientos;

      // Aplicar filtros
      let filtered = [...movimientos];
      if (tipoMovimiento !== "todos") {
        filtered = filtered.filter((m) => m.tipo === tipoMovimiento);
      }
      if (fechaInicio) {
        filtered = filtered.filter((m) => new Date(m.fecha) >= new Date(fechaInicio));
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter((m) => new Date(m.fecha) <= fechaFinDate);
      }

      // TODO: Implementar exportación real a Excel con SheetJS o similar
      // Por ahora, exportar como CSV simple
      const csv = generarCSV(kardexData.producto, filtered);
      descargarCSV(csv, `kardex_${kardexData.producto.nombre}_${new Date().toISOString().split("T")[0]}.csv`);

      toast.success("Kardex exportado exitosamente");
    } catch (err) {
      console.error("Error exportando kardex:", err);
      toast.error("Error al exportar el kardex");
    } finally {
      setIsExporting(false);
    }
  };

  const generarCSV = (producto: KardexCompletoProducto, movimientos: KardexCompletoMovimientosItem[]) => {
    const headers = [
      "Fecha",
      "Tipo",
      "Referencia",
      "Tercero",
      "Documento",
      "Entrada",
      "Salida",
      "Saldo",
      "Costo/Precio",
    ];

    const rows = movimientos.map((mov) => {
      const esEntrada = mov.tipo === "compra" || mov.tipo === "ajuste_entrada";
      return [
        new Date(mov.fecha).toLocaleString("es-PE"),
        mov.tipo.toUpperCase(),
        mov.referencia,
        mov.tercero || mov.responsable || "-",
        mov.tercero_documento || "-",
        esEntrada ? mov.cantidad : 0,
        !esEntrada ? mov.cantidad : 0,
        mov.saldo,
        mov.precio_unitario || "-",
      ];
    });

    const csvContent = [
      `Producto: ${producto.nombre}`,
      `SKU: ${producto.sku || "N/A"}`,
      `Stock Actual: ${kardexData?.stockActual || 0}`,
      `Fecha de Reporte: ${new Date().toLocaleString("es-PE")}`,
      "",
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    return csvContent;
  };

  const descargarCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kardex Fiscal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consulta el historial completo de movimientos de inventario con información fiscal
          </p>
        </div>
      </div>

      {/* Filtros */}
      <KardexFilters
        selectedProductoId={selectedProductoId}
        onProductoChange={setSelectedProductoId}
        tipoMovimiento={tipoMovimiento}
        onTipoMovimientoChange={setTipoMovimiento}
        fechaInicio={fechaInicio}
        onFechaInicioChange={setFechaInicio}
        fechaFin={fechaFin}
        onFechaFinChange={setFechaFin}
      />

      {/* Contenido Principal */}
      {!selectedProductoId ? (
        // Estado inicial: sin producto seleccionado
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border bg-card">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Selecciona un producto</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Usa los filtros superiores para buscar y seleccionar el producto del cual deseas
            consultar el kardex fiscal.
          </p>
        </div>
      ) : isLoading ? (
        // Estado: cargando
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : isError ? (
        // Estado: error
        <div className="rounded-lg border bg-card p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar el kardex:{" "}
              {error?.message || "Ocurrió un error inesperado"}
            </AlertDescription>
          </Alert>
        </div>
      ) : kardexData ? (
        // Estado: datos cargados
        <div className="rounded-lg border bg-card p-6 space-y-6">
          {/* Información del producto */}
          <div className="pb-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">{kardexData.producto.nombre}</h2>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span>SKU: {kardexData.producto.sku || "N/A"}</span>
                  <span>•</span>
                  <span>Stock Actual: <span className="font-semibold text-foreground">{kardexData.stockActual}</span></span>
                  <span>•</span>
                  <span>Total Movimientos: <span className="font-semibold text-foreground">{kardexData.totalMovimientos}</span></span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={isExporting}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? "Exportando..." : "Exportar Excel"}
              </Button>
            </div>
          </div>

          {/* Tabla de movimientos */}
          <KardexTable
            movimientos={kardexData.movimientos}
            tipoFiltro={tipoMovimiento}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
          />
        </div>
      ) : null}
    </div>
  );
};

export default KardexPage;
