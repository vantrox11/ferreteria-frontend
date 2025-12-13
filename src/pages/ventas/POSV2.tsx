// Punto de Venta V2 - Diseño profesional y denso para ferretería
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  Minus,
  Package,
  ShoppingCart,
  X,
  Loader2,
  Barcode,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Eye,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getErrorMessage, isApiError } from "@/lib/api-error";
import { useCaja } from "@/context/CajaContext";
import { useQueryClient } from "@tanstack/react-query";
import { useGetApiProductos } from "@/api/generated/productos/productos";
import { useGetApiCategorias } from "@/api/generated/categorías/categorías";
import { usePostApiVentas } from "@/api/generated/ventas-pos/ventas-pos";
import { useGetApiClientesId } from "@/api/generated/clientes/clientes";
import { getGetApiCobranzasClientesClienteIdCreditoDisponibleQueryOptions } from "@/api/generated/cobranzas/cobranzas";
import type { Producto, CreateVentaCondicionPago } from "@/api/generated/model";
import { useQuery } from "@tanstack/react-query";
import ClientSelector from "@/components/ClientSelector";
import CreateProductDialog from "@/components/CreateProductDialog";
import { AperturaCajaModal } from "@/components/AperturaCajaModal";
import { MovimientosCajaModal } from "@/components/MovimientosCajaModal";
import { CierreCajaModal } from "@/components/CierreCajaModal";
import { cn } from "@/lib/utils";

// Tipado de productos con relaciones (without extending to avoid type conflicts)
type ProductoConRelaciones = Producto;

// Carrito de compras
interface CarritoItem {
  productoId: number;
  nombre: string;
  sku: string | null;
  cantidad: number;
  precioVenta: number;
  stockDisponible: number;
  unidadMedida: string | null;
  permiteDecimales: boolean;
}

// Formato de moneda
function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num);
}

