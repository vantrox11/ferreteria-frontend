"use client"

import * as React from "react"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Loader2, Pencil, Trash2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useGetApiProveedores, usePatchApiProveedoresIdDesactivar } from "@/api/generated/proveedores/proveedores"
import type { Proveedor } from "@/api/generated/model"

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

import CreateProviderDialog from "@/components/CreateProviderDialog"
import EditProviderDialog from "@/components/EditProviderDialog"

export default function ProveedoresPageV2() {
  const queryClient = useQueryClient()

  // Estados de tabla (client-side)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Control de modales
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingProveedor, setEditingProveedor] = React.useState<Proveedor | null>(null)
  const [deactivateOpen, setDeactivateOpen] = React.useState(false)
  const [confirmProveedor, setConfirmProveedor] = React.useState<Proveedor | null>(null)

  // Fetch data (sin paginación server-side)
  const { data, isLoading, error } = useGetApiProveedores()
  const proveedores = data?.data || []

  // Mutation para desactivar
  const desactivarMutation = usePatchApiProveedoresIdDesactivar({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/proveedores"] })
        toast.success("Proveedor desactivado")
        setDeactivateOpen(false)
        setConfirmProveedor(null)
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || err?.message || "No se pudo desactivar"
        toast.error(message)
      },
    },
  })

  // Definición de columnas
  const columns = React.useMemo<ColumnDef<Proveedor>[]>(
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
          const p = row.original
          const initials = (p.nombre || "?")
            .trim()
            .slice(0, 2)
            .toUpperCase()
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-8 ring-1 ring-border">
                <AvatarFallback className="font-medium">{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{p.nombre}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "ruc_identidad",
        header: "RUC / Documento",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.ruc_identidad || "—"}
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
          const proveedor = row.original

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
                      setEditingProveedor(proveedor)
                      setEditOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={desactivarMutation.isPending}
                    onSelect={() => {
                      setConfirmProveedor(proveedor)
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
    data: proveedores,
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
  if (error && proveedores.length === 0 && !isLoading) {
    return (
      <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
        <h1 className="text-2xl font-semibold">Proveedores</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error al cargar proveedores: {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proveedores</h1>
        <div className="flex items-center gap-2">
          <CreateProviderDialog
            onCreated={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/proveedores"] })
            }}
          />
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="text-sm text-red-600" aria-live="assertive">
          {error instanceof Error ? error.message : "Error al cargar proveedores"}
        </div>
      )}

      {/* Tabla */}
      {isLoading && proveedores.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : proveedores.length === 0 && !error ? (
        <div className="text-sm text-muted-foreground">No hay proveedores activos.</div>
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
                  placeholder="Buscar por nombre, RUC o documento..."
                  value={(table.getColumn("nombre")?.getFilterValue() as string) ?? ""}
                  onChange={(event) => table.getColumn("nombre")?.setFilterValue(event.target.value)}
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

      {/* Modales */}
      {editingProveedor && (
        <EditProviderDialog
          proveedor={editingProveedor}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open)
            if (!open) setEditingProveedor(null)
          }}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ["/api/proveedores"] })}
        />
      )}
      <AlertDialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          setDeactivateOpen(open)
          if (!open) setConfirmProveedor(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar proveedor</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmProveedor
                ? `¿Desactivar al proveedor "${confirmProveedor.nombre}"? El proveedor ya no aparecerá en los listados.`
                : "¿Desactivar al proveedor seleccionado?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmProveedor) {
                  desactivarMutation.mutate({ id: confirmProveedor.id })
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
