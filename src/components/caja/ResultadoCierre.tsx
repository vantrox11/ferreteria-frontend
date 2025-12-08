import { CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResultadoCierreProps {
  montoTeorico: number;
  montoReal: number;
  diferencia: number;
  onClose: () => void;
}

export function ResultadoCierre({
  montoTeorico,
  montoReal,
  diferencia,
  onClose,
}: ResultadoCierreProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        {diferencia === 0 ? (
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        ) : (
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        )}

        <h3 className="text-2xl font-bold">
          {diferencia === 0 ? "¡Caja Cuadrada!" : "Cierre con Diferencia"}
        </h3>
        <p className="text-muted-foreground mt-2">
          {diferencia === 0
            ? "El arqueo coincide exactamente con el saldo teórico"
            : "Se ha detectado una diferencia en el arqueo"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Teórico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-bold">
              S/ {montoTeorico.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-bold">
              S/ {montoReal.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className={diferencia !== 0 ? "border-amber-500 border-2" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Diferencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-mono font-bold",
                diferencia < 0
                  ? "text-red-600"
                  : diferencia > 0
                    ? "text-blue-600"
                    : "text-green-600"
              )}
            >
              {diferencia > 0 && "+"} S/ {diferencia.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {diferencia !== 0 && (
        <Alert variant="default" className="border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Se ha registrado el cierre con una diferencia de{" "}
            <strong>{diferencia > 0 ? "sobrante" : "faltante"}</strong> de S/{" "}
            {Math.abs(diferencia).toFixed(2)}. El administrador ha sido
            notificado para su revisión.
          </AlertDescription>
        </Alert>
      )}

      <Button className="w-full" size="lg" onClick={onClose}>
        Finalizar
      </Button>
    </div>
  );
}