export default function POSV2() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Estado de caja
  const { currentSessionId, currentSession, isLoading: loadingSession } = useCaja();
  const [showMovimientos, setShowMovimientos] = useState(false);
  const [showCierre, setShowCierre] = useState(false);

  // Estado del carrito y búsqueda
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("all");
  const [barcode, setBarcode] = useState("");

  // Estado del cliente y pago
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [tipoComprobante, setTipoComprobante] = useState<"BOLETA" | "FACTURA">("BOLETA");
  const [condicionPago, setCondicionPago] = useState<CreateVentaCondicionPago>("CONTADO");
  const [aCuenta, setACuenta] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "yape">("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [referenciaOperacion, setReferenciaOperacion] = useState("");
  const [saving, setSaving] = useState(false);

  // Queries
  const { data: productosResponse, isLoading: loading, refetch: refetchProductos } = useGetApiProductos({ limit: 100 });
  const { data: categoriasResponse } = useGetApiCategorias();
  const { mutateAsync: createVenta } = usePostApiVentas();

  const productos = productosResponse?.data ?? [];
  const categorias = categoriasResponse?.data ?? [];

  // Cliente seleccionado
  const { data: clienteData } = useGetApiClientesId(
    selectedClienteId ?? 0,
    { query: { enabled: !!selectedClienteId } }
  );

  // Crédito disponible
  const { data: creditoData } = useQuery(
    getGetApiCobranzasClientesClienteIdCreditoDisponibleQueryOptions(
      String(selectedClienteId ?? 0),
      { query: { enabled: !!selectedClienteId && condicionPago === 'CREDITO' } }
    )
  );

  // Conversión de pedido a venta (si viene de pedidos)
  const pedidoData = location.state?.pedido;
  useEffect(() => {
    if (!pedidoData || !productos || productos.length === 0) return;

    const detalles = pedidoData.detalles || [];
    const carritoConvertido: CarritoItem[] = detalles.map((det: any) => {
      const producto = (productos as ProductoConRelaciones[]).find((p) => p.id === det.producto_id);
      return {
        productoId: det.producto_id,
        nombre: producto?.nombre ?? det.producto?.nombre ?? "Producto",
        sku: producto?.sku ?? null,
        cantidad: det.cantidad ?? 1,
        precioVenta: det.precio_unitario ?? producto?.precio_venta ?? 0,
        stockDisponible: producto?.stock ?? 0,
        unidadMedida: producto?.unidad_medida?.codigo ?? null,
        permiteDecimales: producto?.unidad_medida?.permite_decimales ?? false,
      };
    });

    setCarrito(carritoConvertido);
  }, [pedidoData, productos]);

  // Productos filtrados
  const filteredProductos = useMemo(() => {
    const s = search.trim().toLowerCase();
    const b = barcode.trim();
    return (productos as ProductoConRelaciones[])
      .filter((p) => {
        const nombre = p.nombre ?? "";
        const sku = p.sku ?? "";
        const barcodeMatch = b ? sku === b : true;
        const bySearch = s ? nombre.toLowerCase().includes(s) || sku.toLowerCase().includes(s) : true;
        const byCat = selectedCategoriaId === "all" ? true : p.categoria_id === Number(selectedCategoriaId);
        return barcodeMatch && bySearch && byCat;
      })
      .sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
  }, [productos, search, selectedCategoriaId, barcode]);

  // Manejo del carrito
  function handleAddToCart(producto: ProductoConRelaciones) {
    const stockActual = producto.stock ?? 0;
    if (stockActual <= 0) {
      toast.error("Producto sin stock disponible");
      return;
    }

    setCarrito((prev) => {
      const existing = prev.find((i) => i.productoId === producto.id);
      if (existing) {
        if (existing.cantidad < existing.stockDisponible) {
          return prev.map((i) =>
            i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
          );
        }
        toast.warning(`Stock máximo: ${existing.stockDisponible}`);
        return prev;
      }
      const precioVenta = producto.precio_venta ?? 0;
      const unidadCodigo = producto.unidad_medida?.codigo ?? null;
      const permiteDecimales = producto.unidad_medida?.permite_decimales ?? false;
      const nuevo: CarritoItem = {
        productoId: producto.id!,
        nombre: producto.nombre ?? "Producto",
        sku: producto.sku ?? null,
        cantidad: 1,
        precioVenta: precioVenta,
        stockDisponible: stockActual,
        unidadMedida: unidadCodigo,
        permiteDecimales: permiteDecimales,
      };
      toast.success(`${producto.nombre} añadido`);
      return [...prev, nuevo];
    });
  }

  function handleRemoveItem(productoId: number) {
    setCarrito((prev) => prev.filter((i) => i.productoId !== productoId));
  }

  function handleIncrementCantidad(productoId: number) {
    setCarrito((prev) =>
      prev.map((i) => {
        if (i.productoId === productoId) {
          const incremento = i.permiteDecimales ? 0.1 : 1;
          const next = Number((i.cantidad + incremento).toFixed(3));
          if (next > i.stockDisponible) {
            toast.warning(`Stock máximo: ${i.stockDisponible} ${i.unidadMedida ?? ''}`);
            return i;
          }
          return { ...i, cantidad: next };
        }
        return i;
      })
    );
  }

  function handleDecrementCantidad(productoId: number) {
    setCarrito((prev) =>
      prev.map((i) => {
        if (i.productoId === productoId) {
          const decremento = i.permiteDecimales ? 0.1 : 1;
          const minimo = i.permiteDecimales ? 0.001 : 1;
          const next = Number((i.cantidad - decremento).toFixed(3));
          if (next < minimo) return i;
          return { ...i, cantidad: next };
        }
        return i;
      })
    );
  }

  function handleChangeCantidad(productoId: number, nuevaCantidad: number) {
    setCarrito((prev) =>
      prev.map((i) => {
        if (i.productoId === productoId) {
          const minimo = i.permiteDecimales ? 0.001 : 1;
          const cantidad = Math.max(minimo, Math.min(nuevaCantidad, i.stockDisponible));
          if (cantidad < nuevaCantidad) toast.warning(`Stock máximo: ${i.stockDisponible} ${i.unidadMedida ?? ''}`);
          return { ...i, cantidad: Number(cantidad.toFixed(3)) };
        }
        return i;
      })
    );
  }

  // Cálculos
  const total = carrito.reduce((sum, i) => sum + i.cantidad * i.precioVenta, 0);
  const recibido = parseFloat(montoRecibido.replace(",", ".")) || 0;
  const vuelto = recibido - total;
  const faltaDinero = paymentMethod === "efectivo" && vuelto < 0;

  // Validación de crédito
  const tieneLineaCredito = clienteData?.limite_credito && Number(clienteData.limite_credito) > 0;
  const creditoDisponible = creditoData?.credito_disponible ?? 0;
  const montoACuenta = condicionPago === 'CREDITO' ? (parseFloat(aCuenta.replace(",", ".")) || 0) : 0;
  const saldoCredito = condicionPago === 'CREDITO' ? total - montoACuenta : 0;
  const excedeLimiteCredito = condicionPago === 'CREDITO' && saldoCredito > creditoDisponible;

  // Registrar venta
  async function handleRegistrarVenta() {
    if (carrito.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        cliente_id: selectedClienteId,
        tipo_comprobante: tipoComprobante,
        metodo_pago: paymentMethod,
        referencia_pago: referenciaOperacion || undefined,
        condicion_pago: condicionPago,
        pago_inicial: condicionPago === 'CREDITO' && montoACuenta > 0 ? montoACuenta : undefined,
        pedido_origen_id: pedidoData?.id,
        detalles: carrito.map((i) => ({
          producto_id: i.productoId,
          cantidad: i.cantidad,
          precio_unitario: i.precioVenta,
        })),
      };
      await createVenta({ data: payload });

      queryClient.removeQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key.includes('/api/ventas');
        }
      });

      await queryClient.invalidateQueries({ queryKey: ['api', 'productos'] });

      toast.success("¡Venta registrada exitosamente!");

      setCarrito([]);
      setMontoRecibido("");
      setReferenciaOperacion("");
      setACuenta("");
      setSelectedClienteId(null);
      setTipoComprobante('BOLETA');
      setCondicionPago('CONTADO');
      await refetchProductos();
    } catch (error: unknown) {
      if (isApiError(error) && error.response?.data?.requiere_accion === "APERTURA_SESION") {
        toast.error("Debes abrir una sesión de caja antes de registrar ventas");
      } else {
        toast.error(getErrorMessage(error, "Error al registrar la venta"));
      }
    } finally {
      setSaving(false);
    }
  }

  // Escaneo de código de barras
  useEffect(() => {
    let buffer = "";
    let timeout: ReturnType<typeof setTimeout>;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar si está escribiendo en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      clearTimeout(timeout);

      if (e.key === "Enter" && buffer.length > 0) {
        // Buscar producto por SKU
        const producto = (productos as ProductoConRelaciones[]).find(
          (p) => p.sku === buffer
        );
        if (producto) {
          handleAddToCart(producto);
          setBarcode(buffer);
          setTimeout(() => setBarcode(""), 2000);
        } else {
          toast.error("Producto no encontrado");
        }
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
        timeout = setTimeout(() => {
          buffer = "";
        }, 100);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      clearTimeout(timeout);
    };
  }, [productos]);

  if (loading || loadingSession) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {!currentSessionId && (
        <AperturaCajaModal
          open={true}
          onClose={() => navigate('/dashboard')}
        />
      )}

      {currentSessionId && (
        <>
          <MovimientosCajaModal open={showMovimientos} onOpenChange={setShowMovimientos} />
          <CierreCajaModal open={showCierre} onOpenChange={setShowCierre} />

          <div className="fixed inset-0 top-[var(--header-height)] left-[var(--sidebar-width)] flex flex-col overflow-hidden">
            {/* Header con título e info de caja en la misma línea */}
            <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0 bg-background">
              <h1 className="text-xl font-semibold">Punto de Venta V2</h1>
              
              {/* Info de sesión y botones - TODO HORIZONTAL */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span className="text-xs font-medium">Sesión Activa</span>
                  <span className="text-xs text-muted-foreground">
                    {currentSession?.fecha_apertura ? new Date(currentSession.fecha_apertura).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowMovimientos(true)}
                  className="h-8 text-xs"
                >
                  <Eye className="mr-1.5 size-3.5" />
                  Movimientos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCierre(true)}
                  className="h-8 text-xs text-destructive hover:text-destructive"
                >
                  <X className="mr-1.5 size-3.5" />
                  Cerrar Turno
                </Button>
              </div>
            </div>

            {/* Layout principal - ocupa todo el espacio restante SIN SCROLL */}
            <div className="flex-1 flex gap-3 px-3 pb-3 pt-3 overflow-hidden">
              {/* Panel izquierdo - Productos */}
              <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                {/* Búsqueda y filtros compactos - FIJO */}
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-card flex-shrink-0">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar producto por nombre o SKU..."
                      className="pl-9 h-9"
                    />
                  </div>
                  <div className="relative w-40">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Código"
                      className="pl-9 h-9"
                      readOnly
                    />
                  </div>
                  <Select value={selectedCategoriaId} onValueChange={setSelectedCategoriaId}>
                    <SelectTrigger className="w-36 h-9">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categorias.map((cat: any) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <CreateProductDialog onCreated={() => void refetchProductos()}>
                    <Button size="sm" className="h-9">
                      <Plus className="mr-1.5 size-4" />
                      Nuevo
                    </Button>
                  </CreateProductDialog>
                </div>

                {/* Grid de productos - SOLO ESTA PARTE TIENE SCROLL */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pr-2 pb-3">
                      {filteredProductos.map((p) => {
                        const stockActual = p.stock ?? 0;
                        const stockBajo = stockActual > 0 && stockActual <= 10;
                        const sinStock = stockActual <= 0;

                        return (
                          <Card
                            key={p.id}
                            className={cn(
                              "group overflow-hidden transition-all cursor-pointer",
                              sinStock && "opacity-50",
                              !sinStock && "hover:shadow-md hover:border-primary/30 hover:scale-[1.02]"
                            )}
                            onClick={() => !sinStock && handleAddToCart(p)}
                          >
                            <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                              {p.imagen_url ? (
                                <img
                                  src={p.imagen_url}
                                  alt={p.nombre || ''}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <Package className="size-10 text-muted-foreground/40" />
                              )}
                              {stockBajo && (
                                <Badge className="absolute top-1.5 right-1.5 h-5 text-[10px] bg-orange-500">
                                  ¡{stockActual} quedan!
                                </Badge>
                              )}
                              {sinStock && (
                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                  <Badge variant="destructive" className="h-6">Sin Stock</Badge>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-2.5 space-y-1">
                              <h3 className="font-medium text-xs line-clamp-2 leading-tight min-h-[2rem]">
                                {p.nombre}
                              </h3>
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-bold text-primary tabular-nums">
                                  {formatCurrency(p.precio_venta ?? 0)}
                                </div>
                                {!sinStock && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="size-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToCart(p);
                                    }}
                                  >
                                    <Plus className="size-4" />
                                  </Button>
                                )}
                              </div>
                              {p.sku && (
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  {p.sku}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                      {filteredProductos.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                          <Package className="size-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-medium">No se encontraron productos</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              {/* Panel derecho - Carrito y Pago */}
              <div className="w-96 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
                {/* Card principal del carrito */}
                <Card className="flex-1 flex flex-col overflow-hidden">
                  <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    {/* Header del carrito */}
                    <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="size-3.5" />
                        <span className="font-semibold text-xs">Carrito</span>
                        <Badge variant="secondary" className="h-4 text-[10px] px-1.5">
                          {carrito.length}
                        </Badge>
                      </div>
                      {carrito.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCarrito([])}
                          className="h-6 text-[10px] text-destructive hover:text-destructive px-2"
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>

                    {/* Selector de cliente - FIJO */}
                    <div className="p-2.5 border-b space-y-2 flex-shrink-0">
                      <ClientSelector
                        value={selectedClienteId}
                        clienteSeleccionado={clienteData ?? null}
                        onChange={(clienteId: any) => {
                          setSelectedClienteId(clienteId);
                          setTipoComprobante('BOLETA');
                          setCondicionPago('CONTADO');
                          setACuenta("");
                        }}
                        disabled={saving}
                      />

                      {/* Tipo de comprobante y Condición de pago - TODO EN UNA LÍNEA */}
                      {selectedClienteId && (
                        <div className="flex items-center gap-2">
                          {(clienteData?.ruc || clienteData?.documento_identidad?.match(/^[0-9]{11}$/)) && (
                            <>
                              <Button
                                size="sm"
                                variant={tipoComprobante === 'BOLETA' ? 'default' : 'outline'}
                                onClick={() => setTipoComprobante('BOLETA')}
                                disabled={saving}
                                className="h-7 flex-1 text-[10px]"
                              >
                                Boleta
                              </Button>
                              <Button
                                size="sm"
                                variant={tipoComprobante === 'FACTURA' ? 'default' : 'outline'}
                                onClick={() => setTipoComprobante('FACTURA')}
                                disabled={saving}
                                className="h-7 flex-1 text-[10px]"
                              >
                                Factura
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant={condicionPago === 'CONTADO' ? 'default' : 'outline'}
                            onClick={() => {
                              setCondicionPago('CONTADO');
                              setACuenta("");
                              setMontoRecibido("");
                            }}
                            disabled={saving}
                            className="h-7 flex-1 text-[10px]"
                          >
                            Contado
                          </Button>
                          <Button
                            size="sm"
                            variant={condicionPago === 'CREDITO' ? 'default' : 'outline'}
                            onClick={() => {
                              setCondicionPago('CREDITO');
                              setACuenta("");
                            }}
                            disabled={saving || !tieneLineaCredito}
                            className="h-7 flex-1 text-[10px]"
                          >
                            Crédito
                          </Button>
                        </div>
                      )}

                      {/* Info de crédito compacta */}
                      {selectedClienteId && condicionPago === 'CREDITO' && tieneLineaCredito && (
                        <div className="rounded border bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 p-1.5 space-y-0.5">
                          <div className="flex justify-between text-[9px]">
                            <span className="text-blue-700 dark:text-blue-300">Límite:</span>
                            <span className="font-semibold text-blue-900 dark:text-blue-100">
                              {formatCurrency(clienteData?.limite_credito ?? 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[9px]">
                            <span className="text-blue-700 dark:text-blue-300">Disponible:</span>
                            <span className="font-semibold text-blue-900 dark:text-blue-100">
                              {formatCurrency(creditoDisponible)}
                            </span>
                          </div>

                          {excedeLimiteCredito && (
                            <div className="pt-0.5 border-t border-blue-200 dark:border-blue-800">
                              <p className="text-[9px] text-destructive font-medium flex items-center gap-0.5">
                                <AlertCircle className="size-2.5" />
                                Excede crédito
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Lista del carrito - SOLO ESTA PARTE TIENE SCROLL */}
                    <div className="flex-1 overflow-y-auto">
                      {carrito.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground px-4">
                          <ShoppingCart className="size-12 mx-auto mb-2 opacity-20" />
                          <p className="font-medium text-xs">Carrito vacío</p>
                          <p className="text-[10px]">Añade productos para comenzar</p>
                        </div>
                      ) : (
                        <div className="px-3 py-2 space-y-2">
                          {carrito.map((item) => (
                            <Card key={item.productoId} className="relative bg-muted/30">
                              <CardContent className="p-2 pr-8">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute right-1 top-1 size-6 p-0 hover:bg-destructive/10"
                                  onClick={() => handleRemoveItem(item.productoId)}
                                >
                                  <X className="size-3 text-destructive" />
                                </Button>

                                <div className="space-y-1.5">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <h4 className="font-semibold text-xs leading-tight line-clamp-1">
                                      {item.nombre}
                                    </h4>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                      {formatCurrency(item.precioVenta)}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="size-6 p-0"
                                        onClick={() => handleDecrementCantidad(item.productoId)}
                                      >
                                        <Minus className="size-2.5" />
                                      </Button>
                                      <Input
                                        type="number"
                                        min={item.permiteDecimales ? 0.001 : 1}
                                        max={item.stockDisponible}
                                        step={item.permiteDecimales ? 0.001 : 1}
                                        value={item.cantidad}
                                        onChange={(e) => handleChangeCantidad(item.productoId, Number(e.target.value))}
                                        className="w-12 h-6 text-center text-xs p-0.5"
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="size-6 p-0"
                                        onClick={() => handleIncrementCantidad(item.productoId)}
                                      >
                                        <Plus className="size-2.5" />
                                      </Button>
                                      <span className="text-[10px] text-muted-foreground ml-0.5">
                                        {item.unidadMedida || 'und'}
                                      </span>
                                    </div>

                                    <div className="text-sm font-bold tabular-nums">
                                      {formatCurrency(item.cantidad * item.precioVenta)}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Footer: Total y Pago - FIJO */}
                    <div className="p-3 space-y-2 bg-muted/30 flex-shrink-0">
                      {/* Total destacado */}
                      <div className="text-center py-1.5">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Total a pagar</div>
                        <div className="text-3xl font-bold text-primary tabular-nums">
                          {formatCurrency(total)}
                        </div>
                      </div>

                      {/* Pago a cuenta (solo para CRÉDITO) */}
                      {condicionPago === 'CREDITO' && (
                        <div>
                          <label className="text-[10px] text-muted-foreground">
                            Pago a Cuenta (opcional)
                          </label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            max={total}
                            placeholder="0.00"
                            value={aCuenta}
                            onChange={(e) => setACuenta(e.target.value)}
                            className="h-8 text-sm font-medium"
                          />
                          {montoACuenta > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Saldo a crédito: {formatCurrency(saldoCredito)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Método de pago */}
                      <Tabs
                        value={paymentMethod}
                        onValueChange={(v) => setPaymentMethod(v as "efectivo" | "tarjeta" | "yape")}
                      >
                        <TabsList className="grid grid-cols-3 w-full h-8">
                          <TabsTrigger value="efectivo" className="text-xs">
                            <Banknote className="mr-1 size-3" />
                            Efectivo
                          </TabsTrigger>
                          <TabsTrigger value="tarjeta" className="text-xs">
                            <CreditCard className="mr-1 size-3" />
                            Tarjeta
                          </TabsTrigger>
                          <TabsTrigger value="yape" className="text-xs">
                            <Smartphone className="mr-1 size-3" />
                            Yape
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>

                      {/* Referencia (si no es efectivo) */}
                      {paymentMethod !== "efectivo" && (
                        <div>
                          <label className="text-[10px] text-muted-foreground">
                            Nro. Operación
                          </label>
                          <Input
                            type="text"
                            placeholder="123456789"
                            value={referenciaOperacion}
                            onChange={(e) => setReferenciaOperacion(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}

                      {/* Recibe / Vuelto (solo efectivo) */}
                      {paymentMethod === "efectivo" && (
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] text-muted-foreground">Recibe</label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={montoRecibido}
                              onChange={(e) => setMontoRecibido(e.target.value)}
                              className="h-8 text-sm font-medium"
                              autoFocus
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] text-muted-foreground">
                              {faltaDinero ? "Falta" : "Vuelto"}
                            </label>
                            <div
                              className={cn(
                                "h-8 flex items-center justify-end px-2 rounded-md border",
                                faltaDinero
                                  ? "bg-destructive/10 border-destructive/20 text-destructive"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400"
                              )}
                            >
                              <span className="text-sm font-bold tabular-nums">
                                {formatCurrency(Math.abs(vuelto))}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Botón de cobrar */}
                      <Button
                        variant="default"
                        size="lg"
                        className="w-full font-semibold h-10"
                        onClick={handleRegistrarVenta}
                        disabled={
                          carrito.length === 0 ||
                          saving ||
                          (condicionPago === 'CONTADO' && paymentMethod === "efectivo" && recibido < total) ||
                          excedeLimiteCredito
                        }
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Calculator className="mr-2 size-4" />
                            Cobrar
                            {paymentMethod === "efectivo" && !faltaDinero && recibido > 0 && (
                              <span className="ml-1.5 text-xs opacity-90">
                                · {formatCurrency(vuelto)} vuelto
                              </span>
                            )}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
