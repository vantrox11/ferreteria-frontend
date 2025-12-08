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
import UserForm from "@/components/UserForm";
import { toast } from "sonner";
import { usePutApiUsuariosId } from "@/api/generated/usuarios/usuarios";
import type { Usuario, RolUsuario } from "@/api/generated/model";
import { useQueryClient } from "@tanstack/react-query";

type UsuarioUpdateInput = {
  email?: string;
  password?: string;
  nombre?: string;
  rol?: RolUsuario;
};

const editUserSchema = z.object({
  email: z.string().min(1, "El email es obligatorio").email("Email inválido"),
  nombre: z
    .string()
    .trim()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((val) => val === undefined || val === "" || val.length >= 6, {
      message: "Debe tener al menos 6 caracteres",
    }),
  rol: z.enum(["admin", "empleado"] as [RolUsuario, RolUsuario]),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

type EditUserDialogProps = {
  usuario: Usuario;
  onUpdated?: (usuario: Usuario) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function EditUserDialog({ usuario, onUpdated, children, open: controlledOpen, onOpenChange }: EditUserDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const { mutateAsync: updateUsuario } = usePutApiUsuariosId();

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: usuario.email,
      nombre: usuario.nombre ?? "",
      password: "",
      rol: usuario.rol,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        email: usuario.email,
        nombre: usuario.nombre ?? "",
        password: "",
        rol: usuario.rol,
      });
    }
  }, [open, form, usuario.email, usuario.nombre, usuario.rol]);

  async function onSubmit(values: EditUserFormValues) {
    try {
      const email = values.email.trim().toLowerCase();
      const nombreTrim = (values.nombre ?? "").trim();
      const passwordTrim = (values.password ?? "").trim();

      const payload: UsuarioUpdateInput = {
        email,
        rol: values.rol,
      };

      // Mantener comportamiento: nombre vacío explícito limpia el nombre en backend
      if (values.nombre === "") {
        payload.nombre = "";
      } else if (nombreTrim) {
        payload.nombre = nombreTrim;
      }

      if (passwordTrim) {
        payload.password = passwordTrim;
      }

      const updated = await updateUsuario({ id: usuario.id!, data: payload });
      await queryClient.invalidateQueries({ queryKey: ['api', 'usuarios'] });
      toast.success("Usuario actualizado correctamente");
      onUpdated?.(updated);
      setOpen(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Error al actualizar el usuario";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>Actualiza los datos del usuario seleccionado.</DialogDescription>
          </DialogHeader>
        </div>
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <UserForm form={form} onSubmit={onSubmit} submitLabel="Actualizar usuario" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
