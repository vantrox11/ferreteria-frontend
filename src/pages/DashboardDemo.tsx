/**
 * Dashboard Demo - Versión de demostración con datos placeholder
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface CategoriaRentabilidad {
  categoria: string
  ventas: number
  margenReal: number
  estado: string
}

const chartConfig = {
  costo: {
    label: "Costo",
    color: "hsl(var(--muted-foreground))",
  },
  ganancia: {
    label: "Ganancia",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

// Datos de demostración
const DEMO_DATA = {
  kpis: {
    ingresos_brutos: {
      valor: 125450.50,
      comparacion_periodo_anterior: 12.5,
    },
    costo_mercaderia: {
      valor: 68250.75,
      comparacion_periodo_anterior: 8.3,
    },
    utilidad_neta: {
      valor: 57199.75,
      comparacion_periodo_anterior: 18.7,
    },
    igv_acumulado: {
      valor: 22581.09,
      comparacion_periodo_anterior: 12.5,
    },
  },
  margen_bruto_porcentaje: 45.6,
  serie_temporal: [
    { date: "2024-10-29", costo: 2100, ganancia: 1800 },
    { date: "2024-10-30", costo: 2300, ganancia: 2100 },
    { date: "2024-10-31", costo: 1900, ganancia: 1650 },
    { date: "2024-11-01", costo: 2400, ganancia: 2200 },
    { date: "2024-11-02", costo: 2200, ganancia: 1900 },
    { date: "2024-11-03", costo: 1800, ganancia: 1500 },
    { date: "2024-11-04", costo: 2500, ganancia: 2350 },
    { date: "2024-11-05", costo: 2600, ganancia: 2400 },
    { date: "2024-11-06", costo: 2100, ganancia: 1850 },
    { date: "2024-11-07", costo: 2300, ganancia: 2050 },
    { date: "2024-11-08", costo: 2400, ganancia: 2200 },
    { date: "2024-11-09", costo: 1950, ganancia: 1700 },
    { date: "2024-11-10", costo: 2200, ganancia: 1950 },
    { date: "2024-11-11", costo: 2700, ganancia: 2550 },
    { date: "2024-11-12", costo: 2350, ganancia: 2100 },
    { date: "2024-11-13", costo: 2150, ganancia: 1900 },
    { date: "2024-11-14", costo: 2400, ganancia: 2200 },
    { date: "2024-11-15", costo: 2100, ganancia: 1850 },
    { date: "2024-11-16", costo: 1900, ganancia: 1650 },
    { date: "2024-11-17", costo: 2300, ganancia: 2050 },
    { date: "2024-11-18", costo: 2500, ganancia: 2300 },
    { date: "2024-11-19", costo: 2200, ganancia: 1950 },
    { date: "2024-11-20", costo: 2400, ganancia: 2150 },
    { date: "2024-11-21", costo: 2600, ganancia: 2400 },
    { date: "2024-11-22", costo: 2100, ganancia: 1850 },
    { date: "2024-11-23", costo: 2300, ganancia: 2050 },
    { date: "2024-11-24", costo: 2500, ganancia: 2300 },
    { date: "2024-11-25", costo: 2450, ganancia: 2250 },
  ],
  top_productos_rentables: [
    { nombre: "Cemento Portland Tipo I 42.5kg", unidades: 450, margen: 38 },
    { nombre: "Fierro Corrugado 1/2\" x 9m", unidades: 320, margen: 35 },
    { nombre: "Ladrillo King Kong 18 huecos", unidades: 2850, margen: 32 },
    { nombre: "Arena Gruesa m³", unidades: 185, margen: 28 },
    { nombre: "Pintura Látex Blanco 5 Galones", unidades: 95, margen: 42 },
  ],
  rentabilidad_categorias: [
    { nombre: "Pinturas", ventas: 28500.50, margen: 42, estado: "Excelente" },
    { nombre: "Cemento y Agregados", ventas: 35200.75, margen: 35, estado: "Excelente" },
    { nombre: "Fierros y Aceros", ventas: 22150.25, margen: 32, estado: "Bueno" },
    { nombre: "Materiales de Construcción", ventas: 18900.00, margen: 28, estado: "Bueno" },
    { nombre: "Herramientas Manuales", ventas: 12350.50, margen: 22, estado: "Normal" },
    { nombre: "Materiales Eléctricos", ventas: 8348.50, margen: 18, estado: "Normal" },
  ],
};

const columns: ColumnDef<CategoriaRentabilidad>[] = [
  {
    accessorKey: "categoria",
    header: "Categoría",
  },
  {
    accessorKey: "ventas",
    header: "Ventas (S/)",
    cell: ({ row }) => {
      const ventas = row.getValue("ventas") as number
      return `S/ ${ventas.toLocaleString("es-PE")}`
    },
  },
  {
    accessorKey: "margenReal",
    header: "Margen Real",
    cell: ({ row }) => {
      const margen = row.getValue("margenReal") as number
      return `${margen}%`
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string
      const variant = estado.includes('Excelente') ? 'default' : 
                     estado.includes('Bueno') ? 'secondary' : 
                     estado.includes('Normal') ? 'outline' : 'destructive'
      return (
        <Badge variant={variant} className="shadow-none">
          {estado}
        </Badge>
      )
    },
  },
];

export default function DashboardDemo() {
  const [activeChannel, setActiveChannel] = useState<"fisica" | "web" | null>(null);

  const estadisticas = DEMO_DATA;
  const dateRange = "29 de octubre de 2024 - 25 de noviembre de 2024";

  const chartData = estadisticas.serie_temporal.map(punto => ({
    date: punto.date,
    costo: punto.costo,
    ganancia: punto.ganancia,
  }));

  const categoriasParaTabla: CategoriaRentabilidad[] = estadisticas.rentabilidad_categorias.map(cat => ({
    categoria: cat.nombre,
    ventas: cat.ventas,
    margenReal: cat.margen,
    estado: cat.estado,
  }));

  return (
    <div className="@container/main p-4 xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto">
      <div className="space-y-4">
        {/* Fila 1: Header */}
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Dashboard de Ventas</h1>
          <div className="flex items-center space-x-2">
            <div className="grow">
              <div className="grid gap-2">
                <button className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[&>svg]:px-3 justify-start text-left font-normal">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar" aria-hidden="true">
                    <path d="M8 2v4"></path>
                    <path d="M16 2v4"></path>
                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                    <path d="M3 10h18"></path>
                  </svg>
                  {dateRange}
                </button>
              </div>
            </div>
            <Button variant="default" size="sm">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline">Descargar</span>
            </Button>
          </div>
        </div>

        {/* Fila 2: Grid principal */}
        <div className="gap-4 space-y-4 md:grid md:grid-cols-2 lg:space-y-0 xl:grid-cols-8">
          {/* Gráfico Principal */}
          <div className="md:col-span-4 xl:col-span-4">
            <div data-slot="card" className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 relative h-full overflow-hidden">
              <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[data-slot=card-action]:grid-cols-[1fr_auto]">
                <div data-slot="card-title" className="leading-none font-semibold">Rentabilidad Mensual</div>
                <div data-slot="card-description" className="text-muted-foreground text-sm">
                  {activeChannel
                    ? `Mostrando solo ventas ${activeChannel === "fisica" ? "en tienda" : "por web"}`
                    : "Últimos 28 días"}
                </div>
                <div data-slot="card-action" className="row-span-2 self-start col-start-auto row-start-auto justify-self-start md:col-start-2 md:row-start-1 md:justify-self-end">
                  <div className="end-0 top-0 flex divide-x rounded-md border-s border-e border-t border-b md:absolute md:rounded-none md:rounded-bl-md md:border-e-transparent md:border-t-transparent">
                    <button
                      data-active={activeChannel === "fisica"}
                      onClick={() => setActiveChannel(activeChannel === "fisica" ? null : "fisica")}
                      className="data-[active=true]:bg-muted relative flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left"
                    >
                      <span className="text-muted-foreground text-xs">Física</span>
                      <span className="font-display text-lg leading-none sm:text-2xl">
                        95.5
                      </span>
                    </button>
                    <button
                      data-active={activeChannel === "web"}
                      onClick={() => setActiveChannel(activeChannel === "web" ? null : "web")}
                      className="data-[active=true]:bg-muted relative flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left"
                    >
                      <span className="text-muted-foreground text-xs">Web</span>
                      <span className="font-display text-lg leading-none sm:text-2xl">
                        29.9
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div data-slot="card-content" className="px-6">
                <div data-slot="chart" className="[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden h-[186px] w-full">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <BarChart
                      accessibilityLayer
                      data={chartData}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        tickFormatter={(value) => {
                          const date = new Date(value)
                          return date.toLocaleDateString("es-PE", {
                            month: "short",
                            day: "numeric",
                          })
                        }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="w-[150px]"
                            nameKey="views"
                            labelFormatter={(value) => {
                              return new Date(value).toLocaleDateString("es-PE", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            }}
                          />
                        }
                      />
                      <Bar dataKey="costo" stackId="a" fill="var(--color-costo)" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="ganancia" stackId="a" fill="var(--color-ganancia)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de KPIs 2x2 */}
          <div className="md:col-span-4 xl:col-span-4 col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* KPI 1: Ingreso Bruto */}
              <div data-slot="card" className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6">
                <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
                  <div data-slot="card-description" className="text-muted-foreground text-sm">Ingreso Bruto</div>
                  <div className="font-display text-2xl lg:text-3xl font-bold">S/ {estadisticas.kpis.ingresos_brutos.valor.toLocaleString('es-PE')}</div>
                  <div className="flex items-center text-xs">
                    {estadisticas.kpis.ingresos_brutos.comparacion_periodo_anterior >= 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up mr-1 size-3 text-green-500" aria-hidden="true">
                        <path d="m5 12 7-7 7 7"></path>
                        <path d="M12 19V5"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down mr-1 size-3 text-red-500" aria-hidden="true">
                        <path d="M12 5v14"></path>
                        <path d="m19 12-7 7-7-7"></path>
                      </svg>
                    )}
                    <span className={`font-medium ${estadisticas.kpis.ingresos_brutos.comparacion_periodo_anterior >= 0 ? 'text-green-500' : 'text-red-500'}`}>{Math.abs(estadisticas.kpis.ingresos_brutos.comparacion_periodo_anterior).toFixed(1)}%</span>
                    <span className="text-muted-foreground ml-1">vs mes anterior</span>
                  </div>
                </div>
              </div>

              {/* KPI 2: Costo Mercadería */}
              <div data-slot="card" className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6">
                <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
                  <div data-slot="card-description" className="text-muted-foreground text-sm">Costo Mercadería</div>
                  <div className="font-display text-2xl lg:text-3xl font-bold">S/ {estadisticas.kpis.costo_mercaderia.valor.toLocaleString('es-PE')}</div>
                  <div className="flex items-center text-xs">
                    {estadisticas.kpis.costo_mercaderia.comparacion_periodo_anterior <= 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down mr-1 size-3 text-green-500" aria-hidden="true">
                        <path d="M12 5v14"></path>
                        <path d="m19 12-7 7-7-7"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up mr-1 size-3 text-red-500" aria-hidden="true">
                        <path d="m5 12 7-7 7 7"></path>
                        <path d="M12 19V5"></path>
                      </svg>
                    )}
                    <span className={`font-medium ${estadisticas.kpis.costo_mercaderia.comparacion_periodo_anterior <= 0 ? 'text-green-500' : 'text-red-500'}`}>{Math.abs(estadisticas.kpis.costo_mercaderia.comparacion_periodo_anterior).toFixed(1)}%</span>
                    <span className="text-muted-foreground ml-1">vs mes anterior</span>
                  </div>
                </div>
              </div>

              {/* KPI 3: Utilidad Neta */}
              <div data-slot="card" className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6">
                <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
                  <div data-slot="card-description" className="text-muted-foreground text-sm">Utilidad Neta</div>
                  <div className="font-display text-2xl lg:text-3xl font-bold text-primary">S/ {estadisticas.kpis.utilidad_neta.valor.toLocaleString('es-PE')}</div>
                  <div className="flex items-center text-xs">
                    {estadisticas.kpis.utilidad_neta.comparacion_periodo_anterior >= 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up mr-1 size-3 text-green-500" aria-hidden="true">
                        <path d="m5 12 7-7 7 7"></path>
                        <path d="M12 19V5"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down mr-1 size-3 text-red-500" aria-hidden="true">
                        <path d="M12 5v14"></path>
                        <path d="m19 12-7 7-7-7"></path>
                      </svg>
                    )}
                    <span className={`font-medium ${estadisticas.kpis.utilidad_neta.comparacion_periodo_anterior >= 0 ? 'text-green-500' : 'text-red-500'}`}>{Math.abs(estadisticas.kpis.utilidad_neta.comparacion_periodo_anterior).toFixed(1)}%</span>
                    <span className="text-muted-foreground ml-1">Margen: {estadisticas.margen_bruto_porcentaje.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* KPI 4: IGV Acumulado */}
              <div data-slot="card" className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6">
                <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
                  <div data-slot="card-description" className="text-muted-foreground text-sm">IGV Acumulado</div>
                  <div className="font-display text-2xl lg:text-3xl font-bold text-red-500 dark:text-orange-400">S/ {estadisticas.kpis.igv_acumulado.valor.toLocaleString('es-PE')}</div>
                  <div className="flex items-center text-xs">
                    {estadisticas.kpis.igv_acumulado.comparacion_periodo_anterior >= 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up mr-1 size-3 text-red-500" aria-hidden="true">
                        <path d="m5 12 7-7 7 7"></path>
                        <path d="M12 19V5"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down mr-1 size-3 text-green-500" aria-hidden="true">
                        <path d="M12 5v14"></path>
                        <path d="m19 12-7 7-7-7"></path>
                      </svg>
                    )}
                    <span className={`font-medium ${estadisticas.kpis.igv_acumulado.comparacion_periodo_anterior >= 0 ? 'text-red-500' : 'text-green-500'}`}>{Math.abs(estadisticas.kpis.igv_acumulado.comparacion_periodo_anterior).toFixed(1)}%</span>
                    <span className="text-muted-foreground ml-1">Deuda fiscal</span>
                  </div>
                </div>
              </div>
          </div>
        </div>

        {/* Fila 3: Top Productos y Rentabilidad Categorías */}
        <div className="gap-4 space-y-4 md:grid md:grid-cols-2 lg:space-y-0 xl:grid-cols-8">
          {/* Top 5 Productos Rentables - xl:col-span-3 */}
          <div className="xl:col-span-3">
            <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 h-full">
              <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[data-slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6">
                <div data-slot="card-title" className="leading-none font-semibold">Top 5 Productos Rentables</div>
                <div data-slot="card-description" className="text-muted-foreground text-sm">Por margen de ganancia</div>
                <div data-slot="card-action" className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                  <button data-slot="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6">
                <div className="space-y-2.5">
                  {estadisticas.top_productos_rentables.map((producto, index) => (
                    <div key={index} className="flex items-center gap-3 py-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight truncate">{producto.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{producto.unidades} unidades</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 shadow-none font-semibold">
                        {producto.margen}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rentabilidad por Categoría - xl:col-span-5 */}
          <div className="xl:col-span-5">
            <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 h-full">
              <div data-slot="card-header" className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[data-slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6">
                <div data-slot="card-title" className="leading-none font-semibold">Rentabilidad por Categoría</div>
                <div data-slot="card-description" className="text-muted-foreground text-sm">Análisis de rentabilidad por categoría de productos</div>
                <div data-slot="card-action" className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                  <button data-slot="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6">
                {/* Visualización con Progress Bars en Horizontal */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-2 gap-3 mb-6">
                  {estadisticas.rentabilidad_categorias.slice(0, 6).map((cat) => {
                    const porcentajeVentas = (cat.ventas / estadisticas.kpis.ingresos_brutos.valor) * 100;
                    const badgeVariant = cat.margen >= 35 ? 'default' : 
                                        cat.margen >= 20 ? 'secondary' : 
                                        cat.margen >= 15 ? 'outline' : 'destructive';
                    return (
                      <div key={cat.nombre} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">{cat.nombre}</span>
                          <Badge variant={badgeVariant} className="shadow-none text-[10px] h-4 px-1.5">
                            {cat.margen}%
                          </Badge>
                        </div>
                        <Progress value={porcentajeVentas} className="h-2 shadow-none" />
                        <span className="text-[10px] text-muted-foreground">
                          S/ {(cat.ventas / 1000).toFixed(1)}K
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Tabla Detallada con DataTable */}
                <DataTable 
                  columns={columns} 
                  data={categoriasParaTabla}
                  searchKey="categoria"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
