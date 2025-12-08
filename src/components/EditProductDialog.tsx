import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProductForm from "@/components/ProductForm";
import { toast } from "sonner";
import { useGetApiCategorias } from "@/api/generated/categorías/categorías";
import { useGetApiMarcas } from "@/api/generated/marcas/marcas";
import { useGetApiUnidadesMedida } from "@/api/generated/unidades-de-medida/unidades-de-medida";
import { useGetApiTenantConfiguracionFiscal } from "@/api/generated/tenant/tenant";
import { usePutApiProductosId } from "@/api/generated/productos/productos";
import type { Producto } from "@/api/generated/model";
import { Pencil } from "lucide-react";
import ImagePreview from "@/components/ImagePreview";
import { useQueryClient } from "@tanstack/react-query";
import { customInstance } from "@/api/mutator/custom-instance";

const editProductSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  sku: z
    .string()
    .trim()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .or(z.literal("")),
  descripcion: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .or(z.literal("")),
  precio_venta: z.number().positive("Debe ser mayor a 0"),
  costo_compra: z.number().positive().optional(),
  stock_minimo: z.number().int().min(0).optional(),
  categoria_id: z.number().int().min(1).nullable().optional(),
  marca_id: z.number().int().min(1).nullable().optional(),
  unidad_medida_id: z.number().int().min(1, "La unidad de medida es obligatoria"),
  afectacion_igv: z.enum(["GRAVADO", "EXONERADO", "INAFECTO"]),
});

type EditProductFormValues = z.infer<typeof editProductSchema>;

type EditProductDialogProps = {
  producto: Producto;
  onUpdated?: (producto: Producto) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
export default function EditProductDialog({ producto, onUpdated, children, open: controlledOpen, onOpenChange }: EditProductDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAction, setImageAction] = useState<"keep" | "delete" | "update">("keep");

  // Fetch data usando hooks generados
  const { data: categoriasResponse, isLoading: categoriasLoading } = useGetApiCategorias(undefined, { query: { enabled: open } });
  const { data: marcasResponse, isLoading: marcasLoading } = useGetApiMarcas(undefined, { query: { enabled: open } });
  const { data: unidadesResponse, isLoading: unidadesMedidaLoading } = useGetApiUnidadesMedida({ limit: 0 }, { query: { enabled: open } });
  const { data: configFiscal, isLoading: configFiscalLoading } = useGetApiTenantConfiguracionFiscal({ query: { enabled: open } });

  const categorias = categoriasResponse?.data ?? [];
  const marcas = marcasResponse?.data ?? [];
  const unidadesMedida = unidadesResponse?.data ?? [];

  const { mutateAsync: updateProducto } = usePutApiProductosId();

  // Determinar si mostrar el campo de afectación IGV
  const showAfectacionIgv = !configFiscalLoading && configFiscal?.exonerado_regional === false;

  const form = useForm<EditProductFormValues>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      nombre: producto.nombre,
      sku: producto.sku ?? "",
      descripcion: producto.descripcion ?? "",
      precio_venta: producto.precio_venta ?? 0,
      costo_compra: undefined,
      stock_minimo: producto.stock_minimo != null ? Number(producto.stock_minimo) : undefined,
      categoria_id: producto.categoria_id,
      marca_id: producto.marca_id,
      unidad_medida_id: producto.unidad_medida_id,
      afectacion_igv: producto.afectacion_igv ?? "GRAVADO",
    },
    mode: "onChange",
  });

  // Reset form cuando cambia el producto o se cierra
  useEffect(() => {
    form.reset({
      nombre: producto.nombre,
      sku: producto.sku ?? "",
      descripcion: producto.descripcion ?? "",
      precio_venta: producto.precio_venta ?? 0,
      costo_compra: undefined,
      stock_minimo: producto.stock_minimo != null ? Number(producto.stock_minimo) : undefined,
      categoria_id: producto.categoria_id,
      marca_id: producto.marca_id,
      unidad_medida_id: producto.unidad_medida_id,
      afectacion_igv: producto.afectacion_igv ?? "GRAVADO",
    });
    
    // Reset imagen
    setImageFile(null);
    setImageAction("keep");
  }, [producto, open]);

  async function onSubmit(values: EditProductFormValues) {
    try {
      // Si el tenant es exonerado_regional (Amazonía), forzar INAFECTO
      const afectacionFinal = configFiscal?.exonerado_regional 
        ? "INAFECTO" 
        : values.afectacion_igv;

      // NOTA: Según API v2, PUT /productos/{id} acepta todos los campos del producto
      const payload: any = {
        nombre: values.nombre.trim(),
        precio_venta: values.precio_venta,
        afectacion_igv: afectacionFinal,
        unidad_medida_id: values.unidad_medida_id,
      };

      const skuTrim = (values.sku ?? "").trim();
      if (skuTrim) payload.sku = skuTrim;

      const descTrim = (values.descripcion ?? "").trim();
      if (descTrim) payload.descripcion = descTrim;

      if (values.costo_compra !== undefined) payload.costo_compra = values.costo_compra;
      if (values.stock_minimo !== undefined) payload.stock_minimo = values.stock_minimo;
      if (values.categoria_id !== undefined) payload.categoria_id = values.categoria_id;
      if (values.marca_id !== undefined) payload.marca_id = values.marca_id;

      const updated = await updateProducto({ id: producto.id!, data: payload });
      
      // Manejar imagen según la acción
      if (imageAction === "delete" && producto.imagen_url) {
        // Eliminar imagen
        try {
          await customInstance({
            url: `/api/productos/${producto.id}/imagen`,
            method: "DELETE",
          });
        } catch (imgError) {
          console.error("Error al eliminar imagen:", imgError);
          toast.warning("Producto actualizado, pero no se pudo eliminar la imagen");
        }
      } else if (imageAction === "update" && imageFile) {
        // Subir nueva imagen
        try {
          const formData = new FormData();
          formData.append("imagen", imageFile);
          
          await customInstance({
            url: `/api/productos/${producto.id}/upload-imagen`,
            method: "POST",
            data: formData,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } catch (imgError) {
          console.error("Error al subir imagen:", imgError);
          toast.warning("Producto actualizado, pero no se pudo subir la imagen");
        }
      }
      
      // Invalidar queries para refrescar
      queryClient.invalidateQueries({ queryKey: ['/api/productos'] });
      
      toast.success("Producto actualizado correctamente");
      onUpdated?.(updated);
      setOpen(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Error al actualizar el producto";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Editar producto</DialogTitle>
          <DialogDescription>
            Modifique los datos del producto
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <div className="space-y-6 pb-6">
            <ImagePreview
              value={imageFile || producto.imagen_url}
              onChange={(file) => {
                if (file === null) {
                  setImageFile(null);
                  setImageAction("delete");
                } else {
                  setImageFile(file);
                  setImageAction("update");
                }
              }}
            />

            <ProductForm 
              form={form} 
              onSubmit={onSubmit} 
              submitLabel="Actualizar producto" 
              categorias={categorias} 
              categoriasLoading={categoriasLoading}
              marcas={marcas}
              marcasLoading={marcasLoading}
              unidadesMedida={unidadesMedida}
              unidadesMedidaLoading={unidadesMedidaLoading}
              showAfectacionIgv={showAfectacionIgv}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
