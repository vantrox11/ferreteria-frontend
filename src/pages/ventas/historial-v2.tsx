/**
 * 🧾 HISTORIAL DE VENTAS - Vista con TanStack Table + Sheet
 * Registro Completo de Transacciones Comerciales
 */

"use client"

import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  Eye,
  Receipt,
  MoreHorizontal,
  BadgeCheckIcon,
  Calendar,
  DollarSign,
  User,
  FileText,
  Printer,
  FileX,
  Truck,
  Ban,
  Package,
  CreditCard,
  Building2,
  MapPin,
  Link as LinkIcon,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { useGetApiVentas, useGetApiVentasIdSaldoNc } from "@/api/generated/ventas-pos/ventas-pos"
import { useGetApiNotasCredito } from "@/api/generated/notas-credito/notas-credito"
import { useGetApiTenantConfiguracion } from "@/api/generated/tenant/tenant"
import type { Venta } from "@/api/generated/model"

import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ModalNotaCredito } from "@/components/ventas/ModalNotaCredito"
import { ModalGuiaRemision } from "@/components/ventas/ModalGuiaRemision"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mapeo de métodos de pago
const METODO_PAGO_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  YAPE: "Yape",
  PLIN: "Plin",
  TRANSFERENCIA: "Transferencia",
}

const METODO_PAGO_ICONS: Record<string, any> = {
  EFECTIVO: DollarSign,
  TARJETA: CreditCard,
  YAPE: CreditCard,
  PLIN: CreditCard,
  TRANSFERENCIA: Building2,
}

// Badge de estado SUNAT
function getEstadoBadge(estado: string) {
  if (estado === "ACEPTADO") {
    return (
      <Badge variant="secondary" className="bg-blue-500 text-white dark:bg-blue-600">
        <BadgeCheckIcon className="h-3 w-3" />
        Aceptado
      </Badge>
    )
  }
  if (estado === "RECHAZADO") {
    return <Badge variant="destructive">Rechazado</Badge>
  }
  return <Badge variant="secondary">Pendiente</Badge>
}

// Badge de tipo de venta (Contado vs Crédito)
function getTipoVentaBadge(venta: Venta) {
  // ✅ Usar condicion_pago (CONTADO/CREDITO), NO metodo_pago (EFECTIVO/TARJETA)
  const esCredito = venta.condicion_pago?.toUpperCase() === "CREDITO" || !!(venta as any).cuenta_por_cobrar
  
  if (esCredito) {
    const estadoPago = venta.estado_pago || "PAGADO"
    
    if (estadoPago === "PAGADO") {
      return (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="gap-1">
            <CreditCard className="h-3 w-3" />
            Crédito
          </Badge>
          <Badge variant="secondary" className="bg-blue-500 text-white dark:bg-blue-600">
            <CheckCircle2 className="h-3 w-3" />
            Pagado
          </Badge>
        </div>
      )
    }
    if (estadoPago === "PENDIENTE") {
      return (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="gap-1">
            <CreditCard className="h-3 w-3" />
            Crédito
          </Badge>
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3" />
            Pendiente
          </Badge>
        </div>
      )
    }
    if (estadoPago === "PARCIAL") {
      return (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="gap-1">
            <CreditCard className="h-3 w-3" />
            Crédito
          </Badge>
          <Badge variant="default" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Parcial
          </Badge>
        </div>
      )
    }
  }
  
  // Venta al contado
  return (
    <Badge variant="secondary" className="gap-1">
      <DollarSign className="h-3 w-3" />
      Contado
    </Badge>
  )
}

