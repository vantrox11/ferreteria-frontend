import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const movimientoSchema = z.object({
  monto: z
    .number()
    .min(0.01, "El monto debe ser mayor a 0")
    .max(999999, "Monto muy alto"),
  descripcion: z
    .string()
    .min(10, "Describe el motivo con al menos 10 caracteres")
    .max(500, "Máximo 500 caracteres"),
  metodo_pago: z.enum([
    "EFECTIVO",
    "TARJETA",
    "YAPE",
    "PLIN",
    "TRANSFERENCIA",
  ]),
});

type MovimientoFormData = z.infer<typeof movimientoSchema>;

interface ModalRegistroMovimientoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "INGRESO" | "EGRESO";
  onSubmit: (data: MovimientoFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ModalRegistroMovimiento({
  open,
  onOpenChange,
  tipo,
  onSubmit,
  isLoading = false,
}: ModalRegistroMovimientoProps) {
  const form = useForm<MovimientoFormData>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      monto: 0,
      descripcion: "",
      metodo_pago: "EFECTIVO",
    },
  });

  const handleSubmit = async (data: MovimientoFormData) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {tipo === "INGRESO" ? "Registrar Ingreso" : "Registrar Egreso"}
          </DialogTitle>
          <DialogDescription>
            {tipo === "INGRESO"
              ? "Registra dinero que entra a la caja"
              : "Registra dinero que sale de la caja"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="monto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                      className="text-xl font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metodo_pago"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pago</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EFECTIVO">💵 Efectivo</SelectItem>
                      <SelectItem value="TARJETA">💳 Tarjeta</SelectItem>
                      <SelectItem value="YAPE">📱 Yape</SelectItem>
                      <SelectItem value="PLIN">📱 Plin</SelectItem>
                      <SelectItem value="TRANSFERENCIA">
                        🏦 Transferencia
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                      placeholder="Describe el motivo (mínimo 10 caracteres)"
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
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
