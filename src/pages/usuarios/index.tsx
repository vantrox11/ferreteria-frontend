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

import { useAuth } from "@/auth/AuthContext"
import { useGetApiUsuarios, usePatchApiUsuariosIdDesactivar } from "@/api/generated/usuarios/usuarios"
import type { Usuario } from "@/api/generated/model"

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
import { Badge } from "@/components/ui/badge"
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

import CreateUserDialog from "@/components/CreateUserDialog"
import EditUserDialog from "@/components/EditUserDialog"

const rolLabels: Record<string, string> = {
  admin: "Administrador",
  empleado: "Empleado",
}

const rolColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  admin: "destructive",
  empleado: "secondary",
}

export default function UsuariosPageV2() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Estados de tabla (client-side)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Control de modales
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingUsuario, setEditingUsuario] = React.useState<Usuario | null>(null)
  const [deactivateOpen, setDeactivateOpen] = React.useState(false)
  const [confirmUsuario, setConfirmUsuario] = React.useState<Usuario | null>(null)

  // Fetch data (sin paginación server-side)
  const { data, isLoading, error } = useGetApiUsuarios()
  const usuarios = React.useMemo(() => {
    const items = data?.data || []
    return items.sort((a, b) => a.email.localeCompare(b.email, "es"))
  }, [data?.data])

  // Mutation para desactivar
  const desactivarMutation = usePatchApiUsuariosIdDesactivar({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] })
        toast.success("Usuario desactivado")
        setDeactivateOpen(false)
        setConfirmUsuario(null)
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || err?.message || "No se pudo desactivar"
        toast.error(message)
      },
    },
  })

  // Definición de columnas
  const columns = React.useMemo<ColumnDef<Usuario>[]>(
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
        accessorKey: "email",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Email
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.email}</span>
            {row.original.id === user?.id && (
              <Badge variant="outline" className="text-xs">
                Tú
              </Badge>
            )}
          </div>
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
        cell: ({ row }) => {
          const u = row.original
          const initials = (u.nombre || u.email || "?")
            .trim()
            .slice(0, 2)
            .toUpperCase()
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-8 ring-1 ring-border">
                <AvatarFallback className="font-medium">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{u.nombre || "—"}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "rol",
        header: "Rol",
        cell: ({ row }) => {
          const rol = row.original.rol
          return (
            <Badge variant={rolColors[rol] || "default"}>
              {rolLabels[rol] || rol}
            </Badge>
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
          const usuario = row.original
          const isCurrentUser = usuario.id === user?.id

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
                      setEditingUsuario(usuario)
                      setEditOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={isCurrentUser || desactivarMutation.isPending}
                    onSelect={() => {
                      if (!isCurrentUser) {
                        setConfirmUsuario(usuario)
                        setDeactivateOpen(true)
                      }
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
    [desactivarMutation.isPending, user?.id]
  )

  const table = useReactTable({
    data: usuarios,
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
  if (error && usuarios.length === 0 && !isLoading) {
    return (
      <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error al cargar usuarios: {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <div className="flex items-center gap-2">
          <CreateUserDialog
            onCreated={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] })
            }}
          />
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="text-sm text-red-600" aria-live="assertive">
          {error instanceof Error ? error.message : "Error al cargar usuarios"}
        </div>
      )}

      {/* Tabla */}
      {isLoading && usuarios.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : usuarios.length === 0 && !error ? (
        <div className="text-sm text-muted-foreground">No hay usuarios registrados.</div>
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
                  placeholder="Buscar por email..."
                  value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                  onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)}
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
      {editingUsuario && (
        <EditUserDialog
          usuario={editingUsuario}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open)
            if (!open) setEditingUsuario(null)
          }}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] })}
        />
      )}
      <AlertDialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          setDeactivateOpen(open)
          if (!open) setConfirmUsuario(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUsuario
                ? `¿Desactivar al usuario "${confirmUsuario.email}"? El usuario ya no podrá acceder al sistema.`
                : "¿Desactivar al usuario seleccionado?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmUsuario) {
                  desactivarMutation.mutate({ id: confirmUsuario.id })
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
