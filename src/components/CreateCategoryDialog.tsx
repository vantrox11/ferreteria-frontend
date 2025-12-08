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
import CategoryForm from "@/components/CategoryForm";
import { toast } from "sonner";
import { usePostApiCategorias } from "@/api/generated/categorías/categorías";
import type { Categoria } from "@/api/generated/model";
import { useQueryClient } from "@tanstack/react-query";

const createCategorySchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  descripcion: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .or(z.literal("")),
});

type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;

type CreateCategoryDialogProps = {
  onCreated?: (categoria: Categoria) => void;
  children?: React.ReactNode;
};

export default function CreateCategoryDialog({ onCreated, children }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: createCategoria } = usePostApiCategorias();

  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset({ nombre: "", descripcion: "" });
    }
  }, [open, form]);

  async function onSubmit(values: CreateCategoryFormValues) {
    try {
      const payload = {
        nombre: values.nombre.trim(),
        descripcion: values.descripcion?.trim() || undefined,
      };
      const created = await createCategoria({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ['/api/categorias'] });
      toast.success("Categor\u00eda creada");
      onCreated?.(created);
      setOpen(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "No se pudo crear la categor\u00eda";
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
            <Plus className="mr-2 size-4" /> Crear Categoría
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Crear categoría</DialogTitle>
          <DialogDescription>Completa los datos para registrar una nueva categoría</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <div className="space-y-6 pb-6">
            <CategoryForm form={form} onSubmit={onSubmit} submitLabel="Crear categoría" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
