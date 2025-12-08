"use client"

import * as React from "react"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Loader2, DollarSign, Calendar, AlertCircle, Clock, CheckCircle2, XCircle, TrendingUp } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { useGetApiCobranzas, useGetApiCobranzasResumen, usePostApiCobranzasIdPagos } from "@/api/generated/cobranzas/cobranzas"
import { useGetApiClientes } from "@/api/generated/clientes/clientes"
import type { CuentaPorCobrar, Pago } from "@/api/generated/model"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

function formatCurrency(value: string | number | null | undefined) {
  const num = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num);
}

const pagoSchema = z.object({
  monto: z.number().positive("El monto debe ser mayor a 0"),
  metodo_pago: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA", "YAPE", "PLIN", "DEPOSITO", "CHEQUE"]),
  referencia: z.string().optional(),
  notas: z.string().optional(),
});

type PagoFormValues = z.infer<typeof pagoSchema>;

export default function CobranzasPage() {
  const queryClient = useQueryClient()

  // Estados de paginación
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Filtros
  const [clienteId, setClienteId] = React.useState<string>("all")
  const [estado, setEstado] = React.useState<string>("all")

  // Estados de tabla
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Modal de pago
  const [pagoModalOpen, setPagoModalOpen] = React.useState(false)
  const [selectedCuenta, setSelectedCuenta] = React.useState<CuentaPorCobrar | null>(null)

  // Fetch data
  const { data, isLoading, error } = useGetApiCobranzas({
    page: currentPage,
    limit: pageSize,
    cliente_id: clienteId !== "all" ? Number(clienteId) : undefined,
    estado: estado !== "all" ? estado as any : undefined,
  })

  const { data: resumenData } = useGetApiCobranzasResumen()
  const { data: clientesData } = useGetApiClientes({ limit: 100 })

  const cobranzas = data?.data || []
  const totalPages = data?.meta?.totalPages || 1
  const clientes = clientesData?.data || []

  // Form para registro de pago
  const form = useForm<PagoFormValues>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      monto: 0,
      metodo_pago: "efectivo",
      referencia: "",
    },
  })

  // Mutation para registrar pago
  const registrarPagoMutation = usePostApiCobranzasIdPagos({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/cobranzas"] })
        queryClient.invalidateQueries({ queryKey: ["/api/cobranzas/resumen"] })
        toast.success("Pago registrado exitosamente")
        setPagoModalOpen(false)
        setSelectedCuenta(null)
        form.reset()
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || err?.message || "Error al registrar pago"
        toast.error(message)
      },
    },
  })

  function handleOpenPagoModal(cuenta: CuentaPorCobrar) {
    setSelectedCuenta(cuenta)
    form.reset({
      monto: Number(cuenta.saldo_pendiente),
      metodo_pago: "EFECTIVO",
      referencia: "",
      notas: "",
    })
    setPagoModalOpen(true)
  }

  async function onSubmitPago(values: PagoFormValues) {
    if (!selectedCuenta) return
    
    await registrarPagoMutation.mutateAsync({
      id: selectedCuenta.id!,
      data: values,
    })
  }

  // Definición de columnas
  const columns = React.useMemo<ColumnDef<CuentaPorCobrar>[]>(
    () => [
      {
        accessorKey: "cliente",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Cliente
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <span className="font-medium">{row.original.cliente?.nombre || "—"}</span>
        ),
      },
      {
        accessorKey: "venta",
        header: "Venta",
        cell: ({ row }) => {
          const tipo = row.original.venta?.serie?.tipo_comprobante || ""
          const serie = row.original.venta?.serie?.codigo || "—"
          const numero = row.original.venta?.numero_comprobante || "—"
          const tipoAbrev = tipo === "FACTURA" ? "F" : tipo === "BOLETA" ? "B" : tipo === "NOTA_VENTA" ? "NV" : ""
          return (
            <span className="text-sm font-mono">
              {tipoAbrev && `${tipoAbrev} `}{serie}-{numero}
            </span>
          )
        },
      },
      {
        accessorKey: "monto_total",
        header: "Monto Total",
        cell: ({ row }) => (
          <span className="font-semibold">
            {formatCurrency(row.original.monto_total)}
          </span>
        ),
      },
      {
        accessorKey: "monto_pagado",
        header: "Pagado",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatCurrency(row.original.monto_pagado)}
          </span>
        ),
      },
      {
        accessorKey: "saldo_pendiente",
        header: "Saldo",
        cell: ({ row }) => {
          const saldo = Number(row.original.saldo_pendiente || 0);
          if (saldo === 0) {
            return (
              <Badge variant="secondary" className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Pagado
              </Badge>
            );
          }
          return (
            <span className="font-semibold text-destructive">
              {formatCurrency(saldo)}
            </span>
          );
        },
      },
      {
        accessorKey: "fecha_vencimiento",
        header: "Vencimiento",
        cell: ({ row }) => {
          const fecha = row.original.fecha_vencimiento;
          if (!fecha) return <span className="text-sm text-muted-foreground">—</span>;
          
          const vencimiento = new Date(fecha);
          const hoy = new Date();
          const esVencida = vencimiento < hoy;
          const fechaTexto = format(vencimiento, "dd MMM yyyy", { locale: es });
          
          if (esVencida) {
            return (
              <Badge variant="destructive" className="gap-1.5">
                <AlertCircle className="h-3 w-3" />
                {fechaTexto}
              </Badge>
            );
          }
          
          return (
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{fechaTexto}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
          const estado = row.original.estado;
          
          if (estado === "PAGADA") {
            return (
              <Badge variant="secondary" className="gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                Pagada
              </Badge>
            );
          }
          
          if (estado === "VENCIDA") {
            return (
              <Badge variant="destructive" className="gap-1.5">
                <XCircle className="h-3 w-3" />
                Vencida
              </Badge>
            );
          }
          
          if (estado === "POR_VENCER") {
            return (
              <Badge className="gap-1.5">
                <Clock className="h-3 w-3" />
                Por Vencer
              </Badge>
            );
          }
          
          if (estado === "VIGENTE") {
            return (
              <Badge variant="outline" className="gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                Vigente
              </Badge>
            );
          }
          
          return (
            <Badge variant="secondary" className="gap-1.5">
              <XCircle className="h-3 w-3" />
              Cancelada
            </Badge>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const cuenta = row.original
          const saldo = Number(cuenta.saldo_pendiente)
          const puedePagar = saldo > 0 && cuenta.estado !== "PAGADA" && cuenta.estado !== "CANCELADA"

          return (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenPagoModal(cuenta)}
                disabled={!puedePagar || registrarPagoMutation.isPending}
              >
                <DollarSign className="mr-1 h-3 w-3" />
                Pagar
              </Button>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    [registrarPagoMutation.isPending]
  )

  const table = useReactTable({
    data: cobranzas,
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

  if (error && cobranzas.length === 0 && !isLoading) {
    return (
      <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
        <h1 className="text-2xl font-semibold">Cuentas por Cobrar</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error al cargar datos: {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cuentas por Cobrar</h1>
      </div>

      {/* Resumen */}
      {resumenData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold">{resumenData.total_vigentes}</div>
              <p className="text-xs text-muted-foreground">Cuentas Vigentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-orange-600">{resumenData.total_por_vencer}</div>
              <p className="text-xs text-muted-foreground">Por Vencer (7 días)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-destructive">{resumenData.total_vencidas}</div>
              <p className="text-xs text-muted-foreground">Vencidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold">{formatCurrency(resumenData.monto_total)}</div>
              <p className="text-xs text-muted-foreground">Monto Total</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Select value={clienteId} onValueChange={(value) => { setClienteId(value); setCurrentPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={estado} onValueChange={(value) => { setEstado(value); setCurrentPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="VIGENTE">Vigente</SelectItem>
            <SelectItem value="POR_VENCER">Por Vencer</SelectItem>
            <SelectItem value="VENCIDA">Vencida</SelectItem>
            <SelectItem value="PAGADA">Pagada</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columnas <ChevronDown className="ml-2 h-4 w-4" />
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

      {/* Tabla */}
      {isLoading && cobranzas.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : cobranzas.length === 0 && !error ? (
        <div className="text-sm text-muted-foreground">No hay cuentas por cobrar.</div>
      ) : (
        <div className="relative">
          {isLoading && (
            <div className="absolute top-2 right-2 z-10">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}

          <div className={isLoading ? "pointer-events-none opacity-80 transition-opacity" : "transition-opacity"}>
            <div className="w-full">
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
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center space-x-2">
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
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Pago */}
      <Dialog open={pagoModalOpen} onOpenChange={setPagoModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              {selectedCuenta && (
                <>Cliente: {selectedCuenta.cliente?.nombre}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedCuenta && (
            <div className="space-y-4">
              {/* Info de la cuenta */}
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monto Total:</span>
                  <span className="font-semibold">{formatCurrency(selectedCuenta.monto_total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pagado:</span>
                  <span>{formatCurrency(selectedCuenta.monto_pagado)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo Pendiente:</span>
                  <span className="font-bold text-lg text-destructive">{formatCurrency(selectedCuenta.saldo_pendiente)}</span>
                </div>
              </div>

              {/* Formulario de pago */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitPago)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="monto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto a Pagar (S/)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={Number(selectedCuenta.saldo_pendiente)}
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metodo_pago"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pago</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona método" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                            <SelectItem value="TARJETA">Tarjeta</SelectItem>
                            <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                            <SelectItem value="YAPE">Yape</SelectItem>
                            <SelectItem value="PLIN">Plin</SelectItem>
                            <SelectItem value="DEPOSITO">Depósito</SelectItem>
                            <SelectItem value="CHEQUE">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nro. Operación / Referencia</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 123456789" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Importante para Yape, transferencias, depósitos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observaciones (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Pago acordado con cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPagoModalOpen(false)}
                      disabled={registrarPagoMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={registrarPagoMutation.isPending}>
                      {registrarPagoMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Registrar Pago
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
