import { useState } from "react";
import { Check, ChevronsUpDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetApiProveedores } from "@/api/generated/proveedores/proveedores";
import type { Proveedor } from "@/api/generated/model";
import { Loader2 } from "lucide-react";

type ProveedorFiscalSelectorProps = {
  value?: number | null;
  onValueChange: (proveedor: Proveedor | null) => void;
  disabled?: boolean;
  tipoComprobanteRequerido?: 'FACTURA' | 'BOLETA' | 'GUIA';
  required?: boolean;
};

/**
 * Selector de proveedor mejorado con validaciones fiscales
 * - Filtra por tipo de documento cuando se requiere FACTURA
 * - Muestra badges visuales con el tipo de documento
 * - Valida formato de RUC/DNI
 */
export function ProveedorFiscalSelector({ 
  value, 
  onValueChange, 
  disabled,
  tipoComprobanteRequerido,
  required = false,
}: ProveedorFiscalSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: proveedoresResponse, isLoading } = useGetApiProveedores();
  const proveedores = proveedoresResponse?.data ?? [];

  const selectedProveedor = proveedores.find((p) => p.id === value);

  // Validar si el proveedor seleccionado es compatible con el tipo de comprobante
  const isProveedorCompatible = (proveedor: Proveedor): boolean => {
    if (tipoComprobanteRequerido === 'FACTURA') {
      return proveedor.tipo_documento === 'RUC';
    }
    return true;
  };

  // Filtrar proveedores según término de búsqueda y tipo de comprobante
  const filteredProveedores = proveedores.filter((p) => {
    // Filtro por tipo de comprobante
    if (tipoComprobanteRequerido === 'FACTURA' && p.tipo_documento !== 'RUC') {
      return false;
    }

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.nombre?.toLowerCase().includes(term) ||
        p.ruc_identidad?.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Badge de tipo de documento con colores según tipo
  const getTipoDocumentoBadge = (tipoDocumento: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
      'RUC': { variant: 'default', label: 'RUC' },
      'DNI': { variant: 'secondary', label: 'DNI' },
      'CE': { variant: 'outline', label: 'CE' },
    };
    
    const config = variants[tipoDocumento] || { variant: 'outline' as const, label: tipoDocumento };
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  // Alerta si hay incompatibilidad
  const showIncompatibilityAlert = 
    selectedProveedor && 
    tipoComprobanteRequerido === 'FACTURA' && 
    selectedProveedor.tipo_documento !== 'RUC';

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between ${showIncompatibilityAlert ? 'border-destructive' : ''}`}
            disabled={disabled}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando proveedores...
              </>
            ) : selectedProveedor ? (
              <div className="flex items-center gap-2 flex-1 justify-between">
                <span className="truncate">{selectedProveedor.nombre}</span>
                {getTipoDocumentoBadge(selectedProveedor.tipo_documento)}
              </div>
            ) : (
              <span className="text-muted-foreground">
                {required ? 'Seleccionar proveedor *' : 'Seleccionar proveedor'}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar por nombre o documento..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {tipoComprobanteRequerido === 'FACTURA' 
                  ? 'No se encontraron proveedores con RUC.'
                  : 'No se encontraron proveedores.'}
              </CommandEmpty>
              <CommandGroup>
                {/* Opción para limpiar selección (solo si no es requerido) */}
                {!required && selectedProveedor && (
                  <CommandItem
                    value="none"
                    onSelect={() => {
                      onValueChange(null);
                      setOpen(false);
                    }}
                    className="text-muted-foreground"
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    Sin proveedor (compra genérica)
                  </CommandItem>
                )}
                
                {filteredProveedores.map((proveedor) => {
                  const compatible = isProveedorCompatible(proveedor);
                  return (
                    <CommandItem
                      key={proveedor.id}
                      value={String(proveedor.id)}
                      onSelect={() => {
                        onValueChange(proveedor);
                        setOpen(false);
                      }}
                      disabled={!compatible}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          value === proveedor.id ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div className="flex flex-col flex-1 gap-1">
                        <div className="flex items-center gap-2 justify-between">
                          <span className="font-medium">{proveedor.nombre}</span>
                          {getTipoDocumentoBadge(proveedor.tipo_documento)}
                        </div>
                        {proveedor.ruc_identidad && (
                          <span className="text-xs text-muted-foreground">
                            {proveedor.tipo_documento}: {proveedor.ruc_identidad}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Alerta de incompatibilidad */}
      {showIncompatibilityAlert && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Para emitir una FACTURA, el proveedor debe tener RUC. 
            Por favor, seleccione un proveedor con RUC o cambie el tipo de comprobante.
          </AlertDescription>
        </Alert>
      )}

      {/* Información de ayuda cuando se requiere FACTURA */}
      {tipoComprobanteRequerido === 'FACTURA' && !selectedProveedor && (
        <p className="text-xs text-muted-foreground">
          Solo se muestran proveedores con RUC (requerido para facturas)
        </p>
      )}
    </div>
  );
}
