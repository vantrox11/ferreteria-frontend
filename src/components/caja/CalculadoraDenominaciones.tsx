import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface DenominacionItemProps {
  valor: number;
  label: string;
  cantidad: number;
  onChange: (cantidad: number) => void;
}

function DenominacionItem({
  valor,
  label,
  cantidad,
  onChange,
}: DenominacionItemProps) {
  return (
    <div className="flex items-center gap-4">
      <Badge variant="outline" className="w-20 justify-center font-mono">
        S/ {valor.toFixed(2)}
      </Badge>
      <input
        type="number"
        min="0"
        step="1"
        value={cantidad || 0}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-24 px-3 py-2 border rounded-md text-center"
      />
      <span className="text-sm text-muted-foreground min-w-[80px]">
        {label}
      </span>
      <span className="font-mono font-semibold ml-auto text-right min-w-[100px]">
        S/ {(cantidad * valor).toFixed(2)}
      </span>
    </div>
  );
}

interface CalculadoraDenominacionesProps {
  onChange: (total: number) => void;
}

const denominaciones = [
  { valor: 200, label: "Billetes 200" },
  { valor: 100, label: "Billetes 100" },
  { valor: 50, label: "Billetes 50" },
  { valor: 20, label: "Billetes 20" },
  { valor: 10, label: "Billetes 10" },
  { valor: 5, label: "Monedas 5" },
  { valor: 2, label: "Monedas 2" },
  { valor: 1, label: "Monedas 1" },
  { valor: 0.5, label: "Monedas 0.50" },
  { valor: 0.2, label: "Monedas 0.20" },
  { valor: 0.1, label: "Monedas 0.10" },
];

export function CalculadoraDenominaciones({
  onChange,
}: CalculadoraDenominacionesProps) {
  const [cantidades, setCantidades] = useState<Record<number, number>>({});

  const handleChange = (valor: number, cantidad: number) => {
    const nuevasCantidades = { ...cantidades, [valor]: cantidad };
    setCantidades(nuevasCantidades);

    const total = denominaciones.reduce((sum, d) => {
      return sum + (nuevasCantidades[d.valor] || 0) * d.valor;
    }, 0);

    onChange(total);
  };

  const totalCalculado = denominaciones.reduce((sum, d) => {
    return sum + (cantidades[d.valor] || 0) * d.valor;
  }, 0);

  return (
    <div className="space-y-3">
      {denominaciones.map((d) => (
        <DenominacionItem
          key={d.valor}
          valor={d.valor}
          label={d.label}
          cantidad={cantidades[d.valor] || 0}
          onChange={(cantidad) => handleChange(d.valor, cantidad)}
        />
      ))}

      <div className="h-px bg-border my-4" />

      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <span className="font-semibold text-lg">Total Calculado:</span>
        <span className="text-3xl font-mono font-bold text-primary">
          S/ {totalCalculado.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
