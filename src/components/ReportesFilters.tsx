import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, FileSpreadsheet, FileText, Search } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ReportesFiltersProps {
  tipoReporte: string;
  onTipoReporteChange: (tipo: string) => void;
  mes: string;
  onMesChange: (mes: string) => void;
  año: string;
  onAñoChange: (año: string) => void;
  formatoExportacion: string;
  onFormatoExportacionChange: (formato: string) => void;
  onConsultar: () => void;
  onExportar: () => void;
  isConsultando: boolean;
  isExportando: boolean;
  hasData: boolean;
}

export const ReportesFilters: React.FC<ReportesFiltersProps> = ({
  tipoReporte,
  onTipoReporteChange,
  mes,
  onMesChange,
  año,
  onAñoChange,
  formatoExportacion,
  onFormatoExportacionChange,
  onConsultar,
  onExportar,
  isConsultando,
  isExportando,
  hasData,
}) => {
  const meses = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  const añosDisponibles = [];
  const añoActual = new Date().getFullYear();
  for (let i = añoActual; i >= añoActual - 5; i--) {
    añosDisponibles.push(i.toString());
  }

  const getFormatoIcon = () => {
    switch (formatoExportacion) {
      case "excel":
        return <FileSpreadsheet className="mr-2 h-4 w-4" />;
      case "pdf":
        return <FileText className="mr-2 h-4 w-4" />;
      default:
        return <FileDown className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Fila 1: Tipo de Reporte y Período */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tipo de Reporte */}
          <div className="space-y-2">
            <Label>Tipo de Reporte</Label>
            <Select value={tipoReporte} onValueChange={onTipoReporteChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar reporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compras">Libro de Compras</SelectItem>
                <SelectItem value="ventas">Libro de Ventas</SelectItem>
                <SelectItem value="resumen">Resumen Fiscal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mes */}
          <div className="space-y-2">
            <Label>Mes</Label>
            <Select value={mes} onValueChange={onMesChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {meses.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Año */}
          <div className="space-y-2">
            <Label>Año</Label>
            <Select value={año} onValueChange={onAñoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                {añosDisponibles.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botón Consultar */}
          <div className="space-y-2">
            <Label className="invisible">Consultar</Label>
            <Button
              className="w-full"
              onClick={onConsultar}
              disabled={!tipoReporte || !mes || !año || isConsultando}
            >
              <Search className="mr-2 h-4 w-4" />
              {isConsultando ? "Consultando..." : "Consultar"}
            </Button>
          </div>
        </div>

        {/* Fila 2: Formato de Exportación y Botón Exportar */}
        {hasData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Formato de Exportación */}
            <div className="space-y-2 md:col-span-2">
              <Label>Formato de Exportación</Label>
              <Select value={formatoExportacion} onValueChange={onFormatoExportacionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center">
                      <FileDown className="mr-2 h-4 w-4" />
                      CSV (.csv)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      PDF (.pdf)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón Exportar */}
            <div className="space-y-2 md:col-span-2">
              <Label className="invisible">Exportar</Label>
              <Button
                variant="default"
                className="w-full"
                onClick={onExportar}
                disabled={isExportando || !hasData}
              >
                {getFormatoIcon()}
                {isExportando ? "Exportando..." : "Exportar Reporte"}
              </Button>
            </div>
          </div>
        )}

        {/* Información del período seleccionado */}
        {mes && año && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md text-sm">
            <span className="text-muted-foreground">
              Período seleccionado:{" "}
              <span className="font-semibold text-foreground">
                {meses.find((m) => m.value === mes)?.label} {año}
              </span>
            </span>
            {hasData && (
              <span className="text-green-600 font-medium">
                ✓ Datos cargados
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
