"use client"

import * as React from "react"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Loader2, Pencil, Trash2, Plus } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  useGetApiUnidadesMedida,
  useDeleteApiUnidadesMedidaId,
  usePostApiUnidadesMedida,
  usePutApiUnidadesMedidaId,
} from "@/api/generated/unidades-de-medida/unidades-de-medida"
import type { UnidadMedida } from "@/api/generated/model"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// Schema para crear unidad
const createUnidadSchema = z.object({
  codigo: z.string().min(1, "El código es obligatorio").max(10, "Máximo 10 caracteres"),
  nombre: z.string().min(1, "El nombre es obligatorio").max(50, "Máximo 50 caracteres"),
  permite_decimales: z.boolean(),
})

type CreateUnidadFormValues = z.infer<typeof createUnidadSchema>

// Schema para editar unidad
const editUnidadSchema = z.object({
  codigo: z.string().min(1, "El código es obligatorio").max(10, "Máximo 10 caracteres"),
  nombre: z.string().min(1, "El nombre es obligatorio").max(50, "Máximo 50 caracteres"),
  permite_decimales: z.boolean(),
})

type EditUnidadFormValues = z.infer<typeof editUnidadSchema>

export default function UnidadesMedidaPageV2() {
  const queryClient = useQueryClient()

  // Estados de tabla (client-side)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Control de modales
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingUnidad, setEditingUnidad] = React.useState<UnidadMedida | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [confirmUnidad, setConfirmUnidad] = React.useState<UnidadMedida | null>(null)

  // Fetch data (sin paginación server-side)
  const { data, isLoading, error } = useGetApiUnidadesMedida({ limit: 0 })
  const unidades = React.useMemo(() => {
    const items = data?.data || []
    return items.sort((a, b) => (a.codigo || "").localeCompare(b.codigo || "", "es"))
  }, [data?.data])

  // Form para crear
  const createForm = useForm<CreateUnidadFormValues>({
    resolver: zodResolver(createUnidadSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      permite_decimales: false,
    },
  })

  // Form para editar
  const editForm = useForm<EditUnidadFormValues>({
    resolver: zodResolver(editUnidadSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      permite_decimales: false,
    },
  })

  // Mutations
  const createMutation = usePostApiUnidadesMedida({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/unidades-medida"] })
        toast.success("Unidad de medida creada")
        setCreateOpen(false)
        createForm.reset()
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || err?.message || "No se pudo crear"
        toast.error(message)
      },
    },
  })

  const updateMutation = usePutApiUnidadesMedidaId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/unidades-medida"] })
        toast.success("Unidad de medida actualizada")
        setEditOpen(false)
        setEditingUnidad(null)
        editForm.reset()
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || err?.message || "No se pudo actualizar"
        toast.error(message)
      },
    },
  })

  const deleteMutation = useDeleteApiUnidadesMedidaId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/unidades-medida"] })
        toast.success("Unidad de medida eliminada")
        setDeleteOpen(false)
        setConfirmUnidad(null)
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || err?.message || "No se pudo eliminar"
        toast.error(message)
      },
    },
  })

  // Handlers
  const handleCreate = (values: CreateUnidadFormValues) => {
    createMutation.mutate({
      data: {
        codigo: values.codigo.trim().toUpperCase(),
        nombre: values.nombre.trim(),
        permite_decimales: values.permite_decimales,
      },
    })
  }

  const handleEdit = (values: EditUnidadFormValues) => {
    if (!editingUnidad?.id) return
    updateMutation.mutate({
      id: editingUnidad.id,
      data: {
        codigo: values.codigo.trim().toUpperCase(),
        nombre: values.nombre.trim(),
        permite_decimales: values.permite_decimales,
      },
    })
  }

  // Effect para cargar datos al editar
  React.useEffect(() => {
    if (editOpen && editingUnidad) {
      editForm.reset({
        codigo: editingUnidad.codigo || "",
        nombre: editingUnidad.nombre || "",
        permite_decimales: editingUnidad.permite_decimales ?? false,
      })
    }
  }, [editOpen, editingUnidad, editForm])

  // Definición de columnas
  const columns = React.useMemo<ColumnDef<UnidadMedida>[]>(
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
        accessorKey: "codigo",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Código
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <span className="font-medium font-mono">{row.original.codigo}</span>
        ),
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
        cell: ({ row }) => <span>{row.original.nombre}</span>,
      },
      {
        accessorKey: "permite_decimales",
        header: "Decimales",
        cell: ({ row }) => {
          return row.original.permite_decimales ? (
            <Badge variant="secondary">Sí</Badge>
          ) : (
            <Badge variant="outline">No</Badge>
          )
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id))
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const unidad = row.original

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
                      setEditingUnidad(unidad)
                      setEditOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={deleteMutation.isPending}
                    onSelect={() => {
                      setConfirmUnidad(unidad)
                      setDeleteOpen(true)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    [deleteMutation.isPending]
  )

  const table = useReactTable({
    data: unidades,
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
  if (error && unidades.length === 0 && !isLoading) {
    return (
      <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
        <h1 className="text-2xl font-semibold">Unidades de Medida</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error al cargar unidades: {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Unidades de Medida</h1>
        <div className="flex items-center gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Crear Unidad
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] p-0">
              <div className="p-6 pb-4">
                <DialogHeader>
                  <DialogTitle>Crear unidad de medida</DialogTitle>
                  <DialogDescription>
                    Completa los datos para registrar una nueva unidad de medida.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
                <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-codigo">
                      Código <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="create-codigo"
                      placeholder="Ej: UND, KG, M"
                      {...createForm.register("codigo")}
                      className="uppercase"
                    />
                    {createForm.formState.errors.codigo && (
                      <p className="text-sm text-destructive">
                        {createForm.formState.errors.codigo.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-nombre">
                      Nombre <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="create-nombre"
                      placeholder="Ej: Unidad, Kilogramo, Metro"
                      {...createForm.register("nombre")}
                    />
                    {createForm.formState.errors.nombre && (
                      <p className="text-sm text-destructive">
                        {createForm.formState.errors.nombre.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create-decimales"
                      checked={createForm.watch("permite_decimales")}
                      onCheckedChange={(checked) =>
                        createForm.setValue("permite_decimales", checked === true)
                      }
                    />
                    <Label
                      htmlFor="create-decimales"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Permite decimales
                    </Label>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || createForm.formState.isSubmitting}
                    >
                      {createMutation.isPending ? "Creando..." : "Crear unidad"}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="text-sm text-red-600" aria-live="assertive">
          {error instanceof Error ? error.message : "Error al cargar unidades"}
        </div>
      )}

      {/* Tabla */}
      {isLoading && unidades.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : unidades.length === 0 && !error ? (
        <div className="text-sm text-muted-foreground">No hay unidades de medida registradas.</div>
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
                  placeholder="Buscar por código o nombre..."
                  value={(table.getColumn("codigo")?.getFilterValue() as string) ?? ""}
                  onChange={(event) => table.getColumn("codigo")?.setFilterValue(event.target.value)}
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

      {/* Modal Editar */}
      {editingUnidad && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] p-0">
            <div className="p-6 pb-4">
              <DialogHeader>
                <DialogTitle>Editar unidad de medida</DialogTitle>
                <DialogDescription>
                  Actualiza los datos de la unidad seleccionada.
                </DialogDescription>
              </DialogHeader>
            </div>
            <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
              <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-codigo">
                    Código <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-codigo"
                    placeholder="Ej: UND, KG, M"
                    {...editForm.register("codigo")}
                    className="uppercase"
                  />
                  {editForm.formState.errors.codigo && (
                    <p className="text-sm text-destructive">
                      {editForm.formState.errors.codigo.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-nombre">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-nombre"
                    placeholder="Ej: Unidad, Kilogramo, Metro"
                    {...editForm.register("nombre")}
                  />
                  {editForm.formState.errors.nombre && (
                    <p className="text-sm text-destructive">
                      {editForm.formState.errors.nombre.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-decimales"
                    checked={editForm.watch("permite_decimales")}
                    onCheckedChange={(checked) =>
                      editForm.setValue("permite_decimales", checked === true)
                    }
                  />
                  <Label
                    htmlFor="edit-decimales"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Permite decimales
                  </Label>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending || editForm.formState.isSubmitting}
                  >
                    {updateMutation.isPending ? "Actualizando..." : "Actualizar unidad"}
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Eliminar */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setConfirmUnidad(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar unidad de medida</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUnidad
                ? `¿Eliminar la unidad "${confirmUnidad.codigo} - ${confirmUnidad.nombre}"? Esta acción no se puede deshacer.`
                : "¿Eliminar la unidad seleccionada?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmUnidad?.id) {
                  deleteMutation.mutate({ id: confirmUnidad.id })
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
