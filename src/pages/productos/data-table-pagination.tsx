"use client"

import type { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function DataTablePagination<TData>({
  table,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  const canPreviousPage = currentPage > 1
  const canNextPage = currentPage < totalPages

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {/* Información de selección y conteo */}
      <div className="flex-1 text-sm text-muted-foreground">
        <div className="flex flex-col gap-1">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span>
              {table.getFilteredSelectedRowModel().rows.length} de{" "}
              {table.getFilteredRowModel().rows.length} fila(s) seleccionadas
            </span>
          )}
          <span>
            Mostrando {startItem} a {endItem} de {totalItems} productos
          </span>
        </div>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center space-x-6 lg:space-x-8">
        {/* Selector de filas por página */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Filas por página</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Indicador de página */}
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Página {currentPage} de {totalPages}
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Ir a primera página</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Ir a página anterior</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Ir a página siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Ir a última página</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
