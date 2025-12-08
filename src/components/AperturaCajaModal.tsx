/**
 * AperturaCajaModal - Modal de apertura de caja (SIN botón de cerrar - Bloqueo Total)
 * 
 * Según doc_funcional_caja.md Paso A:
 * "Opción A: Se presenta un Modal sin botón de cerrar"
 * "Usuario no puede proceder hasta abrir turno"
 * 
 * Interfaz:
 * - Selector (Dropdown): Lista de cajas disponibles
 * - Campo numérico: "Monto de Inicio (Sencillo)"
 * - Botón: "ABRIR TURNO"
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGetApiCajas } from '@/api/generated/cajas/cajas';
import { usePostApiSesionesCajaApertura } from '@/api/generated/sesiones-de-caja/sesiones-de-caja';
import { useCaja } from '@/context/CajaContext';
import { toast } from 'sonner';
import type { SesionCaja } from '@/api/generated/model';

const aperturaSchema = z.object({
  caja_id: z.number({
    message: 'Debes seleccionar una caja',
  }),
  monto_inicial: z
    .string()
    .min(1, 'El monto inicial es requerido')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Debe ser un número válido mayor o igual a 0',
    }),
});

type AperturaFormValues = z.infer<typeof aperturaSchema>;

interface AperturaCajaModalProps {
  open: boolean;
  onClose?: () => void;
}

export function AperturaCajaModal({ open, onClose }: AperturaCajaModalProps) {
  const navigate = useNavigate();
  const { setCurrentSession } = useCaja();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consultar cajas disponibles (solo activas)
  const { data: cajasResponse, isLoading: loadingCajas } = useGetApiCajas();
  const cajas = (cajasResponse?.data ?? []).filter((c: { isActive: boolean }) => c.isActive);

  // Mutation para apertura
  const { mutateAsync: abrirCaja } = usePostApiSesionesCajaApertura();

  const form = useForm<AperturaFormValues>({
    resolver: zodResolver(aperturaSchema),
    defaultValues: {
      caja_id: undefined,
      monto_inicial: '100.00',
    },
  });

  // Reset form cuando el modal se abre
  useEffect(() => {
    if (open) {
      form.reset({
        caja_id: undefined,
        monto_inicial: '100.00',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Solo depender de 'open', NO de 'form'

  const onSubmit = async (data: AperturaFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await abrirCaja({
        data: {
          caja_id: data.caja_id,
          monto_inicial: Number(data.monto_inicial),
        },
      });

      // Actualizar contexto con la sesión recién creada
      setCurrentSession(response as SesionCaja);

      toast.success('Caja abierta exitosamente', {
        //description: `Turno iniciado con S/ ${data.monto_inicial}`,
      });
    } catch (error: any) {
      // Extraer código de estado HTTP y mensaje de error
      const statusCode = error?.response?.status;
      const errorMessage = 
        error?.response?.data?.error || 
        error?.message || 
        'Error desconocido al abrir caja';
      
      console.error('[AperturaCajaModal] Error completo:', error);
      console.log('[AperturaCajaModal] Status Code:', statusCode);
      console.log('[AperturaCajaModal] Error Message:', errorMessage);
      
      // ESCENARIO 1: HTTP 409 - Caja ocupada o usuario ya tiene sesión
      if (statusCode === 409) {
        // Sub-caso A: Caja ya está siendo usada por otro usuario
        if (errorMessage.includes('siendo usada')) {
          toast.error('Caja Ocupada por Otro Usuario', {
            //description: errorMessage,
            duration: 50000,
          });
        } 
        // Sub-caso B: Usuario ya tiene una sesión activa
        else if (errorMessage.includes('ya tienes una') || errorMessage.includes('ya tienes una sesion')) {
          toast.error('Ya Tienes una Sesión Activa', {
            description: 'Debes cerrar tu sesión actual antes de abrir una nueva.',
            duration: 8000,
          });
        }
        // Fallback genérico para 409
        else {
          toast.error('Conflicto de Sesión', {
            description: errorMessage,
            duration: 8000,
          });
        }
      }
      // ESCENARIO 2: HTTP 404 - Caja no existe o está inactiva
      else if (statusCode === 404) {
        toast.error('Caja No Disponible', {
          description: 'La caja seleccionada no existe o está desactivada. Contacta a un administrador.',
          duration: 6000,
        });
      }
      // ESCENARIO 3: HTTP 400 - Datos inválidos
      else if (statusCode === 400) {
        toast.error('Datos Inválidos', {
          description: errorMessage,
          duration: 5000,
        });
      }
      // ESCENARIO 4: Error genérico de servidor (500 o sin status code)
      else {
        toast.error('Error al Abrir Caja', {
          description: errorMessage,
          duration: 6000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Si no hay onClose, navegar al dashboard
      navigate('/dashboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
    }}>
      <DialogContent
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Apertura de Caja</DialogTitle>
          <DialogDescription>
            Debes abrir un turno antes de realizar ventas. Cuenta el dinero inicial (sencillo) que
            tienes en el cajón.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {loadingCajas ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground">Cargando cajas...</p>
                </div>
              </div>
            ) : cajas.length === 0 ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                <p className="font-semibold text-destructive">No hay cajas disponibles</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Contacta a un administrador para crear cajas.
                </p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="caja_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caja</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value !== null && field.value !== undefined ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una caja" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cajas.map((caja: { id: number; nombre: string }) => (
                          <SelectItem key={caja.id} value={caja.id.toString()}>
                            {caja.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!loadingCajas && cajas.length > 0 && (
              <FormField
                control={form.control}
                name="monto_inicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto de Inicio (Sencillo)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          S/
                        </span>
                        <Input
                          {...field}
                          type="text"
                          inputMode="decimal"
                          placeholder="100.00"
                          className="pl-10"
                          disabled={isSubmitting}
                          onChange={(e) => {
                            // Limpiar input: solo números y punto decimal
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            field.onChange(value);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!loadingCajas && cajas.length > 0 && (
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Abriendo...' : 'ABRIR TURNO'}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
