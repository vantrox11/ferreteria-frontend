import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { ProductSearchSelector } from "@/components/ProductSearchSelector";
import type { Producto } from "@/api/generated/model";

interface KardexFiltersProps {
  selectedProductoId: number | null;
  onProductoChange: (productoId: number | null) => void;
  tipoMovimiento: string;
  onTipoMovimientoChange: (tipo: string) => void;
  fechaInicio: string;
  onFechaInicioChange: (fecha: string) => void;
  fechaFin: string;
  onFechaFinChange: (fecha: string) => void;
}

export const KardexFilters: React.FC<KardexFiltersProps> = ({
  selectedProductoId,
  onProductoChange,
  tipoMovimiento,
  onTipoMovimientoChange,
  fechaInicio,
  onFechaInicioChange,
  fechaFin,
  onFechaFinChange,
}) => {
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  const handleProductoSelect = (producto: Producto) => {
    setSelectedProducto(producto);
    onProductoChange(producto.id);
  };

  const handleLimpiarFiltros = () => {
    setSelectedProducto(null);
    onProductoChange(null);
    onTipoMovimientoChange("todos");
    onFechaInicioChange("");
    onFechaFinChange("");
  };

  return (
    <div className="rounded-lg border bg-card p-4 relative">
      {/* Botón X en esquina superior derecha */}
      {(selectedProductoId || tipoMovimiento !== "todos" || fechaInicio || fechaFin) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLimpiarFiltros}
          className="absolute top-2 right-2 h-6 w-6"
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Filtros en una sola fila */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Producto - ocupa 2 columnas */}
        <div className="space-y-2 md:col-span-2">
          <Label>Producto</Label>
          <ProductSearchSelector
            selected={selectedProducto}
            onSelect={handleProductoSelect}
            placeholder="Buscar por nombre, SKU o código..."
          />
        </div>

        {/* Tipo de Movimiento */}
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={tipoMovimiento} onValueChange={onTipoMovimientoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="venta">Ventas</SelectItem>
              <SelectItem value="compra">Compras</SelectItem>
              <SelectItem value="ajuste_entrada">Ajustes +</SelectItem>
              <SelectItem value="ajuste_salida">Ajustes -</SelectItem>
              <SelectItem value="devolucion_entrada">Devoluciones +</SelectItem>
              <SelectItem value="devolucion_salida">Devoluciones -</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fecha Inicio */}
        <div className="space-y-2">
          <Label>Desde</Label>
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => onFechaInicioChange(e.target.value)}
          />
        </div>

        {/* Fecha Fin */}
        <div className="space-y-2">
          <Label>Hasta</Label>
          <Input
            type="date"
            value={fechaFin}
            onChange={(e) => onFechaFinChange(e.target.value)}
            min={fechaInicio || undefined}
          />
        </div>
      </div>
    </div>
  );
};
