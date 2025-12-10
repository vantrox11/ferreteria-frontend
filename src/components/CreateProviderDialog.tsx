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
import ProviderForm from "@/components/ProviderForm";
import { toast } from "sonner";
import { usePostApiProveedores } from "@/api/generated/proveedores/proveedores";
import type { Proveedor, CreateProveedorTipoDocumento } from "@/api/generated/model";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/api-error";

type ProveedorCreateInput = {
  nombre: string;
  tipo_documento: CreateProveedorTipoDocumento;
  ruc_identidad: string;
  email?: string;
  telefono?: string;
  direccion?: string;
};

const createProviderSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
  ruc_identidad: z
    .string()
    .trim()
    .min(1, "El documento es obligatorio")
    .refine(
      (val) => /^[0-9]{8}$|^[0-9]{11}$/.test(val),
      "El documento debe ser DNI (8 dígitos) o RUC (11 dígitos)"
    ),
  email: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Email inválido"
    )
    .optional()
    .or(z.literal("")),

  telefono: z
    .string()
    .trim()
    .max(30, "Máximo 30 caracteres")
    .optional()
    .or(z.literal("")),
  direccion: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

type CreateProviderFormValues = z.infer<typeof createProviderSchema>;

type CreateProviderDialogProps = {
  onCreated?: (proveedor: Proveedor) => void;
  children?: React.ReactNode;
};

export default function CreateProviderDialog({ onCreated, children }: CreateProviderDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: createProveedor } = usePostApiProveedores();

  const form = useForm<CreateProviderFormValues>({
    resolver: zodResolver(createProviderSchema),
    defaultValues: { nombre: "", ruc_identidad: "", email: "", telefono: "", direccion: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset({ nombre: "", ruc_identidad: "", email: "", telefono: "", direccion: "" });
    }
  }, [open, form]);

  async function onSubmit(values: CreateProviderFormValues) {
    try {
      // Detectar tipo_documento según longitud
      const documento = values.ruc_identidad.trim();
      let tipo_documento: CreateProveedorTipoDocumento;

      if (documento.length === 8) {
        tipo_documento = 'DNI';
      } else if (documento.length === 11) {
        tipo_documento = 'RUC';
      } else {
        toast.error("Documento inválido");
        return;
      }

      const payload: ProveedorCreateInput = {
        nombre: values.nombre.trim(),
        tipo_documento: tipo_documento,
        ruc_identidad: documento,
        email: values.email?.trim() ? values.email.trim() : undefined,
        telefono: values.telefono?.trim() ? values.telefono.trim() : undefined,
        direccion: values.direccion?.trim() ? values.direccion.trim() : undefined,
      };

      const created = await createProveedor({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ['api', 'proveedores'] });
      toast.success("Proveedor creado correctamente");
      onCreated?.(created);
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al crear el proveedor"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button>
            <Plus className="mr-2 size-4" /> Crear Proveedor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Crear proveedor</DialogTitle>
          <DialogDescription>Completa los datos para registrar un nuevo proveedor</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <div className="space-y-6 pb-6">
            <ProviderForm form={form} onSubmit={onSubmit} submitLabel="Crear proveedor" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