export default function HistorialVentasV2() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [selectedVenta, setSelectedVenta] = React.useState<Venta | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [modalNCOpen, setModalNCOpen] = React.useState(false)
  const [modalGREOpen, setModalGREOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [fecha, setFecha] = React.useState("")

  // Obtener configuración del tenant
  const { data: configTenant } = useGetApiTenantConfiguracion()

  const { data, isLoading, refetch } = useGetApiVentas(
    { 
      page: 1, 
      limit: 100,
      q: search || undefined,
      fecha_inicio: fecha || undefined,
      fecha_fin: fecha || undefined,
    },
    {
      query: {
        refetchOnMount: "always",
        staleTime: 0,
      },
    }
  )

  const ventas = data?.data || []

  // Hook para consultar saldo disponible de NC
  const { data: saldoNCResponse } = useGetApiVentasIdSaldoNc(
    selectedVenta?.id?.toString() || "0",
    {
      query: {
        enabled: !!selectedVenta?.id,
        staleTime: 0,
      },
    }
  )
  const saldoNC = saldoNCResponse?.data

  // Hook para consultar NC bloqueantes (Anulación 01 o Devolución Total 07)
  const { data: notasCreditoResponse } = useGetApiNotasCredito(
    {
      venta_referencia_id: selectedVenta?.id,
      tipo_nota: undefined, // Traemos todas y filtramos en cliente
      estado_sunat: undefined,
      page: 1,
      limit: 100,
    },
    {
      query: {
        enabled: !!selectedVenta?.id,
        staleTime: 0,
      },
    }
  )

  // Verificar si hay NC bloqueantes para Guías de Remisión
  const tieneNCBloqueante = React.useMemo(() => {
    if (!notasCreditoResponse?.data) return false
    
    const ncBloqueantes = notasCreditoResponse.data.filter((nc: any) => 
      (nc.tipo_nota === 'ANULACION_DE_LA_OPERACION' || nc.tipo_nota === 'DEVOLUCION_TOTAL') &&
      (nc.estado_sunat === 'ACEPTADO' || nc.estado_sunat === 'PENDIENTE')
    )
    
    return ncBloqueantes.length > 0
  }, [notasCreditoResponse])

  // Obtener la primera NC bloqueante para mostrar en el mensaje
  const ncBloqueante = React.useMemo(() => {
    if (!notasCreditoResponse?.data) return null
    
    return notasCreditoResponse.data.find((nc: any) => 
      (nc.tipo_nota === 'ANULACION_DE_LA_OPERACION' || nc.tipo_nota === 'DEVOLUCION_TOTAL') &&
      (nc.estado_sunat === 'ACEPTADO' || nc.estado_sunat === 'PENDIENTE')
    )
  }, [notasCreditoResponse])

  // Definición de columnas
  const columns: ColumnDef<Venta>[] = [
    {
      accessorKey: "comprobante",
      header: "Comprobante",
      cell: ({ row }) => {
        const venta = row.original
        const serie = venta.serie?.codigo || "N/A"
        const numero = String(venta.numero_comprobante || venta.id).padStart(8, "0")
        const fecha = format(new Date(venta.created_at), "dd/MM/yyyy", { locale: es })
        const hora = format(new Date(venta.created_at), "HH:mm", { locale: es })
        
        return (
          <div>
            <div className="font-mono font-semibold">{`${serie}-${numero}`}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3" />
              {fecha} {hora}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "tipo_comprobante",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.original.serie?.tipo_comprobante || "BOLETA"
        const Icon = tipo === "FACTURA" ? FileText : Receipt
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{tipo}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "cliente",
      header: "Cliente",
      cell: ({ row }) => {
        const cliente = row.original.cliente
        const nombre = cliente?.nombre || cliente?.razon_social || "Público General"
        const doc = cliente?.documento_identidad || (cliente as any)?.ruc
        return (
          <div>
            <div className="font-medium">{nombre}</div>
            {doc && (
              <div className="text-xs text-muted-foreground">
                {(cliente as any)?.ruc ? "RUC" : "DNI"}: {doc}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "metodo_pago",
      header: "Método Pago",
      cell: ({ row }) => {
        const metodo = row.original.metodo_pago?.toUpperCase() || "EFECTIVO"
        const Icon = METODO_PAGO_ICONS[metodo] || DollarSign
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{METODO_PAGO_LABELS[metodo] || metodo}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "total",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Total
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const total = Number(row.original.total)
        return (
          <div className="text-right font-mono font-semibold">
            S/ {total.toFixed(2)}
          </div>
        )
      },
    },
    {
      accessorKey: "estado_sunat",
      header: "SUNAT",
      cell: ({ row }) => getEstadoBadge(row.original.estado_sunat || "PENDIENTE"),
    },
    {
      accessorKey: "tipo_venta",
      header: "Tipo Venta",
      cell: ({ row }) => getTipoVentaBadge(row.original),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const venta = row.original
        
        // Verificar si ESTA venta tiene NC bloqueantes
        const tieneNCBloqueantePorVenta = notasCreditoResponse?.data?.some((nc: any) => 
          nc.venta_id === venta.id &&
          (nc.tipo_nota === 'ANULACION_DE_LA_OPERACION' || nc.tipo_nota === 'DEVOLUCION_TOTAL') &&
          (nc.estado_sunat === 'ACEPTADO' || nc.estado_sunat === 'PENDIENTE')
        ) ?? false
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedVenta(venta)
                  setSheetOpen(true)
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedVenta(venta)
                  setModalGREOpen(true)
                }}
                disabled={venta.estado_sunat !== "ACEPTADO" || tieneNCBloqueantePorVenta}
              >
                <Truck className="mr-2 h-4 w-4" />
                Emitir GRE
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedVenta(venta)
                  setModalNCOpen(true)
                }}
                disabled={venta.estado_sunat !== "ACEPTADO"}
              >
                <FileX className="mr-2 h-4 w-4" />
                Emitir NC
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: ventas,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Receipt className="h-8 w-8" />
          Historial de Ventas
        </h1>
        <p className="text-muted-foreground mt-1">
          Registro completo de transacciones comerciales
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-[180px]"
          placeholder="Filtrar por fecha"
        />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, vendedor..."
          className="flex-1 max-w-[400px]"
        />
        <Button variant="outline" onClick={() => refetch()}>
          Actualizar
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  No se encontraron ventas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>

      {/* Sheet de Detalle */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-[640px]">
          {selectedVenta && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  {selectedVenta.serie?.tipo_comprobante || "COMPROBANTE"}{" "}
                  {selectedVenta.serie?.codigo}-
                  {String(selectedVenta.numero_comprobante || selectedVenta.id).padStart(8, "0")}
                </SheetTitle>
                <SheetDescription>
                  Detalle completo de la transacción comercial
                </SheetDescription>
              </SheetHeader>

              <SheetBody className="space-y-6">
                {/* KPI Principal */}
                <div className="rounded-lg border bg-muted/30 p-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Total de la Venta</div>
                  <div className="text-4xl font-bold tabular-nums">
                    S/ {Number(selectedVenta.total).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(selectedVenta.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </div>
                </div>

                {/* Información de la Empresa */}
                {configTenant && (
                  <div className="rounded-lg border p-4 text-center space-y-2">
                    <div className="font-bold text-lg">
                      {configTenant.nombre_empresa || "Ferretería"}
                    </div>
                    {(configTenant.configuracion as any)?.empresa?.ruc && (
                      <div className="text-sm text-muted-foreground">
                        RUC: {(configTenant.configuracion as any).empresa.ruc}
                      </div>
                    )}
                    {(configTenant.configuracion as any)?.empresa?.direccion && (
                      <div className="text-xs text-muted-foreground">
                        {(configTenant.configuracion as any).empresa.direccion}
                      </div>
                    )}
                  </div>
                )}

                {/* Cliente */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Datos del Cliente
                  </h3>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nombre</span>
                      <span className="font-medium text-right max-w-[300px]">
                        {selectedVenta.cliente?.nombre || selectedVenta.cliente?.razon_social || "Público General"}
                      </span>
                    </div>
                    {selectedVenta.cliente?.documento_identidad && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">DNI</span>
                        <span className="font-mono">{selectedVenta.cliente.documento_identidad}</span>
                      </div>
                    )}
                    {(selectedVenta.cliente as any)?.ruc && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">RUC</span>
                        <span className="font-mono">{(selectedVenta.cliente as any).ruc}</span>
                      </div>
                    )}
                    {(selectedVenta.cliente as any)?.razon_social && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Razón Social</span>
                        <span className="text-sm text-right max-w-[300px]">
                          {(selectedVenta.cliente as any).razon_social}
                        </span>
                      </div>
                    )}
                    {selectedVenta.cliente?.direccion && (
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Dirección
                        </span>
                        <span className="text-sm text-right max-w-[300px]">
                          {selectedVenta.cliente.direccion}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Información de la Transacción */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Información de la Transacción</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo Comprobante</span>
                      <span className="font-medium">{selectedVenta.serie?.tipo_comprobante || "BOLETA"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Método Pago</span>
                      <span className="font-medium">
                        {METODO_PAGO_LABELS[selectedVenta.metodo_pago?.toUpperCase() || "EFECTIVO"] || selectedVenta.metodo_pago}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Estado SUNAT</span>
                      {getEstadoBadge(selectedVenta.estado_sunat || "PENDIENTE")}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tipo de Venta</span>
                      {getTipoVentaBadge(selectedVenta)}
                    </div>
                    {selectedVenta.usuario && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vendedor</span>
                        <span className="font-medium">{selectedVenta.usuario.nombre || selectedVenta.usuario.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Productos */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Productos Vendidos
                  </h3>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Cant.</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right">P. Unit</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(selectedVenta.detalles || []).map((detalle: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono">{detalle.cantidad}</TableCell>
                            <TableCell>
                              <div className="text-sm">{detalle.producto?.nombre || `Producto #${detalle.producto_id}`}</div>
                              {detalle.producto?.sku && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  SKU: {detalle.producto.sku}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              S/ {Number(detalle.precio_unitario).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              S/ {(Number(detalle.precio_unitario) * Number(detalle.cantidad)).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Resumen Tributario */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Resumen Tributario</h3>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Op. Gravada</span>
                      <span className="font-mono">
                        S/{" "}
                        {Number(
                          (selectedVenta.detalles || []).reduce(
                            (s: number, d: any) => s + Number(d.valor_unitario || 0) * Number(d.cantidad || 0),
                            0
                          )
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IGV (18%)</span>
                      <span className="font-mono">
                        S/{" "}
                        {Number(
                          (selectedVenta.detalles || []).reduce(
                            (s: number, d: any) => s + Number(d.igv_total || 0),
                            0
                          )
                        ).toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between pt-1">
                      <span className="font-bold">TOTAL</span>
                      <span className="font-bold text-xl tabular-nums">
                        S/ {Number(selectedVenta.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información Saldo NC */}
                {saldoNC && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileX className="h-4 w-4" />
                        Control de Notas de Crédito
                      </h3>
                      {saldoNC.puede_emitir_nc ? (
                        <Alert className="border-green-600 bg-green-50 dark:bg-green-950">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800 dark:text-green-200">
                            <p className="font-semibold">Puede emitir NC</p>
                            <p className="text-sm mt-1">
                              Saldo disponible: <span className="font-mono font-bold">S/ {saldoNC.saldo_disponible.toFixed(2)}</span>
                            </p>
                            <p className="text-xs mt-1 opacity-75">
                              Total venta: S/ {saldoNC.total_venta.toFixed(2)} | Ya devuelto: S/ {saldoNC.total_devuelto.toFixed(2)}
                            </p>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            <p className="font-semibold">{saldoNC.razon_bloqueo}</p>
                            <p className="text-xs mt-1 opacity-75">
                              No se pueden emitir más Notas de Crédito para esta venta
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </>
                )}

                {/* Información SUNAT (si existe) */}
                {(selectedVenta.hash_cpe || selectedVenta.xml_url || selectedVenta.cdr_url) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        Validación SUNAT
                      </h3>
                      <div className="rounded-lg border p-4 space-y-2 text-sm">
                        {selectedVenta.hash_cpe && (
                          <div className="flex justify-between items-start">
                            <span className="text-muted-foreground">Hash CPE</span>
                            <span className="font-mono text-xs break-all max-w-[300px] text-right">
                              {selectedVenta.hash_cpe}
                            </span>
                          </div>
                        )}
                        {selectedVenta.xml_url && (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-3 w-3 text-muted-foreground" />
                            <a
                              href={selectedVenta.xml_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Descargar XML
                            </a>
                          </div>
                        )}
                        {selectedVenta.cdr_url && (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-3 w-3 text-muted-foreground" />
                            <a
                              href={selectedVenta.cdr_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Descargar CDR
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Auditoría */}
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>ID Transacción:</span>
                    <span className="font-mono">#{selectedVenta.id}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Creado:</span>
                    <span>{format(new Date(selectedVenta.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}</span>
                  </div>
                </div>
              </SheetBody>

              {/* Alerta de NC Bloqueante */}
              {tieneNCBloqueante && ncBloqueante && (
                <div className="px-6 pb-4">
                  <Alert variant="destructive">
                    <Ban className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold">🚫 Venta bloqueada para Guías de Remisión</p>
                      <p className="text-xs mt-1">
                        Existe una Nota de Crédito de tipo <strong>
                          {(ncBloqueante as any).tipo_nota === 'ANULACION_DE_LA_OPERACION' 
                            ? 'ANULACIÓN DE LA OPERACIÓN' 
                            : 'DEVOLUCIÓN TOTAL'}
                        </strong> con estado <strong>{(ncBloqueante as any).estado_sunat}</strong>.
                        Las ventas anuladas o totalmente devueltas no pueden generar guías de remisión.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <SheetFooter>
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSheetOpen(false)
                        setModalGREOpen(true)
                      }}
                      disabled={selectedVenta.estado_sunat !== "ACEPTADO" || tieneNCBloqueante}
                      title={
                        tieneNCBloqueante 
                          ? '🚫 Venta bloqueada por NC de Anulación o Devolución Total' 
                          : selectedVenta.estado_sunat !== "ACEPTADO"
                          ? `Venta debe estar ACEPTADA en SUNAT (actual: ${selectedVenta.estado_sunat})`
                          : undefined
                      }
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      Emitir GRE
                    </Button>
                  </div>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      setSheetOpen(false)
                      setModalNCOpen(true)
                    }}
                    disabled={
                      selectedVenta.estado_sunat !== "ACEPTADO" || 
                      (saldoNC !== undefined && saldoNC.puede_emitir_nc === false)
                    }
                    title={
                      selectedVenta.estado_sunat !== "ACEPTADO"
                        ? `Venta debe estar ACEPTADA en SUNAT (actual: ${selectedVenta.estado_sunat})`
                        : saldoNC?.puede_emitir_nc === false
                        ? `No se pueden emitir más NC. Razón: ${saldoNC.razon_bloqueo || 'Saldo agotado'}`
                        : undefined
                    }
                  >
                    <FileX className="mr-2 h-4 w-4" />
                    Emitir Nota de Crédito
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Modals */}
      <ModalNotaCredito
        open={modalNCOpen}
        onOpenChange={setModalNCOpen}
        venta={selectedVenta}
        onSuccess={() => {
          setModalNCOpen(false)
          refetch()
        }}
      />

      <ModalGuiaRemision
        open={modalGREOpen}
        onOpenChange={setModalGREOpen}
        venta={selectedVenta}
        onSuccess={() => {
          setModalGREOpen(false)
          refetch()
        }}
      />
    </div>
  )
}
