"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useGetApiPedidosId } from "@/api/generated/pedidos/pedidos";
import { getApiProductosId } from "@/api/generated/productos/productos";
import type { Producto } from "@/api/generated/model";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";


interface DetallePedidoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: number | null;
}

export default function DetallePedidoSheet({
  open,
  onOpenChange,
  pedidoId,
}: DetallePedidoSheetProps) {

  const { data: pedido, isLoading } = useGetApiPedidosId(pedidoId!, {
    query: { enabled: Boolean(pedidoId) },
  });

  // 🟡 Estado donde guardo los detalles con precios
  const [detallesConPrecios, setDetallesConPrecios] = useState<any[]>([]);

  // ----------------------------------------------------
  // 🔥 Paso 1: cuando el pedido llega -> cargar precios
  // ----------------------------------------------------
  useEffect(() => {
    if (!pedido?.detalles?.length) return;

    const ac = new AbortController();
    let mounted = true;

    (async () => {
      try {
        const responses = await Promise.all(
          pedido.detalles!.map((det) =>
            getApiProductosId(det.producto_id, undefined, ac.signal)
          )
        );

        if (!mounted) return;

        // getApiProductosId retorna directamente Producto
        const productos: Producto[] = responses;

        const detalles = pedido.detalles!.map((det, i) => {
          const prod = productos[i];
          const precio = prod?.precio_venta ? Number(prod.precio_venta) : 0;

          return {
            id: det.id,
            producto_id: det.producto_id,
            nombre: det.producto?.nombre ?? prod?.nombre ?? '',
            cantidad: Number(det.cantidad),
            precio,
            subtotal: precio * Number(det.cantidad),
          };
        });

        setDetallesConPrecios(detalles);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") console.error(error);
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [pedido]);

  // ----------------------------------------------------
  // 🔥 Total general
  // ----------------------------------------------------
  const totalGeneral = detallesConPrecios.reduce(
    (sum, d) => sum + d.subtotal,
    0
  );

  if (!pedidoId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[450px] sm:w-[500px] p-4 gap-0">
        <SheetHeader className="p-0">
          <SheetTitle>Pedido #{pedidoId}</SheetTitle>
          <SheetDescription>Detalles completos del pedido</SheetDescription>
        </SheetHeader>

        {isLoading && (
          <p className="text-muted-foreground mt-4">Cargando pedido...</p>
        )}

        {!isLoading && pedido && (
          <div className="mt-4 space-y-6">
            {/* Cliente */}
            <div>
              <h3 className="font-semibold text-lg">Cliente</h3>
              <p className="text-sm text-muted-foreground">
                {pedido.cliente?.nombre}
              </p>
            </div>

            <Separator />

            {/* Info general */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo de recojo</p>
                <p className="font-medium capitalize">{pedido.tipo_recojo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>

                <Badge
                  variant={
                    pedido.estado === "pendiente" ? "secondary" :
                      pedido.estado === "confirmado" ? "default" :
                        pedido.estado === "cancelado" ? "destructive" :
                          "secondary"
                  }
                  className={
                    pedido.estado === "entregado"
                      ? "bg-blue-500 text-white dark:bg-blue-600 capitalize"
                      : "capitalize"
                  }
                >
                  {pedido.estado}
                </Badge>
              </div>

            </div>

            <Separator />

            {/* Productos */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Productos</h3>

              <div className="space-y-3">
                {detallesConPrecios.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">{item.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        Cant.: {item.cantidad}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm">S/ {item.precio.toFixed(2)}</p>
                      <p className="font-semibold">
                        S/ {item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>S/ {totalGeneral.toFixed(2)}</span>
            </div>

            <Separator />


          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
