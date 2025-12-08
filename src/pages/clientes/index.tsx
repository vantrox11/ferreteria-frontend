"use client"

import * as React from "react"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Loader2, Pencil, Trash2, CreditCard, Calendar, XCircle, CheckCircle2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useGetApiClientes, usePatchApiClientesIdDesactivar } from "@/api/generated/clientes/clientes"
import type { Cliente } from "@/api/generated/model"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

import CreateClientDialog from "@/components/CreateClientDialog"
import EditClientDialog from "@/components/EditClientDialog"

export default function ClientesPageV2() {
  const queryClient = useQueryClient()

  // Estados de paginación server-side
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Estados de tabla
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Búsqueda con debounce
  const [searchTerm, setSearchTerm] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Control de modales
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingCliente, setEditingCliente] = React.useState<Cliente | null>(null)
  const [deactivateOpen, setDeactivateOpen] = React.useState(false)
  const [confirmCliente, setConfirmCliente] = React.useState<Cliente | null>(null)

  // Debounce para búsqueda
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch data
  const { data, isLoading, error } = useGetApiClientes({
    page: currentPage,
    limit: pageSize,
  })

  const allClientes = data?.data || []
  
  // Filtrar localmente por búsqueda
  const clientes = React.useMemo(() => {
    if (!debouncedSearch) return allClientes
    const search = debouncedSearch.toLowerCase()
    return allClientes.filter(c => 
      c.nombre?.toLowerCase().includes(search) ||
      c.documento_identidad?.toLowerCase().includes(search) ||
      c.ruc?.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search)
    )
  }, [allClientes, debouncedSearch])

  const totalPages = data?.meta?.totalPages || 1

  // Mutation para desactivar
  const desactivarMutation = usePatchApiClientesIdDesactivar({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/clientes"] })
        toast.success("Cliente desactivado")
        setDeactivateOpen(false)
        setConfirmCliente(null)
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || err?.message || "No se pudo desactivar"
        toast.error(message)
      },
    },
  })

  // Definición de columnas
  const columns = React.useMemo<ColumnDef<Cliente>[]>(
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
        cell: ({ row }) => {
          const c = row.original
          const initials = (c.nombre || "?")
            .trim()
            .slice(0, 2)
            .toUpperCase()
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-8 ring-1 ring-border">
                <AvatarFallback className="font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{c.nombre}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "documento_identidad",
        header: "Documento",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.documento_identidad || "—"}
          </span>
        ),
      },
      {
        accessorKey: "ruc",
        header: "RUC",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.ruc || "—"}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.email || "—"}</span>
        ),
      },
      {
        accessorKey: "telefono",
        header: "Teléfono",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.telefono || "—"}</span>
        ),
      },
      {
        id: "credito",
        header: "Línea de Crédito",
        cell: ({ row }) => {
          const limite = row.original.limite_credito;
          const dias = row.original.dias_credito;
          
          // Sin crédito habilitado
          if (!limite || limite <= 0) {
            return (
              <Badge variant="secondary" className="gap-1.5">
                <XCircle className="h-3 w-3" />
                Sin crédito
              </Badge>
            );
          }
          
          // Con crédito habilitado
          return (
            <div className="flex flex-col gap-1.5">
              <Badge variant="secondary" className="bg-blue-500 text-white dark:bg-blue-600 gap-1.5 w-fit">
                <CreditCard className="h-3 w-3" />
                S/ {Number(limite).toFixed(2)}
              </Badge>
              <Badge variant="outline" className="gap-1.5 text-xs w-fit">
                <Calendar className="h-3 w-3" />
                {dias} días
              </Badge>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "direccion",
        header: "Dirección",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
            {row.original.direccion?.trim() || "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const cliente = row.original

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
                      setEditingCliente(cliente)
                      setEditOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={desactivarMutation.isPending}
                    onSelect={() => {
                      setConfirmCliente(cliente)
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
    [desactivarMutation.isPending]
  )

  const table = useReactTable({
    data: clientes,
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

  // Manejo de errores críticos
  if (error && clientes.length === 0 && !isLoading) {
    return (
      <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error al cargar clientes: {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="flex items-center gap-2">
          <CreateClientDialog
            onCreated={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/clientes"] })
            }}
          />
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="text-sm text-red-600" aria-live="assertive">
          {error instanceof Error ? error.message : "Error al cargar clientes"}
        </div>
      )}

      {/* Tabla */}
      {isLoading && clientes.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clientes.length === 0 && !error ? (
        <div className="text-sm text-muted-foreground">No hay clientes activos.</div>
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
                  placeholder="Buscar por nombre, documento, RUC o email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    if (e.target.value === "") setCurrentPage(1)
                  }}
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
      {editingCliente && (
        <EditClientDialog
          cliente={editingCliente}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open)
            if (!open) setEditingCliente(null)
          }}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ["/api/clientes"] })}
        />
      )}
      <AlertDialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          setDeactivateOpen(open)
          if (!open) setConfirmCliente(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCliente
                ? `¿Desactivar al cliente "${confirmCliente.nombre}"? El cliente ya no aparecerá en los listados.`
                : "¿Desactivar al cliente seleccionado?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmCliente) {
                  desactivarMutation.mutate({ id: confirmCliente.id })
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
