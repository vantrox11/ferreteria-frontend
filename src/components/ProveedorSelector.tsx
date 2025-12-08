// Selector de proveedores con búsqueda remota y creación rápida
import { useState, useCallback, useEffect } from "react";
import { Check, ChevronsUpDown, Store, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { searchProveedores, type Proveedor } from "@/services/proveedores";
import CreateProviderDialog from "@/components/CreateProviderDialog";

type ProveedorSelectorProps = {
  value: number | null;
  onChange: (proveedorId: number | null, proveedor: Proveedor | null) => void;
  disabled?: boolean;
};

export default function ProveedorSelector({
  value,
  onChange,
  disabled = false,
}: ProveedorSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProveedor, setSelectedProveedor] =
    useState<Proveedor | null>(null);

  // Si ya tenemos un proveedor seleccionado (value), mantenerlo
  useEffect(() => {
    if (value === null) {
      setSelectedProveedor(null);
    }
  }, [value]);

  // Debounce búsqueda remota
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        void fetchProveedores(searchTerm);
      } else {
        setProveedores([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProveedores = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const results = await searchProveedores(term, { limit: 10 });
      setProveedores(results);
    } catch (error) {
      console.error("Error al buscar proveedores:", error);
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (proveedor: Proveedor | null) => {
    setSelectedProveedor(proveedor);
    onChange(proveedor?.id ?? null, proveedor);
    setOpen(false);
    setSearchTerm("");
  };

  const displayValue = selectedProveedor
    ? selectedProveedor.nombre
    : value
    ? "Proveedor seleccionado"
    : "Seleccionar proveedor";

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between"
            disabled={disabled}
          >
            <span className="flex items-center gap-2">
              <Store className="size-4" />
              {displayValue}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />

            <CommandList>
              <CommandEmpty>
                {loading ? "Buscando..." : "No se encontraron proveedores"}
              </CommandEmpty>

              <CommandGroup>
                {proveedores.map((proveedor) => (
                  <CommandItem
                    key={proveedor.id}
                    value={String(proveedor.id)}
                    onSelect={() => handleSelect(proveedor)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === proveedor.id ? "opacity-100" : "opacity-0"
                      )}
                    />

                    <Store className="mr-2 size-4" />

                    <div className="flex flex-col">
                      <span className="font-medium">{proveedor.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {proveedor.ruc_identidad ||
                          proveedor.email ||
                          "Sin RUC"}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              {/* Botón para crear proveedor */}
              <CommandSeparator />
              <CommandGroup>
                <CreateProviderDialog
                  onCreated={(newProveedor) => {
                    handleSelect(newProveedor);
                  }}
                >
                  <div className="cursor-pointer">
                    <CommandItem value="create-new-provider">
                      <ArchiveRestore className="mr-2 size-4" />
                      Crear nuevo proveedor
                    </CommandItem>
                  </div>
                </CreateProviderDialog>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Botón limpiar */}
      {value !== null && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleSelect(null)}
          disabled={disabled}
          title="Limpiar proveedor"
        >
          ✕
        </Button>
      )}
    </div>
  );
}
