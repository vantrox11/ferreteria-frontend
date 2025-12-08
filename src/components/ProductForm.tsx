import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { UseFormReturn, FieldValues, FieldPath } from "react-hook-form";
import type { Categoria, Marca, UnidadMedida } from "@/api/generated/model";
import CreateCategoryDialog from "@/components/CreateCategoryDialog";
import CreateMarcaDialog from "@/components/CreateMarcaDialog";
import { Plus } from "lucide-react";

type ProductFormProps<TValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TValues, any, TValues>;
  onSubmit: (values: TValues) => void;
  submitLabel?: string;
  categorias?: Categoria[];
  categoriasLoading?: boolean;
  marcas?: Marca[];
  marcasLoading?: boolean;
  unidadesMedida?: UnidadMedida[];
  unidadesMedidaLoading?: boolean;
  showAfectacionIgv?: boolean; // Solo se muestra si el tenant NO es exonerado_regional
};

export default function ProductForm<TValues extends FieldValues>({
  form,
  onSubmit,
  submitLabel = "Guardar",
  categorias = [],
  categoriasLoading = false,
  marcas = [],
  marcasLoading = false,
  unidadesMedida = [],
  unidadesMedidaLoading = false,
  showAfectacionIgv = false,
}: ProductFormProps<TValues>) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Nombre */}
          <FormField
            control={form.control}
            name={"nombre" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Taladro percutor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

       



          {/* SKU (opcional) */}
          <FormField
            control={form.control}
            name={"sku" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="Código único" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción (campo completo en 2 columnas) */}
          <FormField
            control={form.control}
            name={"descripcion" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descripción detallada del producto..." 
                    className="resize-none" 
                    rows={3}
                    value={field.value ?? ""} 
                    onChange={field.onChange} 
                    onBlur={field.onBlur} 
                    name={field.name} 
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Precio de venta */}
          <FormField
            control={form.control}
            name={"precio_venta" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de venta</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={field.value == null ? "" : (field.value as number)}
                    onChange={(e) =>
                      field.onChange(
                        e.currentTarget.value === "" ? undefined : e.currentTarget.valueAsNumber
                      )
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Costo de compra (opcional) */}
          <FormField
            control={form.control}
            name={"costo_compra" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo de compra</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={field.value == null ? "" : (field.value as number)}
                    onChange={(e) => field.onChange(e.currentTarget.value === "" ? undefined : e.currentTarget.valueAsNumber)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="Opcional"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stock mínimo (opcional) */}
          <FormField
            control={form.control}
            name={"stock_minimo" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock mínimo</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={field.value == null ? "" : (field.value as number)}
                    onChange={(e) => field.onChange(e.currentTarget.value === "" ? undefined : e.currentTarget.valueAsNumber)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="Opcional"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categoría (opcional) */}
          <FormField
            control={form.control}
            name={"categoria_id" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl className="flex-1">
                    <Select
                      value={field.value == null ? "" : String(field.value)}
                      onValueChange={(val) =>
                        field.onChange(val === "none" ? null : Number(val))
                      }
                      disabled={categoriasLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={categoriasLoading ? "Cargando…" : "Sin categoría"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría</SelectItem>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <CreateCategoryDialog
                    onCreated={(created) =>
                      form.setValue("categoria_id" as FieldPath<TValues>, created.id as unknown as any)
                    }
                  >
                    <Button type="button" variant="outline" size="icon-sm" aria-label="Nueva categoría">
                      <Plus className="size-4" />
                    </Button>
                  </CreateCategoryDialog>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Marca */}
          <FormField
            control={form.control}
            name={"marca_id" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl className="flex-1">
                    <Select
                      value={field.value == null ? "" : String(field.value)}
                      onValueChange={(val) =>
                        field.onChange(val === "none" ? null : Number(val))
                      }
                      disabled={marcasLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={marcasLoading ? "Cargando…" : "Sin marca"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin marca</SelectItem>
                        {marcas.map((marca) => (
                          <SelectItem key={marca.id} value={String(marca.id)}>
                            {marca.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <CreateMarcaDialog
                    onCreated={(created) =>
                      form.setValue("marca_id" as FieldPath<TValues>, created.id as unknown as any)
                    }
                  >
                    <Button type="button" variant="outline" size="icon-sm" aria-label="Nueva marca">
                      <Plus className="size-4" />
                    </Button>
                  </CreateMarcaDialog>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unidad de medida */}
          <FormField
            control={form.control}
            name={"unidad_medida_id" as FieldPath<TValues>}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad de medida</FormLabel>
                <FormControl>
                  <Select
                    value={field.value == null ? "" : String(field.value)}
                    onValueChange={(val) => field.onChange(Number(val))}
                    disabled={unidadesMedidaLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={unidadesMedidaLoading ? "Cargando…" : "Seleccionar"} />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesMedida.map((unidad) => (
                        <SelectItem key={unidad.id} value={String(unidad.id)}>
                          {unidad.nombre} ({unidad.codigo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Afectación IGV - Solo visible si el tenant NO es exonerado_regional */}
          {showAfectacionIgv && (
            <FormField
              control={form.control}
              name={"afectacion_igv" as FieldPath<TValues>}
              render={({ field }) => (
                <FormItem className="md:col-span-2 flex items-center justify-between p-2">
                  <div className="space-y-0.5">
                    <FormLabel>IGV exonerado</FormLabel>
                    <p className="text-xs text-muted-foreground">Solo productos sin IGV</p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === "EXONERADO"}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? "EXONERADO" : "GRAVADO")
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
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
