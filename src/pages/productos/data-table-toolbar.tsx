"use client"

import type { Table } from "@tanstack/react-table"
import { X, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchTerm: string
  onSearchChange: (value: string) => void
  categorias?: Array<{ id: number; nombre: string }>
  onCategoriaChange: (value: string | undefined) => void
  selectedCategoria?: string
  onStockFilterChange: (value: string) => void
  selectedStockFilter: string
}

export function DataTableToolbar<TData>({
  table,
  searchTerm,
  onSearchChange,
  categorias = [],
  onCategoriaChange,
  selectedCategoria,
  onStockFilterChange,
  selectedStockFilter,
}: DataTableToolbarProps<TData>) {
  const hasActiveFilters = searchTerm || selectedCategoria || selectedStockFilter !== "all"

  const clearFilters = () => {
    onSearchChange("")
    onCategoriaChange(undefined)
    onStockFilterChange("all")
  }

  const getStockFilterLabel = () => {
    switch (selectedStockFilter) {
      case "in_stock":
        return "Con stock"
      case "out_of_stock":
        return "Sin stock"
      case "low_stock":
        return "Stock bajo"
      default:
        return "Todos"
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtro de Categoría */}
        <Select
          value={selectedCategoria || "all"}
          onValueChange={(value) => onCategoriaChange(value === "all" ? undefined : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="none">Sin categoría</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de Stock */}
        <Select
          value={selectedStockFilter}
          onValueChange={onStockFilterChange}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="in_stock">Con stock</SelectItem>
            <SelectItem value="out_of_stock">Sin stock</SelectItem>
            <SelectItem value="low_stock">Stock bajo</SelectItem>
          </SelectContent>
        </Select>

        {/* Vista de columnas */}
        <DataTableViewOptions table={table} />

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3"
          >
            Limpiar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Badges de filtros activos */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Búsqueda: {searchTerm}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onSearchChange("")}
              />
            </Badge>
          )}
          {selectedCategoria && (
            <Badge variant="secondary" className="gap-1">
              {selectedCategoria === "none"
                ? "Sin categoría"
                : categorias.find((c) => String(c.id) === selectedCategoria)?.nombre || "Categoría"}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onCategoriaChange(undefined)}
              />
            </Badge>
          )}
          {selectedStockFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {getStockFilterLabel()}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onStockFilterChange("all")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
