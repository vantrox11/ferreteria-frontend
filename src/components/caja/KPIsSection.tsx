import {
  Flag,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calculator,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPI {
  saldo_inicial: number;
  total_ingresos: number;
  total_egresos: number;
  saldo_teorico: number;
  monto_real?: number | null;
  diferencia?: number | null;
}

interface KPIsSectionProps {
  kpis: KPI;
  estado: "ABIERTA" | "CERRADA";
}

interface KPICardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: "slate" | "green" | "red" | "blue" | "purple";
}

function KPICard({ icon, title, value, color }: KPICardProps) {
  const colorClasses = {
    slate: "bg-slate-50 border-slate-200 text-slate-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };

  const iconClasses = {
    slate: "text-slate-500",
    green: "text-green-500",
    red: "text-red-500",
    blue: "text-blue-500",
    purple: "text-purple-500",
  };

  return (
    <Card className={cn("border-2", colorClasses[color])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("h-8 w-8", iconClasses[color])}>{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold font-mono">{value}</p>
      </CardContent>
    </Card>
  );
}

export function KPIsSection({ kpis, estado }: KPIsSectionProps) {
  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toFixed(2)}`;
  };

  const diferencia = kpis.diferencia ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        icon={<Flag className="h-5 w-5" />}
        title="Saldo Inicial"
        value={formatCurrency(kpis.saldo_inicial)}
        color="slate"
      />

      <KPICard
        icon={<TrendingUp className="h-5 w-5" />}
        title="Total Ingresos"
        value={formatCurrency(kpis.total_ingresos)}
        color="green"
      />

      <KPICard
        icon={<TrendingDown className="h-5 w-5" />}
        title="Total Egresos"
        value={formatCurrency(kpis.total_egresos)}
        color="red"
      />

      <KPICard
        icon={<Wallet className="h-5 w-5" />}
        title="Saldo en Caja (Teórico)"
        value={formatCurrency(kpis.saldo_teorico)}
        color="blue"
      />

      {/* Si cerrada, agregar 2 KPIs más */}
      {estado === "CERRADA" && kpis.monto_real !== null && kpis.monto_real !== undefined && (
        <>
          <KPICard
            icon={<Calculator className="h-5 w-5" />}
            title="Monto Real Contado"
            value={formatCurrency(kpis.monto_real)}
            color="purple"
          />

          <KPICard
            icon={
              diferencia === 0 ? (
                <Check className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )
            }
            title="Diferencia"
            value={formatCurrency(diferencia)}
            color={diferencia === 0 ? "green" : diferencia < 0 ? "red" : "blue"}
          />
        </>
      )}
    </div>
  );
}
