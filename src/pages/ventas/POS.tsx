import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShoppingCart, DollarSign, Plus, Minus, Search, X, Package } from "lucide-react";

import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useGetApiProductos } from "@/api/generated/productos/productos";
import { useGetApiCategorias } from "@/api/generated/categorías/categorías";
import { usePostApiVentas } from "@/api/generated/ventas-pos/ventas-pos";
import { useGetApiClientesId } from "@/api/generated/clientes/clientes";
import { getGetApiCobranzasClientesClienteIdCreditoDisponibleQueryOptions } from "@/api/generated/cobranzas/cobranzas";
import type { Producto, CreateVentaCondicionPago } from "@/api/generated/model";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import CreateProductDialog from "@/components/CreateProductDialog";
import ClientSelector from "@/components/ClientSelector";
import { useQueryClient } from "@tanstack/react-query";
import { useCaja } from "@/context/CajaContext";
import { AperturaCajaModal } from "@/components/AperturaCajaModal";
import { useNavigate } from "react-router-dom";
import { MovimientosCajaModal } from "@/components/MovimientosCajaModal";
import { CierreCajaModal } from "@/components/CierreCajaModal";

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
  
  // Modales de caja
  const [showMovimientos, setShowMovimientos] = useState(false);
  const [showCierre, setShowCierre] = useState(false);

  // Hooks para datos
  const { data: productosResponse, isLoading: loadingProductos, refetch: refetchProductos } = useGetApiProductos({ limit: 100 });
  const { data: categoriasResponse, isLoading: loadingCategorias } = useGetApiCategorias();
  const { mutateAsync: createVenta } = usePostApiVentas();

  const productos = productosResponse?.data ?? [];
  const categorias = categoriasResponse?.data ?? [];
  const loading = loadingProductos || loadingCategorias;

  useEffect(() => {
  if (!pedidoData || productos.length === 0) return;

  // 1. Preseleccionar cliente

  console.log("🔍 Preseleccionando cliente ID:", pedidoData.cliente.id);
  setSelectedClienteId(pedidoData.cliente.id);



  // 2. Convertir detalles → carrito
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

  // 3. Cargar carrito completo
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
      
      // FORZAR limpieza total del cache de ventas
      queryClient.removeQueries({ 
        predicate: (query) => {
          const key = query.queryKey as string[];
          return key.includes('/api/ventas');
        }
      });
      
      // Invalidar productos (para actualizar stock)
      await queryClient.invalidateQueries({ queryKey: ['api', 'productos'] });
      
      toast.success("¡Venta registrada exitosamente!");
      
      // Log para debugging
      console.log('🔄 Cache de ventas eliminado, historial debe recargar datos frescos');
      
      setCarrito([]);
      setMontoRecibido("");
      setReferenciaOperacion("");
      setACuenta("");
      setSelectedClienteId(null);
      setTipoComprobante('BOLETA');
      setCondicionPago('CONTADO');
      await refetchProductos();
    } catch (err: any) {
      if (err?.response?.data?.requiere_accion === "APERTURA_SESION") {
        toast.error("Debes abrir una sesión de caja antes de registrar ventas");
      } else {
        const message = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Error al registrar la venta";
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  }

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
        
          <div className="h-[calc(100vh-var(--header-height)-3rem)] px-3 md:px-4 lg:px-6 py-3 md:py-4">
        {/* Layout principal con 2 columnas */}
        <div className="flex gap-3 md:gap-4 lg:gap-6 h-full">
          {/* Columna Izquierda: Título + Búsqueda + Productos */}
          <div className="flex-1 flex flex-col gap-3 md:gap-4 min-h-0">
            {/* Título */}
            <h1 className="text-xl md:text-2xl font-semibold flex-shrink-0">Punto de Venta</h1>

            {/* Barra de Búsqueda y Filtros */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o SKU"
                    className="pl-9"
                  />
                </div>
                
                {/* Categorías como Select */}
                <Select value={selectedCategoriaId} onValueChange={setSelectedCategoriaId}>
                  <SelectTrigger className="w-[140px] md:w-[160px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <CreateProductDialog onCreated={() => void refetchProductos()}>
                  <Button>
                    <Plus className="mr-2 size-4" /> Nuevo
                  </Button>
                </CreateProductDialog>
              </div>
            </div>

            {/* Grid de Productos */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-4 pb-4">
                {filteredProductos.map((p) => (
                  <Card 
                    key={p.id} 
                    className="group overflow-hidden hover:shadow-md hover:border-primary/30 transition-transform cursor-pointer border-border/40 rounded-md"
                    onClick={() => handleAddToCart(p)}
                  >
                    {/* Imagen del Producto - Sin padding */}
                    <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                      {p.imagen_url ? (
                        <img 
                          src={p.imagen_url} 
                          alt={p.nombre || ''} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Package className="size-10 text-muted-foreground/50" />
                      )}
                    </div>

                    <CardContent className="p-3 space-y-2">
                      {/* Nombre del Producto */}
                      <h3 className="font-medium text-sm line-clamp-2 leading-tight min-h-[2.25rem]">
                        {p.nombre}
                      </h3>
                      
                      {/* Precio */}
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-primary tabular-nums">
                          {formatCurrency(p.precio_venta ?? 0)}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(p);
                          }}
                          disabled={(p.stock ?? 0) <= 0}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredProductos.length === 0 && (
                  <div className="col-span-full text-center py-16 text-muted-foreground">
                    <Package className="size-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No se encontraron productos</p>
                    <p className="text-sm">Intenta con otros filtros</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Columna Derecha: Carrito - ocupa toda la altura */}
        <div className="w-[320px] md:w-[380px] lg:w-[420px] flex-shrink-0">
          {/* PANEL DERECHO: Carrito y Pago */}
          <Card className="h-full flex flex-col border-border/40 rounded-lg">
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Header inline */}
              <div className="p-3 md:p-4 border-b bg-muted/30 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-5" />
                  <span className="font-semibold">Carrito</span>
                  <Badge variant="secondary">
                    {carrito.length}
                  </Badge>
                </div>
                {/* Botones de sesión compactos */}
                {currentSessionId && (
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setShowMovimientos(true)}
                      className="h-7 text-xs"
                    >
                      Movimientos
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setShowCierre(true)}
                      className="h-7 text-xs text-destructive hover:text-destructive"
                    >
                      Cerrar Turno
                    </Button>
                  </div>
                )}
              </div>
              {/* Cliente Selector */}
              <div className="p-3 md:p-4 border-b space-y-3">
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
                
                {/* Tipo de Comprobante */}
                {(clienteData?.ruc || clienteData?.documento_identidad?.match(/^[0-9]{11}$/)) && (
                  <div className="flex items-center gap-2">
                    <Badge variant={tipoComprobante === 'BOLETA' ? 'default' : 'outline'}>
                      BOLETA
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTipoComprobante(tipoComprobante === 'BOLETA' ? 'FACTURA' : 'BOLETA')}
                      disabled={saving}
                    >
                      Cambiar a {tipoComprobante === 'BOLETA' ? 'FACTURA' : 'BOLETA'}
                    </Button>
                  </div>
                )}
                
                {/* Condición de Pago */}
                {selectedClienteId && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Condición de Pago</Label>
                    <RadioGroup
                      value={condicionPago}
                      onValueChange={(value) => {
                        setCondicionPago(value as CreateVentaCondicionPago);
                        setACuenta("");
                        if (value === 'CONTADO') {
                          setMontoRecibido("");
                        }
                      }}
                      disabled={saving}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="CONTADO" id="contado" />
                        <Label htmlFor="contado" className="cursor-pointer font-normal">Contado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="CREDITO" 
                          id="credito" 
                          disabled={!tieneLineaCredito}
                        />
                        <Label 
                          htmlFor="credito" 
                          className={`cursor-pointer font-normal ${!tieneLineaCredito ? 'text-muted-foreground' : ''}`}
                        >
                          Crédito
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    {/* Info de Crédito */}
                    {condicionPago === 'CREDITO' && tieneLineaCredito && (
                      <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-2.5 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-blue-700 dark:text-blue-300">Límite de Crédito:</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">
                            {formatCurrency(clienteData?.limite_credito ?? 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-blue-700 dark:text-blue-300">Crédito Disponible:</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">
                            {formatCurrency(creditoDisponible)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-blue-700 dark:text-blue-300">Días de Crédito:</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">
                            {clienteData?.dias_credito ?? 0} días
                          </span>
                        </div>
                        {excedeLimiteCredito && (
                          <div className="pt-1 border-t border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-destructive font-medium">
                              ⚠️ El saldo excede el crédito disponible
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {condicionPago === 'CREDITO' && !tieneLineaCredito && (
                      <p className="text-xs text-muted-foreground">
                        Este cliente no tiene línea de crédito habilitada
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Lista del Carrito */}
              <ScrollArea className="flex-1 min-h-0">
                {carrito.length === 0 ? (
                  <div className="text-center py-8 md:py-12 text-muted-foreground px-4">
                    <ShoppingCart className="size-12 md:size-16 mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-sm md:text-base">Carrito vacío</p>
                    <p className="text-xs md:text-sm">Añade productos para comenzar</p>
                  </div>
                ) : (
                  <div className="px-3 md:px-4 py-2">
                    {carrito.map((item, index) => (
                      <div key={item.productoId}>
                        {index > 0 && <Separator className="my-1.5" />}
                        <div className="relative py-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-0 top-1.5 size-5 p-0 hover:bg-destructive/10"
                            onClick={() => handleRemoveItem(item.productoId)}
                          >
                            <X className="size-3 text-destructive" />
                          </Button>

                          <div className="pr-7 space-y-1">
                            {/* Nombre y Precio en la misma línea */}
                            <div className="flex items-baseline justify-between gap-2">
                              <h4 className="font-semibold text-sm leading-tight line-clamp-1 flex-1">
                                {item.nombre}
                              </h4>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatCurrency(item.precioVenta)}
                              </span>
                            </div>

                            {/* Controles en una sola fila */}
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
                                <span className="text-xs text-muted-foreground ml-0.5">
                                  {item.unidadMedida || 'und'}
                                </span>
                              </div>

                              {/* Subtotal */}
                              <div className="text-sm font-bold tabular-nums">
                                {formatCurrency(item.cantidad * item.precioVenta)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              {/* Footer: Total y Pago Optimizado */}
              <div className="p-3 md:p-4 space-y-2.5 bg-muted/30">
                {/* Total Grande */}
                <div className="text-center py-2">
                  <div className="text-xs text-muted-foreground mb-0.5">Total a pagar</div>
                  <div className="text-3xl md:text-4xl font-bold text-primary tabular-nums">
                    {formatCurrency(total)}
                  </div>
                </div>

                {/* Pago a Cuenta (solo para CRÉDITO) */}
                {condicionPago === 'CREDITO' && (
                  <div>
                    <label className="text-xs text-muted-foreground">Pago a Cuenta (opcional)</label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      max={total}
                      placeholder="0.00"
                      value={aCuenta}
                      onChange={(e) => setACuenta(e.target.value)}
                      className="h-9 text-sm font-medium"
                    />
                    {montoACuenta > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Saldo a crédito: {formatCurrency(saldoCredito)}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Método de Pago - Tabs oficiales shadcn */}
                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "efectivo" | "tarjeta" | "yape")}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="efectivo">Efectivo</TabsTrigger>
                    <TabsTrigger value="tarjeta">Tarjeta</TabsTrigger>
                    <TabsTrigger value="yape">Yape</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Nro. Operación (si NO es efectivo) */}
                {paymentMethod !== "efectivo" && (
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Nro. Operación / Referencia
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: 123456789"
                      value={referenciaOperacion}
                      onChange={(e) => setReferenciaOperacion(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                )}

                {/* Paga con / Vuelto (solo efectivo) - Inline */}
                {paymentMethod === "efectivo" && (
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Recibe</label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={montoRecibido}
                        onChange={(e) => setMontoRecibido(e.target.value)}
                        className="h-9 text-sm font-medium"
                        autoFocus
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">
                        {faltaDinero ? "Falta" : "Vuelto"}
                      </label>
                      <div className={`h-9 flex items-center justify-end px-3 rounded-md border ${
                        faltaDinero 
                          ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                      }`}>
                        <span className="text-sm font-bold tabular-nums">
                          {formatCurrency(Math.abs(vuelto))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón de Acción Principal - Cobrar */}
                <Button
                  variant="default"
                  size="lg"
                  className="w-full font-semibold h-11"
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
                      Procesando
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 size-5" />
                      Cobrar {paymentMethod === "efectivo" && !faltaDinero && recibido > 0 ? `· ${formatCurrency(vuelto)} vuelto` : ''}
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
