import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Info, Calculator, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalculadoraDenominaciones } from "./CalculadoraDenominaciones";
import { ResultadoCierre } from "./ResultadoCierre";

const arqueoCiegoSchema = z.object({
  monto_real: z
    .number()
    .min(0, "El monto no puede ser negativo")
    .max(999999, "Monto muy alto"),
  observaciones: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type ArqueoCiegoFormData = z.infer<typeof arqueoCiegoSchema>;

interface ModalArqueoCiegoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saldoTeorico: number;
  onSubmit: (data: ArqueoCiegoFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ModalArqueoCiego({
  open,
  onOpenChange,
  saldoTeorico,
  onSubmit,
  isLoading = false,
}: ModalArqueoCiegoProps) {
  const [confirmado, setConfirmado] = useState(false);
  const [resultado, setResultado] = useState<{
    montoReal: number;
    diferencia: number;
  } | null>(null);

  const form = useForm<ArqueoCiegoFormData>({
    resolver: zodResolver(arqueoCiegoSchema),
    defaultValues: {
      monto_real: 0,
      observaciones: "",
    },
  });

  const handleCalculadoraChange = (total: number) => {
    form.setValue("monto_real", total);
  };

  const handleConfirmar = async (data: ArqueoCiegoFormData) => {
    const diferencia = data.monto_real - saldoTeorico;
    setResultado({
      montoReal: data.monto_real,
      diferencia,
    });
    setConfirmado(true);
    await onSubmit(data);
  };

  const handleClose = () => {
    setConfirmado(false);
    setResultado(null);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Cierre de Caja - Arqueo Ciego
          </DialogTitle>
          <DialogDescription>
            Cuenta el dinero físico y registra el monto exacto. No se mostrará
            el saldo esperado hasta confirmar.
          </DialogDescription>
        </DialogHeader>

        {!confirmado ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleConfirmar)}
              className="space-y-6"
            >
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Cuenta todo el efectivo en el
                  cajón y registra el total. No incluyas otros métodos de pago
                  (tarjetas, transferencias, etc.).
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="monto_real"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Monto Total en Efectivo
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        className="text-3xl font-mono h-16 text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Accordion type="single" collapsible className="border rounded-lg">
                <AccordionItem value="calculadora" className="border-none">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      <span>Herramienta: Calculadora de Billetes y Monedas</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <CalculadoraDenominaciones
                      onChange={handleCalculadoraChange}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Alguna novedad durante el turno..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Lock className="mr-2 h-4 w-4" />
                  Confirmar Cierre
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          resultado && (
            <ResultadoCierre
              montoTeorico={saldoTeorico}
              montoReal={resultado.montoReal}
              diferencia={resultado.diferencia}
              onClose={handleClose}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
