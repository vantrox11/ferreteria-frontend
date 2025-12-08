import {
  Receipt,
  DollarSign,
  CornerUpLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Resumen {
  cantidad_ventas: number;
  ticket_promedio: number;
  cantidad_devoluciones: number;
  monto_devoluciones: number;
}

interface ResumenOperativoProps {
  resumen: Resumen;
}

interface StatItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueExtra?: string;
  variant?: "default" | "destructive";
}

function StatItem({
  label,
  value,
  icon,
  valueExtra,
  variant = "default",
}: StatItemProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center",
          variant === "default"
            ? "bg-blue-50 text-blue-600"
            : "bg-red-50 text-red-600"
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-bold font-mono">{value}</p>
          {valueExtra && (
            <span className="text-sm text-muted-foreground">
              {valueExtra}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ResumenOperativo({ resumen }: ResumenOperativoProps) {
  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen Operativo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <StatItem
            label="Cantidad de Ventas"
            value={`${resumen.cantidad_ventas} tickets`}
            icon={<Receipt className="h-5 w-5" />}
          />
          <StatItem
            label="Ticket Promedio"
            value={formatCurrency(resumen.ticket_promedio)}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatItem
            label="Cantidad de Devoluciones"
            value={`${resumen.cantidad_devoluciones}`}
            icon={<CornerUpLeft className="h-5 w-5" />}
            valueExtra={`(${formatCurrency(resumen.monto_devoluciones)})`}
            variant="destructive"
          />
        </div>
      </CardContent>
    </Card>
  );
}
