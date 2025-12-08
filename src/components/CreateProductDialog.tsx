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
import { Plus } from "lucide-react";
import ProductForm from "@/components/ProductForm";
import { toast } from "sonner";
import { useGetApiCategorias } from "@/api/generated/categorías/categorías";
import { useGetApiMarcas } from "@/api/generated/marcas/marcas";
import { useGetApiUnidadesMedida } from "@/api/generated/unidades-de-medida/unidades-de-medida";
import { useGetApiTenantConfiguracionFiscal } from "@/api/generated/tenant/tenant";
import { usePostApiProductos } from "@/api/generated/productos/productos";
import type { Producto } from "@/api/generated/model";
import ImagePreview from "@/components/ImagePreview";
import { customInstance } from "@/api/mutator/custom-instance";

const createProductSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  imagen: z
  .instanceof(File)
  .optional()
  .refine((file) => !file || file.size <= 5 * 1024 * 1024, {
    message: "La imagen debe ser menor a 5MB",
  }),
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

type CreateProductFormValues = z.infer<typeof createProductSchema>;

type CreateProductDialogProps = {
  onCreated?: (producto: Producto) => void;
  children?: React.ReactNode;
};

export default function CreateProductDialog({ onCreated, children }: CreateProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Fetch data usando hooks generados
  const { data: categoriasResponse, isLoading: categoriasLoading } = useGetApiCategorias(undefined, { query: { enabled: open } });
  const { data: marcasResponse, isLoading: marcasLoading } = useGetApiMarcas(undefined, { query: { enabled: open } });
  const { data: unidadesResponse, isLoading: unidadesMedidaLoading } = useGetApiUnidadesMedida({ limit: 0 }, { query: { enabled: open } });
  const { data: configFiscal, isLoading: configFiscalLoading } = useGetApiTenantConfiguracionFiscal({ query: { enabled: open } });

  const categorias = categoriasResponse?.data ?? [];
  const marcas = marcasResponse?.data ?? [];
  const unidadesMedida = unidadesResponse?.data ?? [];

  const { mutateAsync: createProducto } = usePostApiProductos();

  // Determinar si mostrar el campo de afectación IGV
  // Solo se muestra si el tenant NO es exonerado_regional (Amazonía)
  const showAfectacionIgv = !configFiscalLoading && configFiscal?.exonerado_regional === false;

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      nombre: "",
      sku: "",
      descripcion: "",
      precio_venta: 0,
      costo_compra: undefined,
      stock_minimo: undefined,
      categoria_id: undefined,
      marca_id: undefined,
      unidad_medida_id: undefined,
      afectacion_igv: "GRAVADO",
    },
    mode: "onChange",
  });

  // Reset form cuando se cierra el diálogo
  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedImage(null);
    }
  }, [open, form]);

  async function onSubmit(values: CreateProductFormValues) {
    try {
      // Si el tenant es exonerado_regional (Amazonía), forzar INAFECTO
      const afectacionFinal = configFiscal?.exonerado_regional 
        ? "INAFECTO" 
        : values.afectacion_igv;

      const payload: any = {
        nombre: values.nombre.trim(),
        precio_venta: values.precio_venta,
        stock: 0,
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

      const created = await createProducto({ data: payload });
      
      // Si hay imagen seleccionada, subirla después de crear el producto
      if (selectedImage) {
        try {
          const formData = new FormData();
          formData.append("imagen", selectedImage);
          
          await customInstance({
            url: `/api/productos/${created.id}/upload-imagen`,
            method: "POST",
            data: formData,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } catch (imgError) {
          // Si falla la subida de imagen, no bloquear el flujo
          console.error("Error al subir imagen:", imgError);
          toast.warning("Producto creado, pero no se pudo subir la imagen");
        }
      }
      
      toast.success("Producto creado correctamente");
      onCreated?.(created);
      setOpen(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Error al crear el producto";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button>
            <Plus className="mr-2 size-4" /> Crear Producto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Crear producto</DialogTitle>
          <DialogDescription>
            Complete los datos del nuevo producto
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <div className="space-y-6 pb-6">
            <ImagePreview
              value={selectedImage}
              onChange={(file) => setSelectedImage(file)}
            />

            <ProductForm 
              form={form} 
              onSubmit={onSubmit} 
              submitLabel="Crear producto" 
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
