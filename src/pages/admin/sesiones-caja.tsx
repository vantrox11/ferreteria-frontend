/**
 * AdminSesionesView - Gestión de Sesiones de Caja con TanStack Table
 */

"use client"

import * as React from "react"
import { useCallback } from "react"
import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table"
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Loader2, AlertTriangle, ShieldAlert, Calendar, User, Wallet, BadgeCheckIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { useGetApiSesionesCajaHistorial, usePostApiSesionesCajaIdCierreAdministrativo } from '@/api/generated/sesiones-de-caja/sesiones-de-caja'
import type { SesionCaja } from '@/api/generated/model'
import { getErrorMessage } from '@/lib/api-error'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

const cierreAdministrativoSchema = z.object({
  monto_final: z
    .string()
    .min(1, 'El monto final es requerido')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Debe ser un número válido mayor o igual a 0',
    }),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres'),
})

type CierreAdministrativoFormValues = z.infer<typeof cierreAdministrativoSchema>

export default function AdminSesionesPage() {
  const [selectedSesion, setSelectedSesion] = React.useState<SesionCaja | null>(null)
  const [showCierreModal, setShowCierreModal] = React.useState(false)

  // Estados de tabla
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const { data: sesionesResponse, isLoading, refetch } = useGetApiSesionesCajaHistorial()
  const sesiones = React.useMemo(() =>
    (sesionesResponse?.data ?? []).filter((s: { estado: string }) => s.estado === 'ABIERTA'),
    [sesionesResponse]
  )

  const { mutateAsync: cerrarAdministrativamente } = usePostApiSesionesCajaIdCierreAdministrativo({
    mutation: {
      onError: (error) => {
        console.error('Error en mutation:', error)
        toast.error('Error al cerrar sesión', {
          description: getErrorMessage(error),
        })
      }
    }
  })

  const form = useForm<CierreAdministrativoFormValues>({
    resolver: zodResolver(cierreAdministrativoSchema),
    defaultValues: {
      monto_final: '',
      motivo: '',
    },
  })

  const handleOpenCierreModal = useCallback((sesion: SesionCaja) => {
    setSelectedSesion(sesion)
    form.reset({
      monto_final: '',
      motivo: `Cierre administrativo: Usuario ${sesion.usuario?.nombre ?? 'desconocido'} no cerró su turno`,
    })
    setShowCierreModal(true)
  }, [form])

  const handleCierreAdministrativo = async (data: CierreAdministrativoFormValues) => {
    if (!selectedSesion) {
      toast.error('No hay sesión seleccionada')
      return
    }

    const sesionId = selectedSesion.id
    const usuarioNombre = selectedSesion.usuario?.nombre ?? 'usuario'

    try {
      // Cerrar modal INMEDIATAMENTE para evitar re-renders
      setShowCierreModal(false)

      await cerrarAdministrativamente({
        id: sesionId,
        data: {
          monto_final: Number(data.monto_final),
          motivo: data.motivo,
        },
      })

      // Limpiar estado
      setSelectedSesion(null)
      form.reset()

      toast.success('Sesión cerrada administrativamente', {
        description: `Sesión de ${usuarioNombre} cerrada con éxito`,
      })

      // Refetch después de un delay para evitar race conditions
      setTimeout(() => {
        refetch()
      }, 500)
    } catch (error) {
      console.error('Error en cierre administrativo:', error)

      // Re-abrir modal en caso de error
      setShowCierreModal(true)

      toast.error('Error al cerrar sesión', {
        description: getErrorMessage(error),
        duration: 5000,
      })
    }
  }

  // Definición de columnas
  const columns = React.useMemo<ColumnDef<SesionCaja>[]>(
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
        id: "usuario",
        header: "Usuario",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.usuario?.nombre ?? 'Usuario'}</span>
          </div>
        ),
      },
      {
        id: "caja",
        header: "Caja",
        cell: ({ row }) => <span>{row.original.caja?.nombre ?? 'Caja'}</span>,
      },
      {
        accessorKey: "fecha_apertura",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Apertura
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {new Date(row.original.fecha_apertura).toLocaleString('es-PE', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        ),
      },
      {
        accessorKey: "monto_inicial",
        header: "Monto Inicial",
        cell: ({ row }) => (
          <span className="font-mono">S/ {Number(row.original.monto_inicial ?? 0).toFixed(2)}</span>
        ),
      },
      {
        accessorKey: "total_ventas",
        header: "Ventas",
        cell: ({ row }) => (
          <span className="font-mono text-green-600">
            S/ {Number(row.original.total_ventas ?? 0).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
          const estado = row.original.estado;
          return estado === "ABIERTA" ? (
            <Badge variant="secondary" className="bg-blue-500 text-white dark:bg-blue-600">
              <BadgeCheckIcon className="h-3 w-3" />
              Abierta
            </Badge>
          ) : (
            <Badge variant="secondary">
              Cerrada
            </Badge>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const sesion = row.original
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onSelect={() => handleOpenCierreModal(sesion)}
                    className="text-destructive focus:text-destructive"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Cierre Forzoso
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [handleOpenCierreModal]
  )

  const table = useReactTable({
    data: sesiones,
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
        <h1 className="text-2xl font-semibold">Sesiones de Caja</h1>
      </div>

      {/* Tabla */}
      {sesiones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Wallet className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-semibold mb-2">No hay sesiones activas</p>
          <p className="text-sm">Todas las cajas están cerradas correctamente</p>
        </div>
      ) : (
        <div>
          {/* Filtros */}
          <div className="flex items-center gap-2 pb-4">
            <Input
              placeholder="Filtrar por usuario..."
              value={(table.getColumn("usuario")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("usuario")?.setFilterValue(event.target.value)
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

      {/* Modal de Cierre Administrativo */}
      <Dialog open={showCierreModal} onOpenChange={setShowCierreModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Cierre Administrativo
            </DialogTitle>
            <DialogDescription>
              Estás por cerrar forzosamente la sesión de{' '}
              <span className="font-semibold">{selectedSesion?.usuario?.nombre}</span>. Cuenta el
              dinero físico que hay en el cajón e ingresa el monto exacto.
            </DialogDescription>
          </DialogHeader>

          {selectedSesion && (
            <div className="space-y-2 rounded-lg border bg-muted/50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto Inicial:</span>
                <span className="font-medium">S/ {Number(selectedSesion.monto_inicial ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Ventas:</span>
                <span className="font-medium text-green-600">
                  + S/ {Number(selectedSesion.total_ventas ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Egresos:</span>
                <span className="font-medium text-red-600">
                  - S/ {Number(selectedSesion.total_egresos ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Esperado:</span>
                <span className="font-bold">
                  S/{' '}
                  {(
                    Number(selectedSesion.monto_inicial ?? 0) +
                    Number(selectedSesion.total_ventas ?? 0) -
                    Number(selectedSesion.total_egresos ?? 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCierreAdministrativo)} className="space-y-4">
              <FormField
                control={form.control}
                name="monto_final"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Real (Contado Físicamente)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          S/
                        </span>
                        <Input
                          {...field}
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          className="pl-10 text-lg font-semibold"
                          onChange={(e) => {
                            // Limpiar input: solo números y punto decimal
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            field.onChange(value);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Cuenta los billetes y monedas del cajón</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo del Cierre Administrativo</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Ej: Usuario no cerró su turno al finalizar su jornada"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>Mínimo 10 caracteres (auditoría)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCierreModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  CONFIRMAR CIERRE FORZOSO
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
