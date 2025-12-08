/**
 * CierreCajaModal - Modal para cierre de turno con arqueo
 * 
 * Según doc_funcional_caja.md Paso C:
 * "Sistema solicita: ¿Cuánto dinero tienes en el cajón?"
 * "Usuario cuenta físicamente billetes y monedas"
 * "Cálculo: Monto Esperado = Inicial + Ventas + Ingresos - Egresos"
 * "Diferencia = Monto Final - Monto Esperado"
 * "El cierre es definitivo independientemente de si cuadra o no"
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePostApiSesionesCajaIdCierre } from '@/api/generated/sesiones-de-caja/sesiones-de-caja';
import { useCaja } from '@/context/CajaContext';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const cierreSchema = z.object({
  monto_final: z
    .string()
    .min(1, 'El monto final es requerido')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Debe ser un número válido mayor o igual a 0',
    }),
});

type CierreFormValues = z.infer<typeof cierreSchema>;

interface CierreCajaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CierreCajaModal({ open, onOpenChange }: CierreCajaModalProps) {
  const { currentSessionId, currentSession, clearSession } = useCaja();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDiferencia, setPreviewDiferencia] = useState<number | null>(null);

  const { mutateAsync: cerrarCaja } = usePostApiSesionesCajaIdCierre();

  const form = useForm<CierreFormValues>({
    resolver: zodResolver(cierreSchema),
    defaultValues: {
      monto_final: '',
    },
  });

  const montoFinal = form.watch('monto_final');

  // Calcular diferencia en tiempo real para preview
  const calcularDiferencia = () => {
    if (!currentSession || !montoFinal || isNaN(Number(montoFinal))) {
      setPreviewDiferencia(null);
      return;
    }

    const inicial = Number(currentSession.monto_inicial ?? 0);
    const ventas = Number(currentSession.total_ventas ?? 0);
    const ingresos = Number(currentSession.total_ingresos ?? 0);
    const egresos = Number(currentSession.total_egresos ?? 0);
    const esperado = inicial + ventas + ingresos - egresos;
    const diferencia = Number(montoFinal) - esperado;

    setPreviewDiferencia(diferencia);
  };

  // Actualizar preview cuando cambia el monto
  useEffect(() => {
    calcularDiferencia();
  }, [montoFinal, currentSession]);

  const onSubmit = async (data: CierreFormValues) => {
    if (!currentSessionId) {
      toast.error('No hay sesión activa');
      return;
    }

    setIsSubmitting(true);
    try {
      await cerrarCaja({
        id: currentSessionId,
        data: {
          monto_final: Number(data.monto_final),
        },
      });

      clearSession();

      toast.success('Turno cerrado exitosamente', {
        description:
          previewDiferencia === 0
            ? '✅ Caja cuadrada perfectamente'
            : previewDiferencia && previewDiferencia > 0
            ? `Sobrante: S/ ${previewDiferencia.toFixed(2)}`
            : `Faltante: S/ ${Math.abs(previewDiferencia ?? 0).toFixed(2)}`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      // Extraer mensaje de error del response de Axios
      const errorMessage = 
        error?.response?.data?.error || 
        error?.message || 
        'Error desconocido al cerrar caja';
      
      // ESCENARIO 1: Sesión no encontrada o ya cerrada
      if (errorMessage.includes('no encontrada') || errorMessage.includes('ya está cerrada')) {
        toast.error('❌ Sesión No Disponible', {
          description: 'La sesión ya fue cerrada o no existe. Recarga la página.',
          duration: 6000,
        });
      }
      // ESCENARIO 2: Usuario intenta cerrar sesión de otro usuario
      else if (errorMessage.includes('no tienes permiso') || errorMessage.includes('no es tu sesión')) {
        toast.error('🔒 Sin Permiso', {
          description: 'Solo puedes cerrar tu propia sesión. Contacta a un supervisor para cierre administrativo.',
          duration: 8000,
        });
      }
      // ESCENARIO 3: Datos inválidos (monto negativo)
      else if (errorMessage.includes('inválido') || errorMessage.includes('requerido') || errorMessage.includes('negativo')) {
        toast.error('⚠️ Datos Inválidos', {
          description: errorMessage,
          duration: 5000,
        });
      }
      // ESCENARIO 4: Error genérico
      else {
        toast.error('❌ Error al Cerrar Caja', {
          description: errorMessage,
          duration: 6000,
        });
      }
      
      console.error('[CierreCajaModal] Error completo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular montos para mostrar resumen
  const montoInicial = Number(currentSession?.monto_inicial ?? 0);
  const totalVentas = Number(currentSession?.total_ventas ?? 0);
  const totalIngresos = Number(currentSession?.total_ingresos ?? 0);
  const totalEgresos = Number(currentSession?.total_egresos ?? 0);
  const montoEsperado = montoInicial + totalVentas + totalIngresos - totalEgresos;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cierre de Turno</DialogTitle>
          <DialogDescription>
            Cuenta físicamente el dinero que tienes en el cajón e ingresa el monto exacto.
          </DialogDescription>
        </DialogHeader>

        {/* Resumen de Sesión */}
        <div className="space-y-2 rounded-lg border bg-muted/50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monto Inicial:</span>
            <span className="font-medium">S/ {montoInicial.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Ventas:</span>
            <span className="font-medium text-green-600">+ S/ {totalVentas.toFixed(2)}</span>
          </div>
          {totalIngresos > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ingresos:</span>
              <span className="font-medium text-green-600">+ S/ {totalIngresos.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Egresos:</span>
            <span className="font-medium text-red-600">- S/ {totalEgresos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-semibold">Esperado:</span>
            <span className="font-bold">S/ {montoEsperado.toFixed(2)}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="monto_final"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto Real (Contado Físicamente)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        S/
                      </span>
                      <Input
                        {...field}
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        className="pl-10 text-lg font-semibold"
                        disabled={isSubmitting}
                        onChange={(e) => {
                          // Limpiar input: solo números y punto decimal
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          field.onChange(value);
                          calcularDiferencia();
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Cuenta billetes y monedas. Este es el arqueo físico.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview de Diferencia */}
            {previewDiferencia !== null && (
              <Alert
                variant={previewDiferencia === 0 ? 'default' : 'destructive'}
                className={previewDiferencia === 0 ? 'border-green-600' : ''}
              >
                {previewDiferencia === 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription className="ml-2">
                  {previewDiferencia === 0 ? (
                    <span className="font-semibold text-green-600">
                      ✅ Caja cuadrada perfectamente
                    </span>
                  ) : previewDiferencia > 0 ? (
                    <span>
                      <span className="font-semibold">Sobrante:</span> S/{' '}
                      {previewDiferencia.toFixed(2)}
                    </span>
                  ) : (
                    <span>
                      <span className="font-semibold">⚠️ Faltante:</span> S/{' '}
                      {Math.abs(previewDiferencia).toFixed(2)}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting} variant="destructive">
              {isSubmitting ? 'Cerrando...' : 'CONFIRMAR CIERRE DEFINITIVO'}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              El cierre es irreversible. La diferencia quedará registrada permanentemente.
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
