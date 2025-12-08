// Página de inicio de sesión
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePostApiAuthLogin } from "@/api/generated/autenticación/autenticación";
import { useAuth } from "@/auth/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = usePostApiAuthLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token, {
          id: data.user.id,
          email: data.user.email,
          nombre: data.user.nombre,
          rol: data.user.rol,
        });
        navigate("/dashboard", { replace: true });
      },
      onError: (err: any) => {
        const apiMsg = 
          err?.response?.data?.message || 
          err?.message || 
          "Credenciales inválidas";
        setError(apiMsg);
      },
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    loginMutation.mutate({ data: { email, password } });
  }

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Usa tu email de empresa para ingresar"
      variant="centered"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link to="#" className="text-sm underline-offset-2 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm text-muted-foreground">Recordarme</Label>
        </div>
        {error && (
          <div className="text-red-600 text-sm" aria-live="assertive">{error}</div>
        )}
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Ingresando..." : "Entrar"}
        </Button>
        <div className="text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link to="/register" className="underline underline-offset-4">
            Regístrate
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
