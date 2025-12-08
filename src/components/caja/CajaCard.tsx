import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, BarChart3, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CajaCardProps {
  caja: {
    id: number;
    caja: {
      id: number;
      nombre: string;
    };
    usuario: {
      id: number;
      nombre: string | null;
      email: string;
    };
    hora_apertura: string;
    monto_inicial: number;
    saldo_actual: number;
    total_ingresos: number;
    total_egresos: number;
    cantidad_transacciones: number;
    estado: "ABIERTA";
  };
}

/**
 * Card individual para cada caja abierta en el Monitor Activo
 * Muestra: cajero, hora apertura, saldo actual, alerta si saldo alto
 */
export default function CajaCard({ caja }: CajaCardProps) {
  const navigate = useNavigate();

  // Iniciales del usuario para avatar
  const nombreUsuario = caja.usuario.nombre || caja.usuario.email;
  const initials = nombreUsuario
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Formatear hora de apertura
  const horaApertura = format(new Date(caja.hora_apertura), "HH:mm", {
    locale: es,
  });

  // Alerta si el saldo es muy alto (riesgo de robo)
  const SALDO_ALTO_THRESHOLD = 5000;
  const saldoAlto = caja.saldo_actual > SALDO_ALTO_THRESHOLD;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{caja.caja.nombre}</CardTitle>
          </div>
          <Badge className="animate-pulse bg-green-500 hover:bg-green-600">
            🟢 ABIERTA
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Cajero */}
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{nombreUsuario}</p>
              <p className="text-xs text-muted-foreground">
                Desde {horaApertura}
              </p>
            </div>
          </div>

          {/* Saldo Actual (KPI Principal) */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Saldo Actual</p>
            <p className="text-2xl font-bold">
              S/ {caja.saldo_actual.toFixed(2)}
            </p>
          </div>

          {/* Alerta si saldo alto */}
          {saldoAlto && (
            <Alert variant="default" className="border-amber-500 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-700">
                Sugerencia: Realizar retiro parcial
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={() => navigate(`/dashboard/cajas/${caja.id}`)}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Gestionar / Arquear
        </Button>
      </CardFooter>
    </Card>
  );
}
