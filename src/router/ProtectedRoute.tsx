// Componente de ruta protegida que requiere autenticación
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "@/auth/token";

export default function ProtectedRoute() {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    // Si no hay token, redirige a la página principal
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Si hay token, muestra el contenido de la ruta anidada (ej. DashboardShell)
  return <Outlet />;
}
