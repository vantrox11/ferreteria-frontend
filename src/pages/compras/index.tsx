
// Página de gestión de órdenes de compra con información fiscal (Historial + Detalle con Sheet)
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Package, Eye, Loader2, CheckCircle2, XCircle, Clock, AlertCircle, FileText, Receipt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ProviderSelector } from "@/components/ProviderSelector";
import { ReceiveOrderModal } from "@/components/ReceiveOrderModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useGetApiCompras,
  useGetApiComprasId,
  usePostApiComprasIdCancelar,
} from "@/api/generated/órdenes-de-compra/órdenes-de-compra";
import type { Proveedor, GetApiComprasEstado, OrdenCompraDetallesItem } from "@/api/generated/model";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatCurrency } from "@/hooks/usePurchaseOrderCalculator";
import { getErrorMessage } from "@/lib/api-error";
import type { LucideIcon } from "lucide-react";

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const getEstadoBadge = (estado: string) => {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: LucideIcon, label: string, className?: string }> = {
    pendiente: { variant: "secondary", icon: Clock, label: "Pendiente" },
    recibida: { variant: "default", icon: CheckCircle2, label: "Recibida" },
    cancelada: { variant: "destructive", icon: XCircle, label: "Cancelada" },
  };
  const item = config[estado] || { variant: "outline" as const, icon: AlertCircle, label: estado };
  const Icon = item.icon;

  return (
    <Badge variant={item.variant} className={`gap-1 ${item.className || ""}`}>
      <Icon className="h-3 w-3" />
      {item.label}
    </Badge>
  );
};

const getTipoComprobanteBadge = (tipo: string | null | undefined) => {
  if (!tipo) return <Badge variant="outline">Sin Comprobante</Badge>;

  const config: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
    FACTURA: { variant: "default", label: "Factura" },
    BOLETA: { variant: "secondary", label: "Boleta" },
    GUIA: { variant: "outline", label: "Guía" },
  };

  const item = config[tipo] || { variant: "outline" as const, label: tipo };

  return <Badge variant={item.variant}>{item.label}</Badge>;
};

const ComprasPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados de filtros
  const [estadoFilter, setEstadoFilter] = useState<string>("todas");
  const [tipoComprobanteFilter, setTipoComprobanteFilter] = useState<string>("todos");
  const [proveedorFilter, setProveedorFilter] = useState<Proveedor | null>(null);
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  // Estados del sheet de detalle
  const [selectedOrdenId, setSelectedOrdenId] = useState<number | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Estados de modales
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [confirmCancelarOpen, setConfirmCancelarOpen] = useState(false);

  // Query principal con filtros
  const { data: ordenesResponse, isLoading, error } = useGetApiCompras(
    {
      estado: estadoFilter !== "todas" ? (estadoFilter as GetApiComprasEstado) : undefined,
      proveedor_id: proveedorFilter?.id,
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined,
    }
  );

  // Query de detalle (solo se ejecuta si hay ID seleccionado)
  const { data: ordenDetalle, isLoading: loadingDetalle } = useGetApiComprasId(
    selectedOrdenId!,
    { query: { enabled: !!selectedOrdenId } }
  );

  // Mutation de cancelar
  const { mutate: cancelarOrden, isPending: cancelandoOrden } = usePostApiComprasIdCancelar({
    mutation: {
      onSuccess: () => {
        toast.success("Orden cancelada correctamente");
        queryClient.invalidateQueries({ queryKey: ["/api/compras"] });
        queryClient.invalidateQueries({ queryKey: [`/api/compras/${selectedOrdenId}`] });
        setConfirmCancelarOpen(false);
        setDetailSheetOpen(false);
      },
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    },
  });

  const ordenes = ordenesResponse?.data || [];

  // Filtrado client-side por tipo de comprobante
  const filteredOrdenes = useMemo(() => {
    if (tipoComprobanteFilter === "todos") return ordenes;
    return ordenes.filter(orden => orden.tipo_comprobante === tipoComprobanteFilter);
  }, [ordenes, tipoComprobanteFilter]);

  const handleVerDetalle = (ordenId: number) => {
    setSelectedOrdenId(ordenId);
    setDetailSheetOpen(true);
  };

  const handleCancelarOrden = () => {
    if (!selectedOrdenId) return;
    cancelarOrden({ id: selectedOrdenId });
  };

  const handleReceiveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/compras"] });
    queryClient.invalidateQueries({ queryKey: [`/api/compras/${selectedOrdenId}`] });
  };

  if (error) {
    return (
      <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
        <h1 className="text-2xl font-semibold">Órdenes de Compra</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error al cargar órdenes: {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pt-1 md:pt-2 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Órdenes de Compra</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las órdenes de compra a proveedores con información fiscal
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/compras/nueva-fiscal")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Orden de Compra
        </Button>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border bg-card p-4 relative">
        {/* Botón X en esquina superior derecha */}
        {(estadoFilter !== "todas" || tipoComprobanteFilter !== "todos" || proveedorFilter || fechaInicio || fechaFin) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEstadoFilter("todas");
              setTipoComprobanteFilter("todos");
              setProveedorFilter(null);
              setFechaInicio("");
              setFechaFin("");
            }}
            className="absolute top-2 right-2 h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Filtro de Estado */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="recibida">Recibidas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Tipo Comprobante */}
          <div className="space-y-2">
            <Label>Tipo Comprobante</Label>
            <Select value={tipoComprobanteFilter} onValueChange={setTipoComprobanteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="FACTURA">Factura</SelectItem>
                <SelectItem value="BOLETA">Boleta</SelectItem>
                <SelectItem value="GUIA">Guía</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Proveedor */}
          <div className="space-y-2">
            <Label>Proveedor</Label>
            <ProviderSelector
              value={proveedorFilter?.id}
              onValueChange={setProveedorFilter}
            />
          </div>

          {/* Filtro de Fecha Inicio */}
          <div className="space-y-2">
            <Label htmlFor="fechaInicio">Fecha Desde</Label>
            <Input
              id="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          {/* Filtro de Fecha Fin */}
          <div className="space-y-2">
            <Label htmlFor="fechaFin">Fecha Hasta</Label>
            <Input
              id="fechaFin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredOrdenes.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay órdenes de compra</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {estadoFilter !== "todas" || proveedorFilter || fechaInicio || fechaFin
              ? "No se encontraron órdenes con los filtros aplicados"
              : "Crea tu primera orden de compra para comenzar"}
          </p>
          <Button onClick={() => navigate("/dashboard/compras/nueva-fiscal")}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Primera Orden
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="text-left p-3 font-medium text-sm">Orden #</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Proveedor</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Tipo</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Comprobante</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Fecha</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Estado</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Subtotal</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">IGV</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm">Total</TableHead>
                <TableHead className="text-left p-3 font-medium text-sm w-20">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrdenes.map((orden) => (
                <TableRow key={orden.id} className="border-t hover:bg-muted/50">
                  <TableCell className="p-3">
                    <div className="font-bold">OC-{String(orden.id).padStart(5, "0")}</div>
                  </TableCell>
                  <TableCell className="p-3">
                    <div className="font-medium">
                      {orden.proveedor?.nombre || "Sin proveedor"}
                    </div>
                    {orden.proveedor?.ruc_identidad && (
                      <div className="text-xs text-muted-foreground">
                        RUC: {orden.proveedor.ruc_identidad}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="p-3">{getTipoComprobanteBadge(orden.tipo_comprobante)}</TableCell>
                  <TableCell className="p-3 text-sm">
                    {orden.serie && orden.numero ? (
                      <span className="font-mono">{orden.serie}-{orden.numero}</span>
                    ) : (
                      <span className="text-muted-foreground">Sin comprobante</span>
                    )}
                  </TableCell>
                  <TableCell className="p-3 text-sm">{formatDate(orden.fecha_creacion)}</TableCell>
                  <TableCell className="p-3">{getEstadoBadge(orden.estado)}</TableCell>
                  <TableCell className="p-3 text-left font-medium tabular-nums text-sm">
                    {formatCurrency(Number(orden.subtotal_base) || 0)}
                  </TableCell>
                  <TableCell className="p-3 text-left font-medium tabular-nums text-sm text-orange-600">
                    {formatCurrency(Number(orden.impuesto_igv) || 0)}
                  </TableCell>
                  <TableCell className="p-3 text-left font-semibold tabular-nums">
                    {formatCurrency(Number(orden.total) || 0)}
                  </TableCell>
                  <TableCell className="p-3 text-left">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleVerDetalle(orden.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="border-t bg-muted/50 p-3 text-sm text-muted-foreground">
            <strong>{filteredOrdenes.length}</strong> {filteredOrdenes.length === 1 ? "orden" : "órdenes"}
          </div>
        </div>
      )}

      {/* Sheet de Detalle */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="sm:max-w-2xl">
          {loadingDetalle || !ordenDetalle ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">
                  Orden de Compra #{String(ordenDetalle.id).padStart(5, "0")}
                </SheetTitle>
                <SheetDescription>
                  Detalles completos de la orden de compra
                </SheetDescription>
              </SheetHeader>

              <SheetBody className="space-y-6">{/* Sección A: Cabecera - Info del Proveedor y Estado */}
                {/* Sección A: Cabecera - Info del Proveedor y Estado */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Estado</h3>
                    <div className="scale-110">{getEstadoBadge(ordenDetalle.estado)}</div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Información del Proveedor</h3>
                    {ordenDetalle.proveedor ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nombre:</span>
                          <span className="font-medium">{ordenDetalle.proveedor.nombre}</span>
                        </div>
                        {ordenDetalle.proveedor.ruc_identidad && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">RUC:</span>
                            <span>{ordenDetalle.proveedor.ruc_identidad}</span>
                          </div>
                        )}
                        {ordenDetalle.proveedor.telefono && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Teléfono:</span>
                            <span>{ordenDetalle.proveedor.telefono}</span>
                          </div>
                        )}
                        {ordenDetalle.proveedor.email && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{ordenDetalle.proveedor.email}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin proveedor asignado</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block mb-1">Fecha de Emisión</span>
                      <span className="font-medium">{formatDate(ordenDetalle.fecha_creacion)}</span>
                    </div>
                    {ordenDetalle.fecha_recepcion && (
                      <div>
                        <span className="text-muted-foreground block mb-1">Fecha de Recepción</span>
                        <span className="font-medium text-green-600">
                          {formatDateTime(ordenDetalle.fecha_recepcion)}
                        </span>
                      </div>
                    )}
                  </div>

                  {ordenDetalle.usuario && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Creado por: </span>
                      <span className="font-medium">
                        {ordenDetalle.usuario.nombre || ordenDetalle.usuario.email}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Sección de Información Fiscal */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Información Fiscal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground block mb-1">Tipo de Comprobante</span>
                      {getTipoComprobanteBadge(ordenDetalle.tipo_comprobante)}
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Número de Comprobante</span>
                      <span className="font-mono font-medium">
                        {ordenDetalle.serie && ordenDetalle.numero ? (
                          `${ordenDetalle.serie}-${ordenDetalle.numero}`
                        ) : (
                          <span className="text-muted-foreground">Sin comprobante</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Subtotal Base</span>
                      <span className="font-medium">
                        {formatCurrency(Number(ordenDetalle.subtotal_base) || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">IGV (18%)</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(Number(ordenDetalle.impuesto_igv) || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Sección B: Lista de Productos */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Productos Ordenados</h3>
                  {ordenDetalle.detalles && ordenDetalle.detalles.length > 0 ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border overflow-hidden">
                        <Table className="text-sm">
                          <TableHeader className="bg-muted">
                            <TableRow>
                              <TableHead className="text-left p-2 font-medium">Producto</TableHead>
                              <TableHead className="text-left p-2 font-medium">SKU</TableHead>
                              <TableHead className="text-left p-2 font-medium">Cantidad</TableHead>
                              <TableHead className="text-left p-2 font-medium">Costo Unit.</TableHead>
                              <TableHead className="text-left p-2 font-medium">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ordenDetalle.detalles.map((detalle: OrdenCompraDetallesItem) => (
                              <TableRow key={detalle.id} className="border-t">
                                <TableCell className="p-2">
                                  <div className="font-medium">{detalle.producto?.nombre || "—"}</div>
                                  {ordenDetalle.estado === "pendiente" && detalle.producto?.stock != null && (
                                    <div className="text-xs text-muted-foreground">
                                      Stock actual: {Number(detalle.producto.stock).toFixed(3)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="p-2 text-muted-foreground">
                                  {detalle.producto?.sku || "—"}
                                </TableCell>
                                <TableCell className="p-2 text-left tabular-nums">
                                  {Number(detalle.cantidad).toFixed(3).replace(/\.?0+$/, "")}
                                </TableCell>
                                <TableCell className="p-2 text-left tabular-nums">
                                  {formatCurrency(Number(detalle.costo_unitario) || 0)}
                                </TableCell>
                                <TableCell className="p-2 text-left font-medium tabular-nums">
                                  {formatCurrency(Number(detalle.cantidad) * Number(detalle.costo_unitario))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Total General */}
                      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                        <span className="font-semibold text-lg">TOTAL</span>
                        <span className="font-bold text-2xl">
                          {formatCurrency(Number(ordenDetalle.total) || 0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay productos en esta orden</p>
                  )}
                </div>

                <Separator />

                {/* Alertas de Estado */}
                {ordenDetalle.estado === "pendiente" && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Esta orden está <strong>PENDIENTE</strong>. El stock se actualizará cuando
                      recibas la mercadería.
                    </AlertDescription>
                  </Alert>
                )}

                {ordenDetalle.estado === "recibida" && ordenDetalle.fecha_recepcion && (
                  <Alert className="border-green-600 bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <strong>Recibido el:</strong> {formatDateTime(ordenDetalle.fecha_recepcion)}
                      <br />
                      El stock de los productos ya fue actualizado.
                    </AlertDescription>
                  </Alert>
                )}

                {ordenDetalle.estado === "cancelada" && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Esta orden fue <strong>CANCELADA</strong>. No se realizó ningún movimiento de
                      stock.
                    </AlertDescription>
                  </Alert>
                )}
              </SheetBody>

              {/* Botones de Acción en Footer */}
              <SheetFooter>
                {ordenDetalle.estado === "pendiente" && (
                  <div className="flex gap-3 w-full">
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={() => setReceiveModalOpen(true)}
                      disabled={cancelandoOrden}
                    >
                      <Receipt className="mr-2 h-5 w-5" />
                      Recibir Mercadería
                    </Button>
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={() => setConfirmCancelarOpen(true)}
                      disabled={cancelandoOrden}
                    >
                      <XCircle className="mr-2 h-5 w-5" />
                      Cancelar Orden
                    </Button>
                  </div>
                )}

                {ordenDetalle.estado === "recibida" && (
                  <Button variant="outline" size="lg" className="w-full" disabled>
                    <FileText className="mr-2 h-5 w-5" />
                    Imprimir Comprobante (Próximamente)
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ReceiveOrderModal - Recibir Mercadería */}
      <ReceiveOrderModal
        orden={ordenDetalle || null}
        open={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        onSuccess={handleReceiveSuccess}
      />

      {/* AlertDialog - Confirmar Cancelación */}
      <AlertDialog open={confirmCancelarOpen} onOpenChange={setConfirmCancelarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar orden de compra?</AlertDialogTitle>
            <AlertDialogDescription>
              La orden quedará marcada como <strong>CANCELADA</strong> y no se podrá recibir
              mercadería.
              <br />
              <br />
              No se realizará ningún movimiento de stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelandoOrden}>No, volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelarOrden}
              disabled={cancelandoOrden}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelandoOrden ? "Cancelando..." : "Sí, Cancelar Orden"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ComprasPage;