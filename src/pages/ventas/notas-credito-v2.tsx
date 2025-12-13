/**
 * 📄 NOTAS DE CRÉDITO - Vista con TanStack Table + Sheet
 * Documento Financiero Relacional
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
  CornerUpLeft,
  Eye,
  FileText,
  MoreHorizontal,
  BadgeCheckIcon,
  Calendar,
  User,
  Package,
  CheckCircle2,
  XCircle,
  FileCheck,
  Link as LinkIcon
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { useGetApiNotasCredito } from "@/api/generated/notas-credito/notas-credito"
import type { NotaCredito, NotaCreditoDetalle } from "@/api/generated/model"

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

// Mapeo de tipos
const TIPO_LABELS: Record<string, string> = {
  ANULACION_DE_LA_OPERACION: "Anulación de la Operación",
  DEVOLUCION_TOTAL: "Devolución Total",
  DEVOLUCION_PARCIAL: "Devolución Parcial",
  DESCUENTO: "Descuento",
  BONIFICACION: "Bonificación",
}

// Badge de estado
function getEstadoBadge(estado: string | null | undefined) {
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

export default function NotasCreditoPage() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [selectedNC, setSelectedNC] = React.useState<NotaCredito | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const { data, isLoading } = useGetApiNotasCredito(
    { page: 1, limit: 100 },
    {
      query: {
        refetchOnMount: "always",
        staleTime: 0,
      },
    }
  )

  const notasCredito = data?.data || []

  // Definición de columnas
  const columns: ColumnDef<NotaCredito>[] = [
    {
      accessorKey: "comprobante",
      header: "Comprobante",
      cell: ({ row }) => {
        const nc = row.original
        const serie = nc.serie?.codigo || "N/A"
        const numero = String(nc.numero).padStart(6, "0")
        const fecha = format(new Date(nc.fecha_emision), "dd/MM/yyyy", { locale: es })
        return (
          <div>
            <div className="font-mono font-semibold">{`${serie}-${numero}`}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3" />
              {fecha}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "referencia",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="gap-1"
          >
            <CornerUpLeft className="h-4 w-4 text-muted-foreground" />
            Referencia
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const venta = row.original.venta_referencia
        if (!venta) return <span className="text-muted-foreground">Sin referencia</span>
        const serieVenta = venta.serie?.codigo || "N/A"
        const numeroVenta = String(venta.numero_comprobante).padStart(6, "0")
        return (
          <div className="flex items-center gap-2">
            <CornerUpLeft className="h-4 w-4 text-blue-500" />
            <span className="font-mono text-sm">{`${serieVenta}-${numeroVenta}`}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "cliente",
      header: "Cliente",
      cell: ({ row }) => {
        const cliente = row.original.venta_referencia?.cliente
        return cliente?.nombre || cliente?.razon_social || <span className="text-muted-foreground">N/A</span>
      },
    },
    {
      accessorKey: "motivo",
      header: "Motivo",
      cell: ({ row }) => {
        const tipo = row.original.tipo_nota
        return (
          <div className="max-w-[200px] truncate text-sm">{TIPO_LABELS[tipo] || tipo}</div>
        )
      },
    },
    {
      accessorKey: "monto_total",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Monto
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const monto = Number(row.original.monto_total)
        return (
          <div className="text-right font-mono font-semibold">
            S/ {monto.toFixed(2)}
          </div>
        )
      },
    },
    {
      accessorKey: "estado_sunat",
      header: "Estado",
      cell: ({ row }) => getEstadoBadge(row.original.estado_sunat),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const nc = row.original
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
                  setSelectedNC(nc)
                  setSheetOpen(true)
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: notasCredito,
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
          <FileText className="h-8 w-8" />
          Notas de Crédito
        </h1>
        <p className="text-muted-foreground mt-1">
          Documentos financieros de ajuste
        </p>
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
                  No se encontraron notas de crédito
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
        <SheetContent className="sm:max-w-[540px]">
          {selectedNC && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Nota de Crédito {selectedNC.serie?.codigo}-{String(selectedNC.numero).padStart(6, "0")}
                </SheetTitle>
                <SheetDescription>
                  Detalle del documento financiero
                </SheetDescription>
              </SheetHeader>

              <SheetBody className="space-y-6">
                {/* KPI Principal */}
                <div className="rounded-lg border bg-muted/30 p-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Monto Total</div>
                  <div className="text-4xl font-bold tabular-nums">
                    S/ {Number(selectedNC.monto_total).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Documento de Ajuste Fiscal
                  </div>
                </div>

                {/* Contexto - Venta Original */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CornerUpLeft className="h-4 w-4" />
                    Venta Original
                  </h3>
                  <div className="rounded-lg border p-4 space-y-2">
                    {selectedNC.venta_referencia ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Comprobante</span>
                          <span className="font-mono">
                            {selectedNC.venta_referencia.serie?.codigo}-{String(selectedNC.venta_referencia.numero_comprobante).padStart(6, "0")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Fecha Venta</span>
                          <span className="text-sm">{format(new Date(selectedNC.venta_referencia.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Monto Original</span>
                          <span className="font-mono font-semibold">
                            S/ {Number(selectedNC.venta_referencia.total).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Cliente</span>
                          <span className="text-sm text-right max-w-[200px] truncate">
                            {selectedNC.venta_referencia.cliente?.nombre || selectedNC.venta_referencia.cliente?.razon_social || "N/A"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin referencia</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Información del Documento NC */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Información del Documento</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo</span>
                      <span className="text-sm">{TIPO_LABELS[selectedNC.tipo_nota] || selectedNC.tipo_nota}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Motivo Legal</span>
                      <span className="text-sm text-right max-w-[280px]">
                        {selectedNC.motivo_sustento || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha Emisión</span>
                      <span className="text-sm">{format(new Date(selectedNC.fecha_emision), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Estado SUNAT</span>
                      {getEstadoBadge(selectedNC.estado_sunat)}
                    </div>
                    {selectedNC.usuario && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Emisor
                        </span>
                        <span className="text-sm">{selectedNC.usuario.nombre}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Control de Stock */}
                {(selectedNC.tipo_nota === "DEVOLUCION_TOTAL" || selectedNC.tipo_nota === "DEVOLUCION_PARCIAL") && (
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Control de Inventario</span>
                      </div>
                      {selectedNC.stock_retornado ? (
                        <Badge variant="secondary" className="bg-blue-500 text-white dark:bg-blue-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Stock Retornado
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="h-3 w-3 mr-1" />
                          Sin Retorno
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Tabla de Items/Detalles */}
                {selectedNC.detalles && selectedNC.detalles.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Productos Devueltos</h3>
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
                          {selectedNC.detalles.map((detalle: NotaCreditoDetalle, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono">{detalle.cantidad}</TableCell>
                              <TableCell>
                                <div className="text-sm">{detalle.producto?.nombre || 'Producto sin nombre'}</div>
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
                                S/ {(Number(detalle.cantidad) * Number(detalle.valor_unitario)).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Información SUNAT (si existe) */}
                {(selectedNC.hash_cpe || selectedNC.xml_url || selectedNC.cdr_url) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        Validación SUNAT
                      </h3>
                      <div className="rounded-lg border p-4 space-y-2 text-sm">
                        {selectedNC.hash_cpe && (
                          <div className="flex justify-between items-start">
                            <span className="text-muted-foreground">Hash CPE</span>
                            <span className="font-mono text-xs break-all max-w-[240px] text-right">
                              {selectedNC.hash_cpe}
                            </span>
                          </div>
                        )}
                        {selectedNC.xml_url && (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-3 w-3 text-muted-foreground" />
                            <a
                              href={selectedNC.xml_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Descargar XML
                            </a>
                          </div>
                        )}
                        {selectedNC.cdr_url && (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-3 w-3 text-muted-foreground" />
                            <a
                              href={selectedNC.cdr_url}
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
                    <span>Creado:</span>
                    <span>{format(new Date(selectedNC.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}</span>
                  </div>
                </div>
              </SheetBody>

              <SheetFooter>
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <FileText className="mr-2 h-4 w-4" />
                      Ver PDF
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Enviar Email
                    </Button>
                  </div>
                  {selectedNC.estado_sunat === "RECHAZADO" && (
                    <Button variant="default" className="w-full">
                      Reenviar a SUNAT
                    </Button>
                  )}
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
