// Página de creación de nueva orden de compra con información fiscal
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProveedorFiscalSelector } from "@/components/ProveedorFiscalSelector";
import { ProductSearchSelector } from "@/components/ProductSearchSelector";
import { usePostApiCompras } from "@/api/generated/órdenes-de-compra/órdenes-de-compra";
import { usePurchaseOrderCalculator, formatCurrency } from "@/hooks/usePurchaseOrderCalculator";
import type { Proveedor, Producto } from "@/api/generated/model";
import type { OrdenCompraDetalleItem } from "@/hooks/usePurchaseOrderCalculator";

const NuevaOrdenCompraPage = () => {
  const navigate = useNavigate();
  
  // Estados del formulario - Información fiscal
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [tipoComprobante, setTipoComprobante] = useState<string>("FACTURA");
  const [serie, setSerie] = useState<string>("");
  const [numero, setNumero] = useState<string>("");
  const [fechaEmision, setFechaEmision] = useState<string>(new Date().toISOString().split("T")[0]);
  
  // Estados para agregar productos
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState<string>("");
  const [costoUnitario, setCostoUnitario] = useState<string>("");
  
  // Carrito de compra
  const [items, setItems] = useState<OrdenCompraDetalleItem[]>([]);
  
  // Calcular totales con IGV usando el hook
  const { subtotal_base, impuesto_igv, total, detalles } = usePurchaseOrderCalculator(items);
  
  // Referencias para navegación con teclado
  const cantidadRef = useRef<HTMLInputElement>(null);
  const costoRef = useRef<HTMLInputElement>(null);
  const productoRef = useRef<HTMLInputElement>(null);
  
  // Mutation para crear orden
  const { mutate: createOrden, isPending } = usePostApiCompras({
    mutation: {
      onSuccess: (data) => {
        toast.success(`Orden de compra #${data.id} creada correctamente`);
        navigate("/dashboard/compras");
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || error?.message || "Error al crear orden de compra";
        toast.error(message);
      },
    },
  });

  // Auto-fill del costo cuando se selecciona un producto
  useEffect(() => {
    if (selectedProducto && selectedProducto.costo_compra) {
      setCostoUnitario(String(selectedProducto.costo_compra));
      setTimeout(() => cantidadRef.current?.focus(), 50);
    } else if (selectedProducto) {
      setCostoUnitario("");
      setTimeout(() => cantidadRef.current?.focus(), 50);
    }
  }, [selectedProducto]);

  // Función para agregar producto al carrito
  const handleAgregarProducto = () => {
    if (!selectedProducto) {
      toast.error("Selecciona un producto");
      return;
    }

    const cantidadNum = parseFloat(cantidad);
    const costoNum = parseFloat(costoUnitario);

    // Validaciones
    if (!cantidad || cantidadNum <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      cantidadRef.current?.focus();
      return;
    }

    if (!costoUnitario || costoNum <= 0) {
      toast.error("El costo unitario debe ser mayor a 0");
      costoRef.current?.focus();
      return;
    }

    // Verificar si el producto ya está en el carrito
    const existingIndex = items.findIndex(item => item.producto_id === selectedProducto.id);
    
    if (existingIndex >= 0) {
      // Actualizar cantidad del producto existente
      const updatedItems = [...items];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        cantidad: updatedItems[existingIndex].cantidad + cantidadNum,
      };
      setItems(updatedItems);
      toast.success("Cantidad actualizada en el carrito");
    } else {
      // Agregar nuevo item
      const nuevoItem: OrdenCompraDetalleItem = {
        producto_id: selectedProducto.id,
        producto_nombre: selectedProducto.nombre,
        cantidad: cantidadNum,
        costo_unitario: costoNum,
      };
      setItems([...items, nuevoItem]);
      toast.success("Producto agregado al carrito");
    }

    // Limpiar campos y enfocar de nuevo en búsqueda de producto
    setSelectedProducto(null);
    setCantidad("");
    setCostoUnitario("");
    setTimeout(() => productoRef.current?.focus(), 50);
  };

  // Función para eliminar item del carrito
  const handleEliminarItem = (productoId: number) => {
    const updatedItems = items.filter(item => item.producto_id !== productoId);
    setItems(updatedItems);
    toast.success("Producto eliminado del carrito");
  };

  // Función para guardar la orden
  const handleGuardarOrden = () => {
    // Validaciones
    if (items.length === 0) {
      toast.error("Debes agregar al menos un producto a la orden");
      return;
    }

    if (!selectedProveedor) {
      toast.error("Debes seleccionar un proveedor");
      return;
    }

    if (tipoComprobante === 'FACTURA' && selectedProveedor.tipo_documento !== 'RUC') {
      toast.error("Para emitir FACTURA, el proveedor debe tener RUC");
      return;
    }

    // Convertir fecha a ISO datetime si existe
    let fechaISO: string | undefined = undefined;
    if (fechaEmision) {
      const fecha = new Date(fechaEmision + 'T00:00:00');
      fechaISO = fecha.toISOString();
    }

    const payload = {
      proveedor_id: selectedProveedor.id,
      tipo_comprobante: tipoComprobante as any,
      serie: serie || undefined,
      numero: numero || undefined,
      fecha_emision: fechaISO,
      detalles: items.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario,
      })),
    };

    createOrden({ data: payload });
  };

  // Handle Enter en inputs
  const handleKeyDown = (e: React.KeyboardEvent, nextAction: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextAction();
    }
  };

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nueva Orden de Compra</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea una orden de compra de mercadería con información fiscal
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard/compras")}>
          Cancelar
        </Button>
      </div>

      {/* Sección: Información del Proveedor y Comprobante */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Proveedor y Comprobante</CardTitle>
              <CardDescription className="text-xs mt-1">Serie y número opcionales (se pueden ingresar al recibir)</CardDescription>
            </div>
            {selectedProveedor && (
              <Badge variant="outline" className="font-normal">
                {selectedProveedor.tipo_documento}: {selectedProveedor.ruc_identidad}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Proveedor - ocupa 2 columnas */}
            <div className="space-y-2 md:col-span-2">
              <Label>Proveedor *</Label>
              <ProveedorFiscalSelector
                value={selectedProveedor?.id}
                onValueChange={setSelectedProveedor}
                tipoComprobanteRequerido={tipoComprobante as any}
                disabled={isPending}
                required={true}
              />
            </div>

            {/* Tipo de Comprobante */}
            <div className="space-y-2">
              <Label htmlFor="tipo_comprobante">Tipo</Label>
              <Select value={tipoComprobante} onValueChange={setTipoComprobante}>
                <SelectTrigger id="tipo_comprobante">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FACTURA">Factura</SelectItem>
                  <SelectItem value="BOLETA">Boleta</SelectItem>
                  <SelectItem value="GUIA">Guía</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Serie */}
            <div className="space-y-2">
              <Label htmlFor="serie">Serie</Label>
              <Input
                id="serie"
                placeholder="F001"
                value={serie}
                onChange={(e) => setSerie(e.target.value.toUpperCase())}
                maxLength={10}
                disabled={isPending}
              />
            </div>

            {/* Número */}
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                placeholder="000001"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                maxLength={20}
                disabled={isPending}
              />
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección: Agregar Productos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Agregar Productos</CardTitle>
              <CardDescription className="text-xs mt-1">Precios con IGV (18%) incluido</CardDescription>
            </div>
            {selectedProducto && (
              <Badge variant="secondary" className="font-normal">
                Stock: {Number(selectedProducto.stock).toFixed(3)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Buscador de Producto */}
            <div className="md:col-span-5 space-y-2">
              <Label>Producto</Label>
              <ProductSearchSelector
                selected={selectedProducto}
                onSelect={setSelectedProducto}
                placeholder="Buscar por nombre o SKU..."
                disabled={isPending}
              />
              <input ref={productoRef} className="sr-only" />
            </div>

            {/* Cantidad */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                ref={cantidadRef}
                id="cantidad"
                type="number"
                step="0.001"
                min="0"
                placeholder="10"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, () => costoRef.current?.focus())}
                disabled={!selectedProducto || isPending}
              />
            </div>

            {/* Costo Unitario (con IGV) */}
            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="costo">Costo c/IGV</Label>
              <Input
                ref={costoRef}
                id="costo"
                type="number"
                step="0.01"
                min="0"
                placeholder="15.50"
                value={costoUnitario}
                onChange={(e) => setCostoUnitario(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleAgregarProducto)}
                disabled={!selectedProducto || isPending}
              />
            </div>

            {/* Botón Agregar */}
            <div className="md:col-span-2 space-y-2">
              <Label className="invisible">Acción</Label>
              <Button
                onClick={handleAgregarProducto}
                disabled={!selectedProducto || isPending}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección: Carrito de Compra */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Productos en la Orden
            </CardTitle>
            <Badge variant="outline">{items.length} {items.length === 1 ? 'producto' : 'productos'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay productos en la orden</p>
              <p className="text-sm mt-1">Usa el buscador de arriba para agregar productos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tabla de productos */}
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Producto</th>
                      <th className="text-left p-3 font-medium text-sm">Cantidad</th>
                      <th className="text-left p-3 font-medium text-sm">Costo Unit.</th>
                      <th className="text-left p-3 font-medium text-sm">Base</th>
                      <th className="text-left p-3 font-medium text-sm">IGV</th>
                      <th className="text-left p-3 font-medium text-sm">Subtotal</th>
                      <th className="text-center p-3 font-medium text-sm w-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((detalle) => (
                      <tr key={detalle.producto_id} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium">{detalle.producto_nombre}</div>
                        </td>
                        <td className="p-3 text-left tabular-nums">
                          {detalle.cantidad.toFixed(3).replace(/\.\?0+$/, '')}
                        </td>
                        <td className="p-3 text-left tabular-nums">
                          {formatCurrency(detalle.costo_unitario_total)}
                        </td>
                        <td className="p-3 text-left tabular-nums text-muted-foreground text-sm">
                          {formatCurrency(detalle.costo_unitario_base * detalle.cantidad)}
                        </td>
                        <td className="p-3 text-left tabular-nums text-muted-foreground text-sm">
                          {formatCurrency(detalle.igv_linea)}
                        </td>
                        <td className="p-3 text-left font-medium tabular-nums">
                          {formatCurrency(detalle.subtotal_linea)}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEliminarItem(detalle.producto_id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen fiscal */}
              <div className="pt-4 border-t">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Estado: <Badge variant="secondary">Pendiente</Badge></p>
                    <p className="text-xs">El stock se actualizará al recibir la mercadería</p>
                    {!serie || !numero ? (
                      <p className="text-xs text-amber-600">
                        ⚠️ Serie y número se pueden ingresar al recibir
                      </p>
                    ) : null}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Desglose compacto */}
                    <div className="text-right space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Base: {formatCurrency(subtotal_base)} + IGV: {formatCurrency(impuesto_igv)}
                      </div>
                      <div className="text-2xl font-bold tabular-nums">
                        {formatCurrency(total)}
                      </div>
                    </div>

                    <Separator orientation="vertical" className="h-12" />

                    <Button
                      size="lg"
                      onClick={handleGuardarOrden}
                      disabled={items.length === 0 || isPending || !selectedProveedor}
                      className="min-w-[200px]"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Generar Orden
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NuevaOrdenCompraPage;
