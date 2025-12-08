/**
 * MovimientosCajaModal - Modal para registrar ingresos/egresos manuales
 * 
 * Según doc_funcional_caja.md Paso B (Movimientos Manuales):
 * "Switch/Tabs: [📥 Ingreso] | [📤 Egreso]"
 * "Campos: Monto y Motivo"
 * "El sistema ajusta el 'monto esperado' según el tipo de movimiento"
 */

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePostApiMovimientosCaja } from '@/api/generated/movimientos-de-caja/movimientos-de-caja';
import { useCaja } from '@/context/CajaContext';
import { toast } from 'sonner';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

const movimientoSchema = z.object({
  monto: z
    .string()
    .min(1, 'El monto es requerido')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Debe ser un número mayor a 0',
    }),
  descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
});

type MovimientoFormValues = z.infer<typeof movimientoSchema>;

interface MovimientosCajaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MovimientosCajaModal({ open, onOpenChange }: MovimientosCajaModalProps) {
  const { currentSessionId } = useCaja();
  const [tipoMovimiento, setTipoMovimiento] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: registrarMovimiento } = usePostApiMovimientosCaja();

  const form = useForm<MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      monto: '',
      descripcion: '',
    },
  });

  const onSubmit = async (data: MovimientoFormValues) => {
    if (!currentSessionId) {
      toast.error('No hay sesión activa');
      return;
    }

    setIsSubmitting(true);
    try {
      await registrarMovimiento({
        data: {
          tipo: tipoMovimiento,
          monto: Number(data.monto),
          descripcion: data.descripcion,
        },
      });

      const tipoTexto = tipoMovimiento === 'INGRESO' ? 'Ingreso' : 'Egreso';
      toast.success(`${tipoTexto} registrado`, {
        description: `S/ ${data.monto} - ${data.descripcion}`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al registrar movimiento', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Movimientos de Caja</DialogTitle>
          <DialogDescription>
            Registra ingresos o egresos de dinero no relacionados con ventas (ej: cambio de
            sencillo, pagos de delivery).
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tipoMovimiento}
          onValueChange={(value) => setTipoMovimiento(value as 'INGRESO' | 'EGRESO')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="INGRESO" className="flex items-center gap-2">
              <ArrowDownIcon className="h-4 w-4 text-green-600" />
              Ingreso
            </TabsTrigger>
            <TabsTrigger value="EGRESO" className="flex items-center gap-2">
              <ArrowUpIcon className="h-4 w-4 text-red-600" />
              Egreso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="INGRESO">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="monto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto del Ingreso</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            S/
                          </span>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="50.00"
                            className="pl-10"
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Ej: Ingreso de sencillo adicional"
                          disabled={isSubmitting}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Registrando...' : 'Registrar Ingreso'}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="EGRESO">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="monto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto del Egreso</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            S/
                          </span>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="20.00"
                            className="pl-10"
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Ej: Pago de almuerzo del personal"
                          disabled={isSubmitting}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting} variant="destructive">
                  {isSubmitting ? 'Registrando...' : 'Registrar Egreso'}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
