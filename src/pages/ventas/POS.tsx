import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShoppingCart, DollarSign, Plus, Minus, Search, X, Package, CreditCard, Banknote, Smartphone, ArrowRightLeft, LogOut } from "lucide-react";

import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGetApiProductos } from "@/api/generated/productos/productos";
import { useGetApiCategorias } from "@/api/generated/categorías/categorías";
import { usePostApiVentas } from "@/api/generated/ventas-pos/ventas-pos";
import { useGetApiClientesId } from "@/api/generated/clientes/clientes";
import { getGetApiCobranzasClientesClienteIdCreditoDisponibleQueryOptions } from "@/api/generated/cobranzas/cobranzas";
import type { Producto, CreateVentaCondicionPago } from "@/api/generated/model";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";

import CreateProductDialog from "@/components/CreateProductDialog";
import ClientSelector from "@/components/ClientSelector";
import { useQueryClient } from "@tanstack/react-query";
import { useCaja } from "@/context/CajaContext";
import { AperturaCajaModal } from "@/components/AperturaCajaModal";
import { useNavigate } from "react-router-dom";
import { MovimientosCajaModal } from "@/components/MovimientosCajaModal";
import { CierreCajaModal } from "@/components/CierreCajaModal";
import { getErrorMessage, isApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

// Tipo extendido con relaciones expandidas (como lo envía el backend)
interface ProductoConRelaciones extends Producto {
  unidad_medida?: {
    codigo: string;
    permite_decimales: boolean;
  };
}

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

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num);
}

// Constantes CSS para layout responsive
const LAYOUT = {
  CART_MIN_WIDTH: "340px",
  CART_MAX_WIDTH: "480px",
  PRODUCT_CARD_MIN: "180px",
  GAP: "1rem",
  GAP_LG: "1.5rem",
} as const;

