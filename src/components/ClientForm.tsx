import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { UseFormReturn, FieldValues, FieldPath } from "react-hook-form";

type ClientFormProps<TValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TValues, any, TValues>;
  onSubmit: (values: TValues) => void;
  submitLabel?: string;
};

export default function ClientForm<TValues extends FieldValues>({
  form,
  onSubmit,
  submitLabel = "Guardar",
}: ClientFormProps<TValues>) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Nombre (requerido) */}
          <FormField
            control={form.control}
            name={"nombre" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Juan Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Documento de identidad (opcional) */}
          <FormField
            control={form.control}
            name={"documento_identidad" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documento de identidad</FormLabel>
                <FormControl>
                  <Input placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* RUC (opcional) */}
          <FormField
            control={form.control}
            name={"ruc" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>RUC</FormLabel>
                <FormControl>
                  <Input placeholder="11 dígitos (opcional)" maxLength={11} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Razón Social (opcional, requerido si tiene RUC) */}
          <FormField
            control={form.control}
            name={"razon_social" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razón Social</FormLabel>
                <FormControl>
                  <Input placeholder="Requerido si tiene RUC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email (opcional) */}
          <FormField
            control={form.control}
            name={"email" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Teléfono (opcional) */}
          <FormField
            control={form.control}
            name={"telefono" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dirección (opcional) */}
          <FormField
            control={form.control}
            name={"direccion" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Dirección completa..."
                    rows={3}
                    value={(field.value as any) ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref as any}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Sección de Crédito */}
        <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Línea de Crédito</h3>
              <p className="text-xs text-muted-foreground">Habilita crédito para ventas a plazo</p>
            </div>
            <FormField
              control={form.control}
              name={"habilitar_credito" as FieldPath<TValues>}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={field.value as boolean}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {form.watch("habilitar_credito" as FieldPath<TValues>) && (
            <div className="grid gap-4 md:grid-cols-2 pt-2">
              <FormField
                control={form.control}
                name={"limite_credito" as FieldPath<TValues>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Límite de Crédito (S/)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={field.value as number || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Monto máximo que puede deber el cliente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={"dias_credito" as FieldPath<TValues>}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días de Crédito</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        step="1"
                        min="0"
                        value={field.value as number || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Plazo en días para pagar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
