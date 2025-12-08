/**
 * AdminCajasPage - Gestión de Cajas Físicas con TanStack Table
 */

"use client"

import * as React from "react"
import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table"
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Loader2, Plus, Store, Pencil, Trash2, Power, PowerOff, BadgeCheckIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import {
  useGetApiCajas,
  usePostApiCajas,
  usePutApiCajasId,
  useDeleteApiCajasId,
} from '@/api/generated/cajas/cajas'
import type { Caja } from '@/api/generated/model'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const cajaSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
})

type CajaFormValues = z.infer<typeof cajaSchema>

export default function AdminCajasPage() {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [editingCaja, setEditingCaja] = React.useState<Caja | null>(null)
  const [deletingCaja, setDeletingCaja] = React.useState<Caja | null>(null)

  // Estados de tabla
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const { data: cajasResponse, isLoading, refetch } = useGetApiCajas(
    { includeInactive: 'true' },
    {}
  )
  const cajas = cajasResponse?.data ?? []

  const { mutateAsync: createCaja } = usePostApiCajas()
  const { mutateAsync: updateCaja } = usePutApiCajasId()
  const { mutateAsync: deleteCaja } = useDeleteApiCajasId()

  const createForm = useForm<CajaFormValues>({
    resolver: zodResolver(cajaSchema),
    defaultValues: { nombre: '' },
  })

  const editForm = useForm<CajaFormValues>({
    resolver: zodResolver(cajaSchema),
  })

  const handleCreate = async (data: CajaFormValues) => {
    try {
      await createCaja({ data: { nombre: data.nombre } })
      toast.success('Caja creada exitosamente')
      setShowCreateDialog(false)
      createForm.reset()
      refetch()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast.error('Error al crear caja', { description: errorMessage })
    }
  }

  const handleEdit = async (data: CajaFormValues) => {
    if (!editingCaja) return
    try {
      await updateCaja({ id: editingCaja.id, data: { nombre: data.nombre } })
      toast.success('Caja actualizada')
      setEditingCaja(null)
      refetch()
    } catch (error: unknown) {
      toast.error('Error al actualizar caja')
    }
  }

  const handleToggleActive = async (caja: Caja) => {
    try {
      await updateCaja({
        id: caja.id,
        data: { nombre: caja.nombre, isActive: !caja.isActive },
      })
      toast.success(`Caja ${!caja.isActive ? 'activada' : 'desactivada'}`)
      refetch()
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDelete = async () => {
    if (!deletingCaja) return
    try {
      await deleteCaja({ id: deletingCaja.id })
      toast.success('Caja eliminada')
      setDeletingCaja(null)
      refetch()
    } catch (error) {
      toast.error('Error al eliminar caja')
    }
  }

  // Definición de columnas
  const columns = React.useMemo<ColumnDef<Caja>[]>(
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
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <span className="font-mono text-muted-foreground">#{row.original.id}</span>,
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
            <Store className="h-4 w-4 text-primary" />
            <span className="font-medium">{row.original.nombre}</span>
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Estado",
        cell: ({ row }) => {
          return row.original.isActive ? (
            <Badge variant="secondary" className="bg-blue-500 text-white dark:bg-blue-600">
              <BadgeCheckIcon className="h-3 w-3" />
              Activa
            </Badge>
          ) : (
            <Badge variant="outline">
              <PowerOff className="mr-1 h-3 w-3" />
              Inactiva
            </Badge>
          )
        },
        filterFn: (row, _id, value) => {
          if (value === "all") return true
          if (value === "active") return row.original.isActive === true
          if (value === "inactive") return row.original.isActive === false
          return true
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const caja = row.original
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
                      setEditingCaja(caja)
                      editForm.reset({ nombre: caja.nombre })
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleToggleActive(caja)}>
                    {caja.isActive ? (
                      <><PowerOff className="mr-2 h-4 w-4" /> Desactivar</>
                    ) : (
                      <><Power className="mr-2 h-4 w-4" /> Activar</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDeletingCaja(caja)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [editForm]
  )

  const table = useReactTable({
    data: cajas,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cajas</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Caja
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Caja</DialogTitle>
              <DialogDescription>
                Define el nombre del punto de venta físico
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Caja</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Caja Principal" autoFocus />
                      </FormControl>
                      <FormDescription>
                        Nombre descriptivo del punto de venta
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Crear Caja</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla */}
      {cajas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Store className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-semibold mb-2">No hay cajas configuradas</p>
          <p className="text-sm mb-4">
            Crea al menos una caja para que los cajeros puedan abrir turnos
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Primera Caja
          </Button>
        </div>
      ) : (
        <div>
          {/* Filtros */}
          <div className="flex items-center gap-2 pb-4">
            <Input
              placeholder="Filtrar por nombre..."
              value={(table.getColumn("nombre")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("nombre")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
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
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
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
      )}

      {/* Modal de Edición */}
      {editingCaja && (
        <Dialog open={!!editingCaja} onOpenChange={() => setEditingCaja(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Caja</DialogTitle>
              <DialogDescription>
                Modifica el nombre del punto de venta
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Caja</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Caja Principal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditingCaja(null)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar Cambios</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* AlertDialog de Eliminación */}
      <AlertDialog open={!!deletingCaja} onOpenChange={() => setDeletingCaja(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar caja permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar la caja <strong>"{deletingCaja?.nombre}"</strong>.
              <br />
              <br />
              ⚠️ Esta acción NO se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
