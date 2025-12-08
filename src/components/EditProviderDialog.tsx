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
import ProviderForm from "@/components/ProviderForm";
import { toast } from "sonner";
import { usePutApiProveedoresId } from "@/api/generated/proveedores/proveedores";
import type { Proveedor } from "@/api/generated/model";
import { useQueryClient } from "@tanstack/react-query";

type ProveedorUpdateInput = {
  nombre?: string;
  ruc_identidad?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
};

const editProviderSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
  ruc_identidad: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[0-9]{8}$|^[0-9]{11}$/.test(val),
      "El documento debe ser DNI (8 dígitos) o RUC (11 dígitos)"
    )
    .optional()
    .or(z.literal("")),
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

type EditProviderFormValues = z.infer<typeof editProviderSchema>;

type EditProviderDialogProps = {
  proveedor: Proveedor;
  onUpdated?: (proveedor: Proveedor) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function EditProviderDialog({ proveedor, onUpdated, children, open: controlledOpen, onOpenChange }: EditProviderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const { mutateAsync: updateProveedor } = usePutApiProveedoresId();

  const form = useForm<EditProviderFormValues>({
    resolver: zodResolver(editProviderSchema),
    defaultValues: {
      nombre: proveedor.nombre || "",
      ruc_identidad: proveedor.ruc_identidad || "",
      email: proveedor.email || "",
      telefono: proveedor.telefono || "",
      direccion: proveedor.direccion || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        nombre: proveedor.nombre || "",
        ruc_identidad: proveedor.ruc_identidad || "",
        email: proveedor.email || "",
        telefono: proveedor.telefono || "",
        direccion: proveedor.direccion || "",
      });
    }
  }, [open, form, proveedor]);

  async function onSubmit(values: EditProviderFormValues) {
    try {
      const payload: ProveedorUpdateInput = {
        nombre: values.nombre.trim(),
        ruc_identidad: values.ruc_identidad?.trim() ? values.ruc_identidad.trim() : undefined,
        email: values.email?.trim() ? values.email.trim() : undefined,
        telefono: values.telefono?.trim() ? values.telefono.trim() : undefined,
        direccion: values.direccion?.trim() ? values.direccion.trim() : undefined,
      };

      const updated = await updateProveedor({ id: proveedor.id!, data: payload });
      await queryClient.invalidateQueries({ queryKey: ['api', 'proveedores'] });
      toast.success("Proveedor actualizado correctamente");
      onUpdated?.(updated);
      setOpen(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Error al actualizar el proveedor";
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
          <DialogTitle>Editar proveedor</DialogTitle>
          <DialogDescription>Actualiza los datos del proveedor seleccionado</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <div className="space-y-6 pb-6">
            <ProviderForm form={form} onSubmit={onSubmit} submitLabel="Actualizar proveedor" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
