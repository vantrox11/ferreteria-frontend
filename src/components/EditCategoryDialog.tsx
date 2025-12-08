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
import CategoryForm from "@/components/CategoryForm";
import { toast } from "sonner";
import { usePutApiCategoriasId } from "@/api/generated/categorías/categorías";
import type { Categoria } from "@/api/generated/model";
import { useQueryClient } from "@tanstack/react-query";

type CategoriaUpdateInput = {
  nombre?: string;
  descripcion?: string;
};

const updateCategorySchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  descripcion: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .or(z.literal("")),
});

type UpdateCategoryFormValues = z.infer<typeof updateCategorySchema>;

type EditCategoryDialogProps = {
  categoria: Categoria;
  onUpdated?: (categoria: Categoria) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function EditCategoryDialog({ categoria, onUpdated, children, open: controlledOpen, onOpenChange }: EditCategoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const { mutateAsync: updateCategoria } = usePutApiCategoriasId();

  const form = useForm<UpdateCategoryFormValues>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      form.reset({ nombre: categoria.nombre, descripcion: categoria.descripcion ?? "" });
    }
  }, [open, categoria, form]);

  async function onSubmit(values: UpdateCategoryFormValues) {
    try {
      const payload: CategoriaUpdateInput = {
        nombre: values.nombre.trim(),
        descripcion: values.descripcion?.trim() || undefined,
      };
      const updated = await updateCategoria({ id: categoria.id!, data: payload });
      await queryClient.invalidateQueries({ queryKey: ['api', 'categorias'] });
      toast.success("Categor\u00eda actualizada");
      onUpdated?.(updated);
      setOpen(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "No se pudo actualizar";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Editar categoría</DialogTitle>
          <DialogDescription>Actualiza los datos de la categoría seleccionada</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <div className="space-y-6 pb-6">
            <CategoryForm form={form} onSubmit={onSubmit} submitLabel="Actualizar categoría" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
