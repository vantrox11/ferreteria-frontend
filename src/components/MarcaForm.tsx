import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { UseFormReturn, FieldValues, FieldPath } from "react-hook-form";

type MarcaFormProps<TValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TValues, any, TValues>;
  onSubmit: (values: TValues) => void;
  submitLabel?: string;
};

export default function MarcaForm<TValues extends FieldValues>({
  form,
  onSubmit,
  submitLabel = "Guardar",
}: MarcaFormProps<TValues>) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4">
          {/* Nombre */}
          <FormField
            control={form.control}
            name={"nombre" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Bosch, Stanley, Makita..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Logo URL (opcional) */}
          <FormField
            control={form.control}
            name={"logo_url" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL del Logo</FormLabel>
                <FormControl>
                  <Input 
                    type="url"
                    placeholder="https://ejemplo.com/logo.png" 
                    value={field.value ?? ""} 
                    onChange={field.onChange} 
                    onBlur={field.onBlur} 
                    name={field.name} 
                    ref={field.ref}
                  />
                </FormControl>
                <FormDescription>
                  URL pública de la imagen del logo (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
