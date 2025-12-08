import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { useGetApiProveedores } from "@/api/generated/proveedores/proveedores";
import type { Proveedor } from "@/api/generated/model";
import { Loader2 } from "lucide-react";

type ProviderSelectorProps = {
  value?: number | null;
  onValueChange: (proveedor: Proveedor | null) => void;
  disabled?: boolean;
};

export function ProviderSelector({ value, onValueChange, disabled }: ProviderSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: proveedoresResponse, isLoading } = useGetApiProveedores();
  const proveedores = proveedoresResponse?.data ?? [];

  const selectedProveedor = proveedores.find((p) => p.id === value);

  // Filtrar proveedores según término de búsqueda
  const filteredProveedores = proveedores.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(term) ||
      p.ruc_identidad?.toLowerCase().includes(term)
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando proveedores...
            </>
          ) : selectedProveedor ? (
            <span className="truncate">{selectedProveedor.nombre}</span>
          ) : (
            <span className="text-muted-foreground">Seleccionar proveedor</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar proveedor por nombre o RUC..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
            <CommandGroup>
              {/* Opción para limpiar selección */}
              {selectedProveedor && (
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
              
              {filteredProveedores.map((proveedor) => (
                <CommandItem
                  key={proveedor.id}
                  value={String(proveedor.id)}
                  onSelect={() => {
                    onValueChange(proveedor);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === proveedor.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{proveedor.nombre}</span>
                    {proveedor.ruc_identidad && (
                      <span className="text-xs text-muted-foreground">
                        RUC: {proveedor.ruc_identidad}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
