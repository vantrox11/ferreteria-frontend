"use client"

import * as React from "react"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Loader2, Pencil, Settings, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useAuth } from "@/auth/AuthContext"
import { useGetApiProductos, usePatchApiProductosIdDesactivar } from "@/api/generated/productos/productos"
import type { Producto } from "@/api/generated/model"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import CreateProductDialog from "@/components/CreateProductDialog"
import EditProductDialog from "@/components/EditProductDialog"

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

export default function ProductosPageV2() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Estados de paginación y búsqueda
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Estados de tabla
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Control de modales
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingProducto, setEditingProducto] = React.useState<Producto | null>(null)
  const [deactivateOpen, setDeactivateOpen] = React.useState(false)
  const [confirmProducto, setConfirmProducto] = React.useState<Producto | null>(null)

  // Debounce para búsqueda
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch data
  const { data, isLoading, error } = useGetApiProductos({
    page: currentPage,
    limit: pageSize,
    q: debouncedSearch || undefined,
  })

  const productos = data?.data || []
  const totalPages = data?.meta?.totalPages || 1

  // Mutation para desactivar
  const desactivarMutation = usePatchApiProductosIdDesactivar({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/productos"] })
        toast.success("Producto desactivado")
        setDeactivateOpen(false)
        setConfirmProducto(null)
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || err?.message || "No se pudo desactivar"
        toast.error(message)
      },
    },
  })

  // Definición de columnas
  const columns = React.useMemo<ColumnDef<Producto>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
     
      {
        accessorKey: "nombre",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Nombre
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.imagen_url ? (
              <img
                src={row.original.imagen_url}
                alt={row.original.nombre}
                className="w-12 h-12 object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none"
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-muted flex items-center justify-center rounded">
                <span className="text-xs text-muted-foreground">
                  {row.original.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-medium">{row.original.nombre}</span>
          </div>
        ),
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.sku || "—"}</span>
        ),
      },
      {
        id: "marca",
        header: "Marca",
        cell: ({ row }) => {
          // @ts-ignore
          return row.original.marca?.nombre || "—"
        },
        enableSorting: false,
      },
      {
        id: "categoria",
        header: "Categoría",
        cell: ({ row }) => {
          // @ts-ignore
          return row.original.categoria?.nombre || "—"
        },
        enableSorting: false,
        filterFn: (row, _id, val?: number | "none" | "all") => {
          if (!val || val === "all") return true
          if (val === "none") return row.original.categoria_id == null
          return Number(row.original.categoria_id) === Number(val)
        },
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => {
          // @ts-ignore
          const unidad = row.original.unidad_medida
          const stock = row.original.stock ?? 0

          let displayStock: string
          if (unidad?.permite_decimales) {
            displayStock = Number(stock).toFixed(3).replace(/\.?0+$/, "")
          } else {
            displayStock = Math.floor(Number(stock)).toString()
          }

          return (
            <div className="flex items-center gap-1">
              <span className="tabular-nums">{displayStock}</span>
              {unidad && <span className="text-xs text-muted-foreground">{unidad.codigo}</span>}
            </div>
          )
        },
        filterFn: (row, _id, value?: "in_stock" | "out_of_stock" | "low_stock" | "all") => {
          if (!value || value === "all") return true
          const stock = Number(row.original.stock) || 0
          const min = Number(row.original.stock_minimo ?? 0)
          if (value === "in_stock") return stock > 0
          if (value === "out_of_stock") return stock === 0
          if (value === "low_stock") return min > 0 && stock <= min
          return true
        },
      },
      {
        accessorKey: "precio_base",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Precio Base
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => formatCurrency(row.original.precio_base),
      },
      {
        accessorKey: "precio_venta",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Precio Venta
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => formatCurrency(row.original.precio_venta),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const producto = row.original

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onSelect={() => {
                      setEditingProducto(producto)
                      setEditOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  {user?.rol === "admin" && (
                    <DropdownMenuItem
                      onSelect={() => {
                        navigate(`/dashboard/inventario?productoId=${producto.id}`)
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" /> Ajustar stock
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    disabled={desactivarMutation.isPending}
                    onSelect={() => {
                      setConfirmProducto(producto)
                      setDeactivateOpen(true)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Desactivar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    [desactivarMutation.isPending, user?.rol, navigate]
  )

  const table = useReactTable({
    data: productos,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Obtener categorías únicas para el filtro
  const categoryMap = new Map<number, string>()
  for (const p of productos) {
    if (p.categoria_id != null) {
      // @ts-ignore
      categoryMap.set(Number(p.categoria_id), p.categoria?.nombre || `#${p.categoria_id}`)
    }
  }
  const categoryOptions = Array.from(categoryMap.entries())

  // Manejo de errores críticos
  if (error && productos.length === 0 && !isLoading) {
    return (
      <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error al cargar productos: {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <div className="flex items-center gap-2">
          <CreateProductDialog
            onCreated={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/productos"] })
            }}
          />
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="text-sm text-red-600" aria-live="assertive">
          {error instanceof Error ? error.message : "Error al cargar productos"}
        </div>
      )}

      {/* Tabla */}
      {isLoading && productos.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : productos.length === 0 && !error ? (
        <div className="text-sm text-muted-foreground">No hay productos activos.</div>
      ) : (
        <div className="relative">
          {isLoading && (
            <div className="absolute top-2 right-2 z-10">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}

          <div className={isLoading ? "pointer-events-none opacity-80 transition-opacity" : "transition-opacity"}>
            <div className="w-full">
              {/* Toolbar */}
              <div className="flex items-center gap-2 py-4">
                <Input
                  placeholder="Buscar por nombre o SKU"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    if (e.target.value === "") setCurrentPage(1)
                  }}
                  className="h-9 w-64"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {(() => {
                      const val = (table.getColumn("stock")?.getFilterValue() as string) || "all"
                      const label =
                        val === "in_stock"
                          ? "Con stock"
                          : val === "out_of_stock"
                          ? "Sin stock"
                          : val === "low_stock"
                          ? "Bajo stock"
                          : "Todos"
                      return (
                        <Button variant="outline" className="h-9">
                          Estado: {label}
                        </Button>
                      )
                    })()}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuItem onClick={() => table.getColumn("stock")?.setFilterValue("all")}>
                      Todos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => table.getColumn("stock")?.setFilterValue("in_stock")}>
                      Con stock
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => table.getColumn("stock")?.setFilterValue("out_of_stock")}>
                      Sin stock
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => table.getColumn("stock")?.setFilterValue("low_stock")}>
                      Bajo stock
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Select
                  value={(table.getColumn("categoria")?.getFilterValue() as any) ?? "all"}
                  onValueChange={(v) => table.getColumn("categoria")?.setFilterValue(v === "all" ? "all" : v)}
                >
                  <SelectTrigger className="h-9 w-44">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categoryOptions.map(([id, name]) => (
                      <SelectItem key={id} value={String(id)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      Columns <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          >
                            {column.id}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
                  selected.
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v))
                      setCurrentPage(1)
                    }}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      {editingProducto && (
        <EditProductDialog
          producto={editingProducto}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open)
            if (!open) setEditingProducto(null)
          }}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ["/api/productos"] })}
        />
      )}
      <AlertDialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          setDeactivateOpen(open)
          if (!open) setConfirmProducto(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar producto</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmProducto
                ? `¿Desactivar el producto "${confirmProducto.nombre}"? Ya no aparecerá en los listados.`
                : "¿Desactivar el producto seleccionado?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmProducto) {
                  desactivarMutation.mutate({ id: confirmProducto.id })
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

