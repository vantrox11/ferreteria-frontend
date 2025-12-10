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
import UserForm from "@/components/UserForm";
import { toast } from "sonner";
import { usePostApiUsuarios } from "@/api/generated/usuarios/usuarios";
import type { Usuario, UsuarioRol } from "@/api/generated/model";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/api-error";

type UsuarioCreateInput = {
  email: string;
  password: string;
  nombre?: string;
  rol: UsuarioRol;
};

const createUserSchema = z.object({
  email: z.string().min(1, "El email es obligatorio").email("Email inválido"),
  nombre: z
    .string()
    .trim()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(8, "Debe tener al menos 8 caracteres"),
  rol: z.enum(["admin", "empleado"] as [UsuarioRol, UsuarioRol]),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

type CreateUserDialogProps = {
  onCreated?: (usuario: Usuario) => void;
};

export default function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: createUsuario } = usePostApiUsuarios();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", nombre: "", password: "", rol: "empleado" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset({ email: "", nombre: "", password: "", rol: "empleado" });
    }
  }, [open, form]);

  async function onSubmit(values: CreateUserFormValues) {
    try {
      const payload: UsuarioCreateInput = {
        email: values.email,
        password: values.password,
        nombre: values.nombre ? values.nombre : undefined,
        rol: values.rol,
      };

      const created = await createUsuario({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ['api', 'usuarios'] });
      toast.success("Usuario creado correctamente");
      onCreated?.(created);
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al crear el usuario"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" /> Crear Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle>Crear usuario</DialogTitle>
            <DialogDescription>Completa los datos para registrar un nuevo usuario.</DialogDescription>
          </DialogHeader>
        </div>
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <UserForm form={form} onSubmit={onSubmit} submitLabel="Crear usuario" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
