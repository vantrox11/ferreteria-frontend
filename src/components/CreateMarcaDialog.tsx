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
import MarcaForm from "@/components/MarcaForm";
import { toast } from "sonner";
import { usePostApiMarcas } from "@/api/generated/marcas/marcas";
import type { Marca } from "@/api/generated/model";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/api-error";

const createMarcaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  logo_url: z
    .string()
    .trim()
    .url("Debe ser una URL válida")
    .optional()
    .or(z.literal("")),
});

type CreateMarcaFormValues = z.infer<typeof createMarcaSchema>;

type CreateMarcaDialogProps = {
  onCreated?: (marca: Marca) => void;
  children?: React.ReactNode;
};

export default function CreateMarcaDialog({ onCreated, children }: CreateMarcaDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: createMarca } = usePostApiMarcas();

  const form = useForm<CreateMarcaFormValues>({
    resolver: zodResolver(createMarcaSchema),
    defaultValues: {
      nombre: "",
      logo_url: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset({ nombre: "", logo_url: "" });
    }
  }, [open, form]);

  async function onSubmit(values: CreateMarcaFormValues) {
    try {
      const payload: any = {
        nombre: values.nombre.trim(),
      };

      const logoTrim = values.logo_url?.trim();
      if (logoTrim) payload.logo_url = logoTrim;

      const created = await createMarca({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ['/api/marcas'] });
      toast.success("Marca creada exitosamente");
      onCreated?.(created);
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear la marca"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button>
            <Plus className="mr-2 size-4" /> Nueva Marca
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Crear marca</DialogTitle>
          <DialogDescription>Completa los datos para registrar una nueva marca</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <div className="space-y-6 pb-6">
            <MarcaForm form={form} onSubmit={onSubmit} submitLabel="Crear marca" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
