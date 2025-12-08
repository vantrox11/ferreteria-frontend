/**
 * 🚚 GUÍAS DE REMISIÓN - Vista con TanStack Table + Sheet
 * Documento Logístico de Traslado
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
  Truck,
  MoreHorizontal,
  BadgeCheckIcon,
  Calendar,
  MapPin,
  User,
  Weight,
  Package,
  FileCheck,
  Link as LinkIcon,
  FileText,
  Copy,
  Building2,
  ArrowRight,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { useGetApiGuiasRemision } from "@/api/generated/guias-remision/guias-remision"

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

// Badge de estado
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

export default function GuiasRemisionPage() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [selectedGRE, setSelectedGRE] = React.useState<any | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const { data, isLoading } = useGetApiGuiasRemision(
    { page: 1, limit: 100 },
    {
      query: {
        refetchOnMount: "always",
        staleTime: 0,
      },
    }
  )

  const guias = data?.data || []

  // Definición de columnas
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "guia",
      header: "Guía",
      cell: ({ row }) => {
        const gre = row.original
        const serie = gre.serie?.codigo || "N/A"
        const numero = String(gre.numero).padStart(6, "0")
        const fecha = format(
          new Date(gre.fecha_inicio_traslado),
          "dd/MM/yyyy",
          { locale: es }
        )
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
      accessorKey: "destinatario",
      header: "Destinatario",
      cell: ({ row }) => {
        const gre = row.original
        return (
          <div>
            <div className="font-medium">{gre.destinatario_razon_social || "N/A"}</div>
            <div className="text-xs text-muted-foreground">{gre.destinatario_ruc || ""}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "ruta",
      header: "Ruta",
      cell: ({ row }) => {
        const gre = row.original
        return (
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">Origen:</span>
              <span className="text-muted-foreground truncate max-w-[150px]">
                {gre.punto_partida_ubigeo || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-blue-500" />
              <span className="font-medium">Destino:</span>
              <span className="text-muted-foreground truncate max-w-[150px]">
                {gre.punto_llegada_ubigeo || "N/A"}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "transporte",
      header: "Unidad de Transporte",
      cell: ({ row }) => {
        const gre = row.original
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="truncate max-w-[120px]">{gre.conductor_nombre || "N/A"}</span>
            </div>
            <div className="font-mono text-xs text-muted-foreground mt-0.5">
              {gre.vehiculo_placa || "N/A"}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "carga",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Carga
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const gre = row.original
        const peso = Number(gre.peso_bruto_total || 0).toFixed(2)
        const bultos = gre.numero_bultos || 0
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <Weight className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono">{peso} kg</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
              <Package className="h-3 w-3" />
              {bultos} bultos
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "estado_sunat",
      header: "Estado",
      cell: ({ row }) => getEstadoBadge(row.original.estado_sunat || "PENDIENTE"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const gre = row.original
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
                  setSelectedGRE(gre)
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
    data: guias,
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
          <Truck className="h-8 w-8" />
          Guías de Remisión
        </h1>
        <p className="text-muted-foreground mt-1">
          Documentos logísticos de traslado
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
                  No se encontraron guías de remisión
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
          {selectedGRE && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Guía {selectedGRE.serie?.codigo}-{String(selectedGRE.numero).padStart(6, "0")}
                </SheetTitle>
                <SheetDescription>
                  Documento de traslado de mercadería
                </SheetDescription>
              </SheetHeader>

              <SheetBody className="space-y-6">
                {/* KPI Principal */}
                <div className="rounded-lg border bg-muted/30 p-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Peso Bruto Total</div>
                  <div className="text-4xl font-bold tabular-nums">
                    {Number(selectedGRE.peso_bruto_total || 0).toFixed(2)} kg
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {selectedGRE.numero_bultos || 0} bultos
                  </div>
                </div>

                {/* Motivo del Traslado */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Motivo del Traslado
                  </h3>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-medium">{selectedGRE.motivo_traslado || "N/A"}</div>
                    {selectedGRE.descripcion_motivo && (
                      <div className="text-sm text-muted-foreground mt-2">
                        {selectedGRE.descripcion_motivo}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección Traslado */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ruta de Traslado
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <div className="text-sm font-medium">Punto de Partida</div>
                      </div>
                      <div className="text-sm text-muted-foreground ml-4">
                        {selectedGRE.direccion_partida || "No especificado"}
                      </div>
                      {selectedGRE.ubigeo_partida && (
                        <div className="text-xs text-muted-foreground ml-4 mt-1">
                          Ubigeo: {selectedGRE.ubigeo_partida}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-center">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <div className="text-sm font-medium">Punto de Llegada</div>
                      </div>
                      <div className="text-sm text-muted-foreground ml-4">
                        {selectedGRE.direccion_llegada || "No especificado"}
                      </div>
                      {selectedGRE.ubigeo_llegada && (
                        <div className="text-xs text-muted-foreground ml-4 mt-1">
                          Ubigeo: {selectedGRE.ubigeo_llegada}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Modalidad de Transporte */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Modalidad: {selectedGRE.modalidad_transporte || "PRIVADO"}
                  </h3>
                  
                  {selectedGRE.modalidad_transporte === "PUBLICO" ? (
                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Empresa Transportista</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">RUC</span>
                        <span className="font-mono">{selectedGRE.ruc_transportista || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Razón Social</span>
                        <span className="text-sm text-right max-w-[240px] truncate">
                          {selectedGRE.razon_social_transportista || "N/A"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Conductor Privado</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Nombre</span>
                        <span className="font-medium">{selectedGRE.nombre_conductor || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Licencia</span>
                        <span className="font-mono">{selectedGRE.licencia_conducir || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Placa Vehículo</span>
                        <span className="font-mono font-semibold">{selectedGRE.placa_vehiculo || "N/A"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Relación con Venta (si existe) */}
                {selectedGRE.venta && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documento Relacionado
                      </h3>
                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Comprobante</span>
                          <span className="font-mono">
                            {selectedGRE.venta.serie?.codigo}-{String(selectedGRE.venta.numero_comprobante).padStart(6, "0")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Cliente</span>
                          <span className="text-sm text-right max-w-[200px] truncate">
                            {selectedGRE.venta.cliente?.nombre || selectedGRE.venta.cliente?.razon_social || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Tabla de Carga - SOLO COLUMNAS LOGÍSTICAS */}
                {selectedGRE.detalles && selectedGRE.detalles.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Carga Transportada
                    </h3>
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">Cantidad</TableHead>
                            <TableHead>Descripción del Producto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedGRE.detalles.map((detalle: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono">{Number(detalle.cantidad).toFixed(0)}</TableCell>
                              <TableCell>
                                <div className="text-sm">{detalle.producto?.nombre || "Producto"}</div>
                                {detalle.producto?.sku && (
                                  <div className="text-xs text-muted-foreground font-mono">
                                    SKU: {detalle.producto.sku}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Información del Documento */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Información del Documento</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha Emisión</span>
                      <span className="text-sm">
                        {format(new Date(selectedGRE.fecha_emision), "dd/MM/yyyy HH:mm", { locale: es })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Inicio Traslado</span>
                      <span className="text-sm">
                        {format(new Date(selectedGRE.fecha_inicio_traslado), "dd/MM/yyyy HH:mm", { locale: es })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Estado SUNAT</span>
                      {getEstadoBadge(selectedGRE.estado_sunat || "PENDIENTE")}
                    </div>
                    {selectedGRE.usuario && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Emisor
                        </span>
                        <span className="text-sm">{selectedGRE.usuario.nombre}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información SUNAT (si existe) */}
                {(selectedGRE.hash_cpe || selectedGRE.xml_url || selectedGRE.cdr_url) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        Validación SUNAT
                      </h3>
                      <div className="rounded-lg border p-4 space-y-2 text-sm">
                        {selectedGRE.hash_cpe && (
                          <div className="flex justify-between items-start">
                            <span className="text-muted-foreground">Hash CPE</span>
                            <span className="font-mono text-xs break-all max-w-[240px] text-right">
                              {selectedGRE.hash_cpe}
                            </span>
                          </div>
                        )}
                        {selectedGRE.xml_url && (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-3 w-3 text-muted-foreground" />
                            <a 
                              href={selectedGRE.xml_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Descargar XML
                            </a>
                          </div>
                        )}
                        {selectedGRE.cdr_url && (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-3 w-3 text-muted-foreground" />
                            <a 
                              href={selectedGRE.cdr_url} 
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
                    <span>{format(new Date(selectedGRE.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}</span>
                  </div>
                </div>
              </SheetBody>

              <SheetFooter>
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <FileText className="mr-2 h-4 w-4" />
                      Imprimir Guía
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicar
                    </Button>
                  </div>
                  {selectedGRE.estado_sunat === "RECHAZADO" && (
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
