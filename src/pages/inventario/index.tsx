"use client"

import * as React from "react"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Loader2, Plus, Minus } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  useGetApiInventarioAjustes,
  usePostApiInventarioAjustes,
} from "@/api/generated/inventario/inventario"
import type { Producto } from "@/api/generated/model"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

import { ProductSearchSelector } from "@/components/ProductSearchSelector"

// Formato de fecha
function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function InventarioPageV2() {
  const queryClient = useQueryClient()

  // Estados de búsqueda
  const [searchTerm, setSearchTerm] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Estados de tabla
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Control de modal
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedProducto, setSelectedProducto] = React.useState<Producto | null>(null)
  const [tipo, setTipo] = React.useState<"entrada" | "salida">("entrada")
  const [cantidad, setCantidad] = React.useState("")
  const [motivo, setMotivo] = React.useState("")

  // Debounce para búsqueda
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch data
  const { data, isLoading, error } = useGetApiInventarioAjustes()

  const allAjustes = (data?.data || []) as any[]

  // Filtrar localmente por búsqueda
  const ajustes = React.useMemo(() => {
    if (!debouncedSearch) return allAjustes
    const search = debouncedSearch.toLowerCase()
    return allAjustes.filter((ajuste: any) => {
      return (
        ajuste.producto?.nombre?.toLowerCase().includes(search) ||
        ajuste.motivo?.toLowerCase().includes(search) ||
        ajuste.usuario?.nombre?.toLowerCase().includes(search)
      )
    })
  }, [allAjustes, debouncedSearch])

  // Reset form
  const resetForm = () => {
    setSelectedProducto(null)
    setTipo("entrada")
    setCantidad("")
    setMotivo("")
  }

  // Mutation para crear ajuste
  const createMutation = usePostApiInventarioAjustes({
    mutation: {
      onSuccess: async (_data, variables, _context) => {
        const submitter = (window as any).__lastSubmitter
        const keepOpen = submitter?.dataset?.action === "continue"

        toast.success(`Ajuste de ${variables.data.tipo} registrado correctamente`)

        if (keepOpen) {
          // Actualizar stock optimista
          if (selectedProducto) {
            const ajusteNum =
              typeof variables.data.cantidad === "number"
                ? variables.data.cantidad
                : Number(variables.data.cantidad)
            const ajuste = variables.data.tipo === "entrada" ? ajusteNum : -ajusteNum
            const stockActual = selectedProducto.stock ?? 0
            setSelectedProducto((prev) =>
              prev ? { ...prev, stock: stockActual + ajuste } : null
            )
          }
          setCantidad("")
          setMotivo("")
        } else {
          resetForm()
          setDialogOpen(false)
        }

        await queryClient.invalidateQueries({ queryKey: ["/api/inventario/ajustes"] })
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || err?.message || "No se pudo registrar"
        toast.error(message)
      },
    },
  })

  // Definición de columnas
  const columns = React.useMemo<ColumnDef<any>[]>(
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
        accessorKey: "created_at",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Fecha
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.created_at)}</span>
        ),
      },
      {
        id: "producto",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Producto
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <span className="font-medium">{row.original.producto?.nombre || "—"}</span>
        ),
        sortingFn: (rowA, rowB) => {
          const nameA = rowA.original.producto?.nombre || ""
          const nameB = rowB.original.producto?.nombre || ""
          return nameA.localeCompare(nameB, "es")
        },
      },
      {
        accessorKey: "tipo",
        header: "Tipo",
        cell: ({ row }) => {
          const tipo = row.original.tipo
          return (
            <Badge variant={tipo === "entrada" ? "default" : "destructive"}>
              {tipo === "entrada" ? (
                <>
                  <Plus className="mr-1 h-3 w-3" /> Entrada
                </>
              ) : (
                <>
                  <Minus className="mr-1 h-3 w-3" /> Salida
                </>
              )}
            </Badge>
          )
        },
      },
      {
        accessorKey: "cantidad",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Cantidad
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const unidad = row.original.producto?.unidad_medida
          const cantidad = row.original.cantidad ?? 0

          let displayCantidad: string
          if (unidad?.permite_decimales) {
            displayCantidad = Number(cantidad).toFixed(3).replace(/\.?0+$/, "")
          } else {
            displayCantidad = Math.floor(Number(cantidad)).toString()
          }

          return (
            <div className="flex items-center gap-1">
              <span className="tabular-nums">{displayCantidad}</span>
              {unidad && <span className="text-xs text-muted-foreground">{unidad.codigo}</span>}
            </div>
          )
        },
      },
      {
        accessorKey: "motivo",
        header: "Motivo",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.motivo || "—"}
          </span>
        ),
      },
      {
        id: "usuario",
        header: "Usuario",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.usuario?.nombre || "—"}</span>
        ),
        enableSorting: false,
      },
    ],
    []
  )

  const table = useReactTable({
    data: ajustes,
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

  // Handle form submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedProducto) {
      toast.error("Selecciona un producto")
      return
    }
    if (!cantidad || Number(cantidad) <= 0) {
      toast.error("Ingresa una cantidad válida")
      return
    }
    if (!motivo.trim()) {
      toast.error("Ingresa un motivo")
      return
    }

    // Guardar referencia al botón que disparó el submit
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement
    ;(window as any).__lastSubmitter = submitter

    createMutation.mutate({
      data: {
        producto_id: selectedProducto.id,
        tipo,
        cantidad: Number(cantidad),
        motivo: motivo.trim(),
      },
    })
  }

  // Manejo de errores críticos
  if (error && ajustes.length === 0 && !isLoading) {
    return (
      <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
        <h1 className="text-2xl font-semibold">Ajustes de Inventario</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error al cargar ajustes: {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ajustes de Inventario</h1>
        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Ajuste
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Ajuste de Inventario</DialogTitle>
                <DialogDescription>
                  Registra una entrada o salida de inventario no relacionada con ventas o compras
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[calc(90vh-12rem)] pb-6">
                <form id="ajuste-form" onSubmit={handleSubmit} className="space-y-4 pr-4">
                  <div className="space-y-2">
                    <Label htmlFor="producto">Producto *</Label>
                    <ProductSearchSelector
                      selected={selectedProducto}
                      onSelect={setSelectedProducto}
                    />
                    {selectedProducto && (
                      <p className="text-xs text-muted-foreground">
                        Stock actual: {selectedProducto.stock ?? 0}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select value={tipo} onValueChange={(v: "entrada" | "salida") => setTipo(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-green-600" />
                            Entrada
                          </div>
                        </SelectItem>
                        <SelectItem value="salida">
                          <div className="flex items-center gap-2">
                            <Minus className="h-4 w-4 text-red-600" />
                            Salida
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cantidad">Cantidad *</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivo">Motivo *</Label>
                    <Textarea
                      id="motivo"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ej: Merma, ajuste de inventario físico..."
                      rows={3}
                    />
                  </div>
                </form>
              </ScrollArea>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  form="ajuste-form"
                  data-action="continue"
                  variant="outline"
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Registrar y Continuar
                </Button>
                <Button
                  type="submit"
                  form="ajuste-form"
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Registrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="text-sm text-red-600" aria-live="assertive">
          {error instanceof Error ? error.message : "Error al cargar ajustes"}
        </div>
      )}

      {/* Tabla */}
      {isLoading && ajustes.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : ajustes.length === 0 && !error ? (
        <div className="text-sm text-muted-foreground">No hay ajustes registrados.</div>
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
                  placeholder="Buscar por producto, motivo o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-96"
                />
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
