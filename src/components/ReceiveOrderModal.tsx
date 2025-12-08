import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Package, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePostApiComprasIdRecibir } from "@/api/generated/órdenes-de-compra/órdenes-de-compra";
import { formatCurrency } from "@/hooks/usePurchaseOrderCalculator";
import type { OrdenCompra } from "@/api/generated/model";

interface ReceiveOrderModalProps {
  orden: OrdenCompra | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal para recibir mercadería de una orden de compra
 * Solicita datos fiscales obligatorios: serie, número, fecha de recepción
 */
export function ReceiveOrderModal({
  orden,
  open,
  onClose,
  onSuccess,
}: ReceiveOrderModalProps) {
  // Estados del formulario
  const [serie, setSerie] = useState<string>("");
  const [numero, setNumero] = useState<string>("");
  const [fechaRecepcion, setFechaRecepcion] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Resetear formulario cuando cambie la orden
  useEffect(() => {
    if (orden) {
      // Pre-fill con datos existentes si los tiene
      setSerie(orden.serie || "");
      setNumero(orden.numero || "");
      setFechaRecepcion(new Date().toISOString().split("T")[0]);
    }
  }, [orden]);

  // Mutation para recibir orden
  const { mutate: recibirOrden, isPending } = usePostApiComprasIdRecibir({
    mutation: {
      onSuccess: () => {
        toast.success("Mercadería recibida exitosamente. El inventario ha sido actualizado.");
        onSuccess();
        handleClose();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || error?.message || "Error al recibir orden";
        toast.error(message);
      },
    },
  });

  const handleClose = () => {
    if (!isPending) {
      setSerie("");
      setNumero("");
      setFechaRecepcion(new Date().toISOString().split("T")[0]);
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!orden) return;

    // Validaciones
    if (!serie || serie.trim() === "") {
      toast.error("La serie del comprobante es obligatoria");
      return;
    }

    if (!numero || numero.trim() === "") {
      toast.error("El número del comprobante es obligatorio");
      return;
    }

    if (!fechaRecepcion) {
      toast.error("La fecha de recepción es obligatoria");
      return;
    }

    // Convertir fecha a ISO datetime
    const fecha = new Date(fechaRecepcion + 'T00:00:00');
    const fechaISO = fecha.toISOString();

    // Enviar solicitud
    recibirOrden({
      id: orden.id,
      data: {
        serie: serie.trim(),
        numero: numero.trim(),
        fecha_recepcion: fechaISO,
      },
    });
  };

  if (!orden) return null;

  // Verificar si ya tiene serie/número (puede editarse)
  const hasExistingData = orden.serie && orden.numero;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recibir Mercadería - Orden #{orden.id}
          </DialogTitle>
          <DialogDescription>
            {hasExistingData
              ? "Confirma la recepción de la mercadería. Los datos del comprobante ya fueron ingresados."
              : "Ingresa los datos del comprobante del proveedor para recibir la mercadería."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información del Proveedor */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm font-medium">Proveedor:</p>
            <p className="text-sm text-muted-foreground">
              {orden.proveedor?.nombre || "N/A"}
            </p>
            {orden.proveedor_ruc && (
              <p className="text-xs text-muted-foreground mt-1">
                RUC: {orden.proveedor_ruc}
              </p>
            )}
          </div>

          {/* Información de la Orden */}
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium mb-2">Productos a ingresar:</p>
            <div className="space-y-2">
              {orden.detalles?.map((detalle, index) => (
                <div
                  key={index}
                  className="flex justify-between text-sm text-muted-foreground"
                >
                  <span>• {detalle.producto?.nombre || `Producto #${detalle.producto_id}`}</span>
                  <span className="font-medium">
                    {detalle.cantidad} UND
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t">
              <span className="font-medium">Total de la orden:</span>
              <span className="font-bold">{formatCurrency(Number(orden.total || 0))}</span>
            </div>
          </div>

          {/* Datos del Comprobante */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serie">Serie del Comprobante *</Label>
                <Input
                  id="serie"
                  placeholder="F001"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value.toUpperCase())}
                  maxLength={10}
                  disabled={isPending}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Serie del comprobante del proveedor
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número del Comprobante *</Label>
                <Input
                  id="numero"
                  placeholder="000001"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  maxLength={20}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Número correlativo
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de Recepción *</Label>
              <Input
                id="fecha"
                type="date"
                value={fechaRecepcion}
                onChange={(e) => setFechaRecepcion(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Alerta de Impacto */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Esta acción:</strong>
              <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                <li>Incrementará el stock de los productos</li>
                <li>Cambiará el estado de la orden a <strong>RECIBIDA</strong></li>
                <li>Registrará los datos fiscales del comprobante</li>
                <li>No podrá ser revertida automáticamente</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || !serie || !numero}
          >
            {isPending ? (
              <>Procesando...</>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Confirmar Ingreso
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
