import {
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface DesgloseMetodos {
  EFECTIVO: number;
  TARJETA: number;
  YAPE: number;
  PLIN: number;
  TRANSFERENCIA: number;
}

interface DesgloseMetodosPagoProps {
  desglose: DesgloseMetodos;
}

interface MetodoItemProps {
  icon: React.ReactNode;
  label: string;
  monto: number;
  note?: string;
}

function MetodoItem({ icon, label, monto, note }: MetodoItemProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="font-medium">{label}</p>
          {note && (
            <p className="text-xs text-muted-foreground">{note}</p>
          )}
        </div>
      </div>
      <p className="text-lg font-bold font-mono">S/ {monto.toFixed(2)}</p>
    </div>
  );
}

export function DesgloseMetodosPago({ desglose }: DesgloseMetodosPagoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Por Método de Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <MetodoItem
            icon={<Banknote className="h-5 w-5" />}
            label="Efectivo"
            monto={desglose.EFECTIVO}
            note="Lo que debe haber en el cajón"
          />
          <Separator />
          <MetodoItem
            icon={<CreditCard className="h-5 w-5" />}
            label="Tarjetas"
            monto={desglose.TARJETA}
            note="Debe cuadrar con el cierre del POS"
          />
          <Separator />
          <MetodoItem
            icon={<Smartphone className="h-5 w-5" />}
            label="Billeteras (Yape/Plin)"
            monto={desglose.YAPE + desglose.PLIN}
            note="Debe cuadrar con el celular"
          />
          <Separator />
          <MetodoItem
            icon={<Building2 className="h-5 w-5" />}
            label="Transferencias"
            monto={desglose.TRANSFERENCIA}
          />
        </div>
      </CardContent>
    </Card>
  );
}
