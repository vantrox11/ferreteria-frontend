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
import { ScrollArea } from "@/components/ui/scroll-area";
import MarcaForm from "@/components/MarcaForm";
import { toast } from "sonner";
import { usePutApiMarcasId } from "@/api/generated/marcas/marcas";
import type { Marca } from "@/api/generated/model";
import { useQueryClient } from "@tanstack/react-query";

const updateMarcaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  logo_url: z
    .string()
    .trim()
    .url("Debe ser una URL válida")
    .optional()
    .or(z.literal("")),
});

type UpdateMarcaFormValues = z.infer<typeof updateMarcaSchema>;

type EditMarcaDialogProps = {
  marca: Marca;
  onUpdated?: (marca: Marca) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function EditMarcaDialog({ marca, onUpdated, children, open: controlledOpen, onOpenChange }: EditMarcaDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const { mutateAsync: updateMarca } = usePutApiMarcasId();

  const form = useForm<UpdateMarcaFormValues>({
    resolver: zodResolver(updateMarcaSchema),
    defaultValues: {
      nombre: marca.nombre,
      logo_url: marca.logo_url ?? "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      form.reset({ 
        nombre: marca.nombre, 
        logo_url: marca.logo_url ?? "" 
      });
    }
  }, [open, marca, form]);

  async function onSubmit(values: UpdateMarcaFormValues) {
    try {
      const payload: any = {
        nombre: values.nombre.trim(),
      };

      const logoTrim = values.logo_url?.trim();
      if (logoTrim) payload.logo_url = logoTrim;

      const updated = await updateMarca({ id: marca.id!, data: payload });
      await queryClient.invalidateQueries({ queryKey: ['/api/marcas'] });
      toast.success("Marca actualizada exitosamente");
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Editar marca</DialogTitle>
          <DialogDescription>Actualiza los datos de la marca seleccionada</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <div className="space-y-6 pb-6">
            <MarcaForm form={form} onSubmit={onSubmit} submitLabel="Actualizar marca" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
