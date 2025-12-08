// Página de registro de nuevo tenant
import { useState } from "react";
import { Link } from "react-router-dom";
import { usePostApiAuthRegister } from "@/api/generated/autenticación/autenticación";
import AuthLayout from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// Iconos eliminados para un estilo más minimalista

export default function RegisterPage() {
  const [nombre_empresa, setNombreEmpresa] = useState("");
  const [subdominio, setSubdominio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const registerMutation = usePostApiAuthRegister({
    mutation: {
      onSuccess: (data) => {
        setSuccess(data.message || "Registro exitoso. Revisa tu consola para la activación manual");
        console.log("Registro de tenant", data);
      },
      onError: (err: any) => {
        console.error("=== ERROR REGISTRO ===");
        console.error("Full error:", err);
        console.error("Error response data (JSON):", JSON.stringify(err?.response?.data, null, 2));
        console.error("Status:", err?.response?.status);
        
        let apiMsg = "Error en el registro";
        const errorData = err?.response?.data;
        
        if (errorData?.error) {
          apiMsg = errorData.error;
        } else if (errorData?.message) {
          apiMsg = errorData.message;
        } else if (err?.message) {
          apiMsg = err.message;
        }
        
        if (errorData?.details) {
          apiMsg += ` - Detalles: ${JSON.stringify(errorData.details)}`;
        }
        
        setError(apiMsg);
      },
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validaciones frontend
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    
    if (!/^[a-z0-9-]+$/.test(subdominio)) {
      setError("El subdominio solo puede contener letras minúsculas, números y guiones");
      return;
    }
    
    console.log("=== REGISTRO DEBUG ===");
    console.log("Payload a enviar:", JSON.stringify({
      nombre_empresa,
      subdominio,
      email,
      password,
    }, null, 2));
    
    registerMutation.mutate({
      data: {
        nombre_empresa,
        subdominio,
        email,
        password,
      },
    });
  }

  return (
    <AuthLayout
      title="Crear nueva cuenta"
      subtitle="Configura tu empresa y subdominio para empezar"
      variant="centered"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="nombre_empresa">Nombre de la empresa</Label>
          <Input
            id="nombre_empresa"
            value={nombre_empresa}
            onChange={(e) => setNombreEmpresa(e.target.value)}
            placeholder="Mi Ferretería S.A."
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="subdominio">Subdominio</Label>
          <Input
            id="subdominio"
            value={subdominio}
            onChange={(e) => setSubdominio(e.target.value.toLowerCase())}
            placeholder="central"
            required
          />
          <p className="text-xs text-muted-foreground">
            Solo minúsculas, números y guiones. Ejemplo: ferreteria-central
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@empresa.com"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <p className="text-xs text-muted-foreground">
            Mínimo 8 caracteres
          </p>
        </div>
        {error && (
          <div className="text-red-600 text-sm" aria-live="assertive">{error}</div>
        )}
        {success && (
          <div className="text-green-600 text-sm" aria-live="polite">{success}</div>
        )}
        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Registrando..." : "Registrar"}
        </Button>
        <div className="text-center text-sm">
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="underline underline-offset-4">
            Inicia sesión
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