export default function POSPageV2() {
  const navigate = useNavigate();
  const location = useLocation();
  const pedidoData = location.state?.pedido;

  const queryClient = useQueryClient();
  const { currentSessionId, isLoading: loadingSession } = useCaja();

  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  const [search, setSearch] = useState("");
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("all");

  // Cliente seleccionado (null = Público General)
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);

  // Tipo de comprobante (BOLETA/FACTURA)
  const [tipoComprobante, setTipoComprobante] = useState<'BOLETA' | 'FACTURA'>('BOLETA');

  // Condición de pago (CONTADO/CREDITO)
  const [condicionPago, setCondicionPago] = useState<CreateVentaCondicionPago>('CONTADO');

  // Monto a cuenta (solo para crédito)
  const [aCuenta, setACuenta] = useState<string>("");

  // Obtener datos del cliente seleccionado para validar RUC
  const { data: clienteData } = useGetApiClientesId(
    selectedClienteId ?? 0,
    { query: { enabled: !!selectedClienteId } }
  );

  // Obtener crédito disponible del cliente
  const { data: creditoData } = useQuery(
    getGetApiCobranzasClientesClienteIdCreditoDisponibleQueryOptions(
      selectedClienteId ?? 0,
      { query: { enabled: !!selectedClienteId && condicionPago === 'CREDITO' } }
    )
  );

  const [saving, setSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "yape">("efectivo");
  const [montoRecibido, setMontoRecibido] = useState<string>("");
  const [referenciaOperacion, setReferenciaOperacion] = useState<string>("");

  // Modales y sheets
  const [showMovimientos, setShowMovimientos] = useState(false);
  const [showCierre, setShowCierre] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Hooks para datos
  const { data: productosResponse, isLoading: loadingProductos, refetch: refetchProductos } = useGetApiProductos({ limit: 100 });
  const { data: categoriasResponse, isLoading: loadingCategorias } = useGetApiCategorias();
  const { mutateAsync: createVenta } = usePostApiVentas();

  const productos = productosResponse?.data ?? [];
  const categorias = categoriasResponse?.data ?? [];
  const loading = loadingProductos || loadingCategorias;

  useEffect(() => {
    if (!pedidoData || productos.length === 0) return;

    console.log("🔍 Preseleccionando cliente ID:", pedidoData.cliente.id);
    setSelectedClienteId(pedidoData.cliente.id);

    const carritoConvertido = pedidoData.detalles.map((d: any) => {
      const producto = productos.find((p) => p.id === d.producto_id);
      console.log("🔍 Buscando producto ID:", d.producto_id, "Encontrado:", producto);
      return {
        productoId: d.producto_id,
        nombre: producto?.nombre ?? "Producto",
        sku: producto?.sku ?? null,
        cantidad: d.cantidad,
        precioVenta: producto?.precio_venta ?? d.precio ?? 0,
        stockDisponible: producto?.stock ?? 0,
        unidadMedida: producto?.unidad_medida_id ?? null,
        permiteDecimales: false,
      };
    });

    setCarrito(carritoConvertido);
  }, [pedidoData, productos]);


  const filteredProductos = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (productos as ProductoConRelaciones[])
      .filter((p) => {
        const nombre = p.nombre ?? "";
        const sku = p.sku ?? "";
        const bySearch = s
          ? nombre.toLowerCase().includes(s) || sku.toLowerCase().includes(s)
          : true;
        const byCat = selectedCategoriaId === "all" ? true : p.categoria_id === Number(selectedCategoriaId);
        return bySearch && byCat;
      })
      .sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
  }, [productos, search, selectedCategoriaId]);

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
      toast.success(`${producto.nombre} añadido al carrito`);
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
      const ventaCreada = await createVenta({ data: payload });

      console.log('✅ Venta creada:', ventaCreada);

      queryClient.removeQueries({
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key.includes('/api/ventas');
        }
      });

      await queryClient.invalidateQueries({ queryKey: ['api', 'productos'] });

      toast.success("¡Venta registrada exitosamente!");

      console.log('🔄 Cache de ventas eliminado, historial debe recargar datos frescos');

      setCarrito([]);
      setMontoRecibido("");
      setReferenciaOperacion("");
      setACuenta("");
      setSelectedClienteId(null);
      setTipoComprobante('BOLETA');
      setCondicionPago('CONTADO');
      setShowCheckout(false); // Cerrar el sheet de checkout
      await refetchProductos();
    } catch (error) {
      if (isApiError(error) && error.response?.data?.requiere_accion === "APERTURA_SESION") {
        toast.error("Debes abrir una sesión de caja antes de registrar ventas");
      } else {
        toast.error(getErrorMessage(error, "Error al registrar la venta"));
      }
    } finally {
      setSaving(false);
    }
  }

  // Loading state
  if (loading || loadingSession) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando punto de venta...</p>
        </div>
      </div>
    );
  }

  // Componente de tarjeta de producto
  const ProductCard = ({ producto }: { producto: ProductoConRelaciones }) => {
    const sinStock = (producto.stock ?? 0) <= 0;

    return (
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-200 cursor-pointer",
          "hover:ring-2 hover:ring-primary/20 hover:shadow-lg",
          "border-border/50 bg-card !py-0 !gap-0",
          sinStock && "opacity-60 cursor-not-allowed"
        )}
        onClick={() => !sinStock && handleAddToCart(producto)}
      >
        {/* Imagen del Producto - aspect-[4/3] para menos altura */}
        <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center overflow-hidden relative">
          {producto.imagen_url ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre || ''}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <Package className="size-10 text-muted-foreground/30" />
          )}

          {/* Badge de stock */}
          {sinStock && (
            <Badge
              variant="destructive"
              className="absolute top-2 right-2 text-xs"
            >
              Sin stock
            </Badge>
          )}

          {/* Botón de agregar flotante */}
          <Button
            size="icon"
            className={cn(
              "absolute bottom-2 right-2 size-8 rounded-full shadow-lg",
              "opacity-0 translate-y-2 transition-all duration-200",
              "group-hover:opacity-100 group-hover:translate-y-0",
              sinStock && "hidden"
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(producto);
            }}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <CardContent className="p-3 space-y-1">
          {/* Nombre del Producto */}
          <h3 className="font-medium text-sm leading-tight line-clamp-2 min-h-[2.25rem]">
            {producto.nombre}
          </h3>

          {/* Precio y SKU */}
          <div className="flex items-end justify-between">
            <span className="text-base font-bold text-primary tabular-nums">
              {formatCurrency(producto.precio_venta ?? 0)}
            </span>
            {producto.sku && (
              <span className="text-[10px] text-muted-foreground font-mono uppercase">
                {producto.sku}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Componente de item del carrito
  const CartItem = ({ item, index }: { item: CarritoItem; index: number }) => (
    <div className={cn(
      "group relative py-3 px-1",
      index > 0 && "border-t border-border/50"
    )}>
      {/* Botón eliminar */}
      <Button
        size="icon"
        variant="ghost"
        className="absolute -right-1 top-2 size-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
        onClick={() => handleRemoveItem(item.productoId)}
      >
        <X className="size-4" />
      </Button>

      <div className="pr-8 space-y-2">
        {/* Nombre y precio unitario */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight line-clamp-2">
              {item.nombre}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatCurrency(item.precioVenta)} c/u
            </p>
          </div>
        </div>

        {/* Controles de cantidad y subtotal */}
        <div className="flex items-center justify-between gap-3">
          {/* Controles de cantidad */}
          <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-md hover:bg-background"
              onClick={() => handleDecrementCantidad(item.productoId)}
            >
              <Minus className="size-3.5" />
            </Button>
            <Input
              type="number"
              min={item.permiteDecimales ? 0.001 : 1}
              max={item.stockDisponible}
              step={item.permiteDecimales ? 0.001 : 1}
              value={item.cantidad}
              onChange={(e) => handleChangeCantidad(item.productoId, Number(e.target.value))}
              className="w-14 h-7 text-center text-sm font-medium border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-md hover:bg-background"
              onClick={() => handleIncrementCantidad(item.productoId)}
            >
              <Plus className="size-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground pl-1 pr-2">
              {item.unidadMedida || 'und'}
            </span>
          </div>

          {/* Subtotal */}
          <span className="font-semibold text-sm tabular-nums whitespace-nowrap">
            {formatCurrency(item.cantidad * item.precioVenta)}
          </span>
        </div>
      </div>
    </div>
  );

  // Componente de método de pago
  const PaymentMethodButton = ({
    method,
    icon: Icon,
    label
  }: {
    method: "efectivo" | "tarjeta" | "yape";
    icon: React.ElementType;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => setPaymentMethod(method)}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all",
        "hover:border-primary/50 hover:bg-primary/5",
        paymentMethod === method
          ? "border-primary bg-primary/10 text-primary"
          : "border-border/50 text-muted-foreground"
      )}
    >
      <Icon className="size-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

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

          {/* Container principal con CSS Grid - altura fija menos header */}
          <div
            className="pos-page h-[calc(100vh-var(--header-height,3.5rem))] overflow-hidden"
            style={{
              display: 'grid',
              gridTemplateColumns: `1fr minmax(${LAYOUT.CART_MIN_WIDTH}, ${LAYOUT.CART_MAX_WIDTH})`,
            }}
          >
            {/* ========== COLUMNA IZQUIERDA: PRODUCTOS ========== */}
            <div className="flex flex-col gap-4 min-h-0 overflow-hidden p-6">
              {/* Header con título y acciones */}
              <div className="flex items-center justify-between gap-4 flex-shrink-0">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Punto de Venta</h1>
                  <p className="text-sm text-muted-foreground">
                    Selecciona productos para agregar al carrito
                  </p>
                </div>

                <CreateProductDialog onCreated={() => void refetchProductos()}>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 size-4" />
                    Nuevo Producto
                  </Button>
                </CreateProductDialog>
              </div>

              {/* Barra de búsqueda y filtros */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
                {/* Búsqueda */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o SKU..."
                    className="pl-10 h-10"
                  />
                  {search && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
                      onClick={() => setSearch("")}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>

                {/* Filtro de categoría */}
                <Select value={selectedCategoriaId} onValueChange={setSelectedCategoriaId}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grid de productos */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full pr-2">
                  <div
                    className="grid gap-3 pb-4"
                    style={{
                      gridTemplateColumns: `repeat(auto-fill, minmax(${LAYOUT.PRODUCT_CARD_MIN}, 1fr))`,
                    }}
                  >
                    {filteredProductos.map((p) => (
                      <ProductCard key={p.id} producto={p} />
                    ))}
                  </div>

                  {/* Estado vacío */}
                  {filteredProductos.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Package className="size-16 text-muted-foreground/20 mb-4" />
                      <h3 className="font-medium text-lg">No se encontraron productos</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {search ? "Intenta con otro término de búsqueda" : "Agrega productos para empezar"}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            {/* ========== COLUMNA DERECHA: CARRITO Y PAGO ========== */}
            <Card className="relative flex flex-col overflow-hidden border-l border-t-0 border-r-0 border-b-0 bg-card !py-0 !gap-0 !rounded-none">
              {/* Header del carrito */}
              <div className="flex items-center justify-between gap-2 p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-5" />
                  <span className="font-semibold">Carrito</span>
                  {carrito.length > 0 && (
                    <Badge variant="secondary" className="tabular-nums">
                      {carrito.length} {carrito.length === 1 ? 'item' : 'items'}
                    </Badge>
                  )}
                </div>

                {/* Acciones de sesión */}
                {currentSessionId && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowMovimientos(true)}
                      className="h-8 text-xs gap-1.5"
                    >
                      <ArrowRightLeft className="size-3.5" />
                      <span className="hidden sm:inline">Movimientos</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowCierre(true)}
                      className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="size-3.5" />
                      <span className="hidden sm:inline">Cerrar</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Selector de cliente, comprobante y condición de pago */}
              <div className="p-4 border-b space-y-2">
                {/* Fila 1: Cliente - siempre ancho completo */}
                <div className="w-full">
                  <ClientSelector
                    value={selectedClienteId}
                    clienteSeleccionado={clienteData ?? null}
                    onChange={(clienteId) => {
                      setSelectedClienteId(clienteId);
                      setTipoComprobante('BOLETA');
                      setCondicionPago('CONTADO');
                      setACuenta("");
                    }}
                    disabled={saving}
                  />
                </div>

                {/* Fila 2: Comprobante + Condición (solo si aplica alguno) */}
                {((clienteData?.ruc || clienteData?.documento_identidad?.match(/^[0-9]{11}$/)) || tieneLineaCredito) && (
                  <div className="flex items-center gap-2">
                    {/* Tipo de Comprobante - solo si tiene RUC */}
                    {(clienteData?.ruc || clienteData?.documento_identidad?.match(/^[0-9]{11}$/)) && (
                      <div className="flex-1">
                        <Select
                          value={tipoComprobante}
                          onValueChange={(v) => setTipoComprobante(v as 'BOLETA' | 'FACTURA')}
                          disabled={saving}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BOLETA">Boleta</SelectItem>
                            <SelectItem value="FACTURA">Factura</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Condición de Pago - SOLO si tiene línea de crédito */}
                    {tieneLineaCredito && (
                      <div className="flex-1">
                        <Select
                          value={condicionPago}
                          onValueChange={(v) => {
                            setCondicionPago(v as CreateVentaCondicionPago);
                            setACuenta("");
                            if (v === 'CONTADO') setMontoRecibido("");
                          }}
                          disabled={saving}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CONTADO">Contado</SelectItem>
                            <SelectItem value="CREDITO">Crédito</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {/* Info de Crédito - solo si está en crédito */}
                {condicionPago === 'CREDITO' && tieneLineaCredito && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50 p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-600 dark:text-blue-400">Límite:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {formatCurrency(clienteData?.limite_credito ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-600 dark:text-blue-400">Disponible:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {formatCurrency(creditoDisponible)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-600 dark:text-blue-400">Días:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {clienteData?.dias_credito ?? 0} días
                      </span>
                    </div>
                    {excedeLimiteCredito && (
                      <p className="text-xs text-destructive font-medium pt-1 border-t border-blue-200 dark:border-blue-800/50">
                        ⚠️ Excede el crédito disponible
                      </p>
                    )}
                  </div>
                )}

                {condicionPago === 'CREDITO' && !tieneLineaCredito && (
                  <p className="text-xs text-muted-foreground italic">
                    Cliente sin línea de crédito habilitada
                  </p>
                )}
              </div>

              {/* Lista del Carrito */}
              <ScrollArea className="flex-1 min-h-0">
                {carrito.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full">
                    <div className="rounded-full bg-muted/50 p-4 mb-4">
                      <ShoppingCart className="size-10 text-muted-foreground/30" />
                    </div>
                    <h3 className="font-medium">Carrito vacío</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Haz clic en un producto para agregarlo
                    </p>
                  </div>
                ) : (
                  <div className="px-4">
                    {carrito.map((item, index) => (
                      <CartItem key={item.productoId} item={item} index={index} />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Footer: Total y Botón Cobrar */}
              <div className="border-t bg-muted/20 p-4 space-y-3 shrink-0">
                {/* Total */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Total
                    </p>
                    <p className="text-2xl font-bold text-primary tabular-nums">
                      {formatCurrency(total)}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}
                  </div>
                </div>

                {/* Botón Cobrar - abre el panel de checkout */}
                <Button
                  size="lg"
                  className="w-full h-12 text-base font-semibold gap-2"
                  onClick={() => setShowCheckout(true)}
                  disabled={carrito.length === 0 || excedeLimiteCredito}
                >
                  <DollarSign className="size-5" />
                  Cobrar {formatCurrency(total)}
                </Button>
              </div>

              {/* Panel de Checkout (slide-up desde abajo, altura auto) */}
              {showCheckout && (
                <div className="absolute inset-x-0 bottom-0 z-50 flex flex-col bg-background border-t shadow-lg rounded-t-xl animate-in fade-in-0 slide-in-from-bottom-4 duration-200 max-h-[85%]">
                  {/* Header del checkout */}
                  <div className="flex items-center justify-between p-4 border-b bg-muted/30 shrink-0 rounded-t-xl">
                    <div>
                      <h3 className="font-semibold text-lg">Finalizar Venta</h3>
                      <p className="text-sm text-muted-foreground">
                        Total: <span className="font-bold text-primary">{formatCurrency(total)}</span>
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowCheckout(false)}
                      className="size-8"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>

                  {/* Contenido del checkout - overflow auto solo si necesita */}
                  <div className="overflow-y-auto">
                    <div className="p-4 space-y-4">
                      {/* Pago a Cuenta (solo CRÉDITO) */}
                      {condicionPago === 'CREDITO' && (
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">
                            Pago a cuenta (opcional)
                          </Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            max={total}
                            placeholder="0.00"
                            value={aCuenta}
                            onChange={(e) => setACuenta(e.target.value)}
                            className="h-10"
                          />
                          {montoACuenta > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Saldo a crédito: <span className="font-medium">{formatCurrency(saldoCredito)}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Método de Pago */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Método de pago
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          <PaymentMethodButton method="efectivo" icon={Banknote} label="Efectivo" />
                          <PaymentMethodButton method="tarjeta" icon={CreditCard} label="Tarjeta" />
                          <PaymentMethodButton method="yape" icon={Smartphone} label="Yape" />
                        </div>
                      </div>

                      {/* Referencia de operación (tarjeta/yape) */}
                      {paymentMethod !== "efectivo" && (
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">
                            Nro. de operación
                          </Label>
                          <Input
                            type="text"
                            placeholder="Ej: 123456789"
                            value={referenciaOperacion}
                            onChange={(e) => setReferenciaOperacion(e.target.value)}
                            className="h-10"
                          />
                        </div>
                      )}

                      {/* Monto recibido y vuelto (efectivo) */}
                      {paymentMethod === "efectivo" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">
                              Monto recibido
                            </Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={montoRecibido}
                              onChange={(e) => setMontoRecibido(e.target.value)}
                              className="h-10 text-lg font-medium"
                              autoFocus
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">
                              {faltaDinero ? "Falta" : "Vuelto"}
                            </Label>
                            <div className={cn(
                              "h-10 flex items-center justify-center rounded-md border text-lg font-bold tabular-nums",
                              faltaDinero
                                ? "bg-destructive/10 border-destructive/30 text-destructive"
                                : "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400"
                            )}>
                              {formatCurrency(Math.abs(vuelto))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer del checkout */}
                  <div className="p-4 border-t bg-muted/20 shrink-0 space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 h-11"
                        onClick={() => setShowCheckout(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="lg"
                        className="flex-1 h-11 text-base font-semibold gap-2"
                        onClick={() => {
                          handleRegistrarVenta();
                        }}
                        disabled={
                          saving ||
                          (condicionPago === 'CONTADO' && paymentMethod === "efectivo" && recibido < total)
                        }
                      >
                        {saving ? (
                          <>
                            <Loader2 className="size-5 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <DollarSign className="size-5" />
                            Confirmar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
