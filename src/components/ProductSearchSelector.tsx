import { useEffect, useState, useMemo } from "react";
import { Check, ChevronsUpDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useGetApiProductos } from "@/api/generated/productos/productos";
import type { Producto } from "@/api/generated/model";

type ProductSearchSelectorProps = {
  selected?: Producto | null;
  onSelect: (producto: Producto) => void;
  placeholder?: string;
  disabled?: boolean;
  items?: Producto[]; // opcional: lista local para fallback
};

export function ProductSearchSelector({
  selected = null,
  onSelect,
  placeholder = "Buscar producto...",
  disabled,
  items = [],
}: ProductSearchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce del término de búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch con React Query (solo si no hay items locales y hay búsqueda)
  const { data: productosResponse, isLoading: loading } = useGetApiProductos(
    { q: debouncedSearch || undefined, limit: 50 },
    { query: { enabled: items.length === 0 && debouncedSearch.length > 0 } }
  );

  // Calcular resultados
  const results = useMemo(() => {
    const t = debouncedSearch.toLowerCase();
    
    let productList: Producto[] = [];
    
    // Si hay items locales, usar solo esos
    if (items.length > 0) {
      productList = items;
    } else {
      // Usar datos de React Query
      productList = productosResponse?.data ?? [];
    }
    
    // Si hay término de búsqueda y items locales, filtrar
    if (t && items.length > 0) {
      productList = productList.filter((p) => {
        const byName = p.nombre?.toLowerCase().includes(t);
        const bySku = p.sku ? p.sku.toLowerCase().includes(t) : false;
        const byId = String(p.id).includes(t);
        return byName || bySku || byId;
      });
    }
    
    // Ordenar por nombre para consistencia
    productList.sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
    return productList;
  }, [debouncedSearch, items, productosResponse?.data]);

  const handleSelect = (producto: Producto) => {
    onSelect(producto);
    setOpen(false);
    setSearchTerm("");
  };

  const displayValue = selected
    ? selected.nombre
    : "Seleccionar producto...";

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
          <span className="flex items-center gap-2 truncate">
            <Package className="size-4 shrink-0" />
            <span className="truncate">{displayValue}</span>
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {loading
                ? "Buscando..."
                : debouncedSearch.length === 0
                ? "Escribe para buscar productos..."
                : "No se encontraron productos"}
            </CommandEmpty>
            <CommandGroup>
              {results.map((producto) => (
                <CommandItem
                  key={producto.id}
                  value={String(producto.id)}
                  onSelect={() => handleSelect(producto)}
                  className="justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Check
                      className={cn(
                        "size-4",
                        selected?.id === producto.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{producto.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {producto.sku ? `SKU: ${producto.sku}` : "Sin SKU"}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    Stock: {Number(producto.stock ?? 0).toFixed(0)}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
