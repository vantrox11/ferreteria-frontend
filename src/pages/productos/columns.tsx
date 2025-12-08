"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { Producto } from "@/api/generated/model"

// Utilidad para formatear moneda
function formatCurrency(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "—"
  const num = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(num)) return String(value)
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num)
}

// Utilidad para formatear stock según la unidad de medida
function formatStock(producto: Producto) {
  // @ts-ignore - El backend incluye la relación unidad_medida
  const unidad = producto.unidad_medida
  const stock = producto.stock ?? 0

  let displayStock: string
  if (unidad?.permite_decimales) {
    displayStock = Number(stock).toFixed(3).replace(/\.?0+$/, "")
  } else {
    displayStock = Math.floor(Number(stock)).toString()
  }

  return { displayStock, unidadCodigo: unidad?.codigo }
}

// Props para las acciones
interface ColumnActionsProps {
  producto: Producto
  onEdit: (producto: Producto) => void
  onDeactivate: (producto: Producto) => void
  onAdjustStock: (producto: Producto) => void
  isAdmin: boolean
  isPending: boolean
}

export function createColumns(actions: Omit<ColumnActionsProps, 'producto' | 'isPending'> & { isPending: boolean }): ColumnDef<Producto>[] {
  return [
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Producto" />
      ),
      cell: ({ row }) => {
        const producto = row.original
        const firstLetter = producto.nombre.charAt(0).toUpperCase()

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={producto.imagen_url || undefined} alt={producto.nombre} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {firstLetter}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{producto.nombre}</span>
              {producto.sku && (
                <span className="text-xs text-muted-foreground">SKU: {producto.sku}</span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      id: "categoria",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Categoría" />
      ),
      cell: ({ row }) => {
        // @ts-ignore - El backend incluye la relación categoria
        const categoria = row.original.categoria
        if (!categoria) return <span className="text-muted-foreground">—</span>
        
        return (
          <Badge variant="outline" className="font-normal">
            {categoria.nombre}
          </Badge>
        )
      },
    },
    {
      id: "marca",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Marca" />
      ),
      cell: ({ row }) => {
        // @ts-ignore - El backend incluye la relación marca
        const marca = row.original.marca
        if (!marca) return <span className="text-muted-foreground">—</span>
        
        return (
          <span className="text-sm text-muted-foreground">{marca.nombre}</span>
        )
      },
    },
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stock" />
      ),
      cell: ({ row }) => {
        const producto = row.original
        const { displayStock, unidadCodigo } = formatStock(producto)
        const stock = Number(producto.stock) || 0
        const stockMinimo = Number(producto.stock_minimo) || 0

        // Determinar el color del badge según el stock
        let variant: "default" | "secondary" | "destructive" = "default"
        if (stock === 0) {
          variant = "destructive"
        } else if (stockMinimo > 0 && stock <= stockMinimo) {
          variant = "secondary"
        }

        return (
          <div className="flex items-center gap-2">
            <Badge variant={variant} className="tabular-nums">
              {displayStock}
            </Badge>
            {unidadCodigo && (
              <span className="text-xs text-muted-foreground">{unidadCodigo}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "precio_base",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="P. Base" />
      ),
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {formatCurrency(row.original.precio_base)}
        </div>
      ),
    },
    {
      accessorKey: "precio_venta",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="P. Venta" />
      ),
      cell: ({ row }) => (
        <div className="text-sm font-semibold text-primary">
          {formatCurrency(row.original.precio_venta)}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const producto = row.original

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => actions.onEdit(producto)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {actions.isAdmin && (
                  <DropdownMenuItem onClick={() => actions.onAdjustStock(producto)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Ajustar stock
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  disabled={actions.isPending}
                  onClick={() => actions.onDeactivate(producto)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Desactivar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
