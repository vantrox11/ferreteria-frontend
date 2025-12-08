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
import ClientForm from "@/components/ClientForm";
import { toast } from "sonner";
import { usePutApiClientesId } from "@/api/generated/clientes/clientes";
import type { Cliente } from "@/api/generated/model";
import { useQueryClient } from "@tanstack/react-query";

type ClienteUpdateInput = {
  nombre: string;
  documento_identidad?: string;
  ruc?: string;
  razon_social?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  limite_credito?: number;
  dias_credito?: number;
};

const editClientSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
  documento_identidad: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[0-9]{8}$|^[0-9]{11}$/.test(val),
      "El documento debe ser DNI (8 dígitos) o RUC (11 dígitos)"
    )
    .optional()
    .or(z.literal("")),
  ruc: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[0-9]{11}$/.test(val),
      "El RUC debe tener 11 dígitos"
    )
    .optional()
    .or(z.literal("")),
  razon_social: z
    .string()
    .trim()
    .max(200, "Máximo 200 caracteres")
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
  habilitar_credito: z.boolean().optional(),
  limite_credito: z
    .number()
    .min(0, "El límite de crédito no puede ser negativo")
    .optional(),
  dias_credito: z
    .number()
    .int("Debe ser un número entero")
    .min(0, "Los días de crédito no pueden ser negativos")
    .optional(),
}).refine(
  (data) => {
    // Si tiene RUC, debe tener razón social
    if (data.ruc && !data.razon_social) return false;
    return true;
  },
  {
    message: "Si proporciona RUC, debe incluir la Razón Social",
    path: ["razon_social"],
  }
).refine(
  (data) => {
    // Si habilita crédito, debe proporcionar límite y días
    if (data.habilitar_credito) {
      if (!data.limite_credito || data.limite_credito <= 0) return false;
      if (!data.dias_credito || data.dias_credito <= 0) return false;
    }
    return true;
  },
  {
    message: "Si habilita crédito, debe proporcionar límite y días mayores a 0",
    path: ["limite_credito"],
  }
);

type EditClientFormValues = z.infer<typeof editClientSchema>;

type EditClientDialogProps = {
  cliente: Cliente;
  onUpdated?: (cliente: Cliente) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
export default function EditClientDialog({ cliente, onUpdated, children, open: controlledOpen, onOpenChange }: EditClientDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const { mutateAsync: updateCliente } = usePutApiClientesId();

  const form = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      nombre: cliente.nombre || "",
      documento_identidad: cliente.documento_identidad || "",
      ruc: cliente.ruc || "",
      razon_social: cliente.razon_social || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      direccion: cliente.direccion || "",
      habilitar_credito: !!(cliente.limite_credito && cliente.limite_credito > 0),
      limite_credito: cliente.limite_credito ? Number(cliente.limite_credito) : undefined,
      dias_credito: cliente.dias_credito || undefined,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        nombre: cliente.nombre || "",
        documento_identidad: cliente.documento_identidad || "",
        ruc: cliente.ruc || "",
        razon_social: cliente.razon_social || "",
        email: cliente.email || "",
        telefono: cliente.telefono || "",
        direccion: cliente.direccion || "",
        habilitar_credito: !!(cliente.limite_credito && cliente.limite_credito > 0),
        limite_credito: cliente.limite_credito ? Number(cliente.limite_credito) : undefined,
        dias_credito: cliente.dias_credito || undefined,
      });
    }
  }, [open, form, cliente]);

  async function onSubmit(values: EditClientFormValues) {
    try {
      const payload: ClienteUpdateInput = {
        nombre: values.nombre.trim(),
        documento_identidad: values.documento_identidad?.trim() ? values.documento_identidad.trim() : undefined,
        ruc: values.ruc?.trim() ? values.ruc.trim() : undefined,
        razon_social: values.razon_social?.trim() ? values.razon_social.trim() : undefined,
        email: values.email?.trim() ? values.email.trim() : undefined,
        telefono: values.telefono?.trim() ? values.telefono.trim() : undefined,
        direccion: values.direccion?.trim() ? values.direccion.trim() : undefined,
        limite_credito: values.habilitar_credito ? values.limite_credito : 0,
        dias_credito: values.habilitar_credito ? values.dias_credito : 0,
      };

      const updated = await updateCliente({ id: cliente.id!, data: payload });
      await queryClient.invalidateQueries({ queryKey: ['api', 'clientes'] });
      toast.success("Cliente actualizado correctamente");
      onUpdated?.(updated);
      setOpen(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Error al actualizar el cliente";
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
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>Actualiza los datos del cliente seleccionado</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <div className="space-y-6 pb-6">
            <ClientForm form={form} onSubmit={onSubmit} submitLabel="Actualizar cliente" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
