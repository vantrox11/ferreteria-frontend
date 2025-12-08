/**
 * Dashboard de Ventas V6 - Conectado a API Real con Orval
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from "@/components/ui/card";
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
import { useGetApiDashboardVentasEstadisticas } from "@/api/generated/dashboard/dashboard";

interface CategoriaRentabilidad {
  categoria: string
  ventas: number
  margenReal: number
  estado: "🟢 Excelente" | "🟢 Bueno" | "🟡 Normal" | "🟠 Volumen"
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
          {estado.replace('🟢 ', '').replace('🟡 ', '').replace('🟠 ', '')}
        </Badge>
      )
    },
  },
]

export default function DashboardVentasV6() {
  const [activeChannel, setActiveChannel] = useState<"fisica" | "web" | null>(null);

  // Calcular fechas del período (datos poblados están en noviembre 2024)
  const fechaFin = useMemo(() => new Date('2024-11-30'), []);
  const fechaInicio = useMemo(() => new Date('2024-11-01'), []);

  // Fetch data from API usando hook generado por Orval
  // Usar formato local para evitar desfase de zona horaria
  const formatFechaLocal = (fecha: Date) => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { data: estadisticas, isLoading, error } = useGetApiDashboardVentasEstadisticas({
    fecha_inicio: formatFechaLocal(fechaInicio),
    fecha_fin: formatFechaLocal(fechaFin),
  });

  // Formatear rango de fechas para mostrar
  const dateRange = useMemo(() => {
    const opciones: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const inicio = fechaInicio.toLocaleDateString('es-PE', opciones);
    const fin = fechaFin.toLocaleDateString('es-PE', opciones);
    return `${inicio} - ${fin}`;
  }, [fechaInicio, fechaFin]);

  // Calcular totales por canal
  const totales = useMemo(() => {
    if (!estadisticas) return { fisica: 0, web: 0 };
    
    const dataToUse = estadisticas.serie_temporal;

    return {
      fisica: dataToUse.reduce((acc, curr) => acc + curr.fisica, 0),
      web: dataToUse.reduce((acc, curr) => acc + curr.web, 0),
    };
  }, [estadisticas]);

  // Preparar datos para el gráfico con filtro de canal
  const chartData = useMemo(() => {
    if (!estadisticas) return [];
    
    return estadisticas.serie_temporal.map(punto => ({
      date: punto.date,
      costo: punto.costo,
      ganancia: punto.ganancia,
    }));
  }, [estadisticas, activeChannel]);

  // Preparar datos para tabla (mapear de API a formato de DataTable)
  const categoriasParaTabla: CategoriaRentabilidad[] = useMemo(() => {
    if (!estadisticas) return [];
    
    return estadisticas.rentabilidad_categorias.map(cat => ({
      categoria: cat.nombre,
      ventas: cat.ventas,
      margenReal: cat.margen,
      estado: cat.estado as any,
    }));
  }, [estadisticas]);

  // Loading y error states
  if (isLoading) {
    return (
      <div className="@container/main p-4 xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error || !estadisticas) {
    return (
      <div className="@container/main p-4 xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto">
        <div className="flex items-center justify-center h-96">
          <p className="text-destructive">Error al cargar las estadísticas del dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main p-4 xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto">
      <div className="space-y-4">
        {/* Fila 1: Header */}
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Dashboard de Ventas</h1>
          <div className="flex items-center space-x-2">
            <div className="grow">
              <div className="grid gap-2">
                <Button variant="outline" className="inline-flex items-center gap-2 h-9 px-4 py-2 justify-start text-left font-normal has-[&>svg]:px-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar" aria-hidden="true">
                    <path d="M8 2v4"></path>
                    <path d="M16 2v4"></path>
                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                    <path d="M3 10h18"></path>
                  </svg>
                  {dateRange}
                </Button>
              </div>
            </div>
            <Button variant="default" size="sm">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline">Descargar</span>
            </Button>
          </div>
        </div>

        {/* Fila 2: EXACTAMENTE como fila2.html */}
        <div className="gap-4 space-y-4 md:grid md:grid-cols-2 lg:space-y-0 xl:grid-cols-8">
          {/* Gráfico Principal - md:col-span-4, xl:col-span-4 */}
          <div className="md:col-span-4 xl:col-span-4">
            <Card className="relative h-full overflow-hidden">
              <CardHeader className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[data-slot=card-action]:grid-cols-[1fr_auto]">
                <CardTitle className="leading-none font-semibold">Rentabilidad Mensual</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  {activeChannel
                    ? `Mostrando solo ventas ${activeChannel === "fisica" ? "en tienda" : "por web"}`
                    : "Últimos 28 días"}
                </CardDescription>
                <CardAction className="row-span-2 self-start col-start-auto row-start-auto justify-self-start md:col-start-2 md:row-start-1 md:justify-self-end">
                  <div className="end-0 top-0 flex divide-x rounded-md border-s border-e border-t border-b md:absolute md:rounded-none md:rounded-bl-md md:border-e-transparent md:border-t-transparent">
                    <Button
                      variant="ghost"
                      data-active={activeChannel === "fisica"}
                      onClick={() => setActiveChannel(activeChannel === "fisica" ? null : "fisica")}
                      className="data-[active=true]:bg-muted relative flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left"
                    >
                      <span className="text-muted-foreground text-xs">Física</span>
                      <span className="font-display text-lg leading-none sm:text-2xl">
                        {(totales.fisica / 1000).toFixed(3)}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      data-active={activeChannel === "web"}
                      onClick={() => setActiveChannel(activeChannel === "web" ? null : "web")}
                      className="data-[active=true]:bg-muted relative flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left"
                    >
                      <span className="text-muted-foreground text-xs">Web</span>
                      <span className="font-display text-lg leading-none sm:text-2xl">
                        {(totales.web / 1000).toFixed(3)}
                      </span>
                    </Button>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent className="px-6">
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
                          const date = new Date(value);
                          return date.toLocaleDateString("es-PE", {
                            month: "short",
                            day: "numeric",
                          });
                        }}
                      />
                      <ChartTooltip content={<ChartTooltipContent className="w-[180px]" />} />
                      <Bar
                        dataKey="costo"
                        stackId="a"
                        fill="hsl(var(--muted-foreground))"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="ganancia"
                        stackId="a"
                        fill="hsl(var(--chart-2))"
                        radius={[0, 0, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPIs - md:col-span-4, xl:col-span-4 */}
          <div className="md:col-span-4 xl:col-span-4 col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* KPI 1: Ingreso Bruto */}
              <Card>
                <CardHeader className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
                  <CardDescription className="text-muted-foreground text-sm">Ingreso Bruto</CardDescription>
                  <CardTitle className="font-display text-2xl lg:text-3xl font-bold">S/ {estadisticas.kpis.ingresos_brutos.valor.toLocaleString('es-PE')}</CardTitle>
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
                </CardHeader>
              </Card>

              {/* KPI 2: Costo Mercadería */}
              <Card>
                <CardHeader className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
                  <CardDescription className="text-muted-foreground text-sm">Costo Mercadería</CardDescription>
                  <CardTitle className="font-display text-2xl lg:text-3xl font-bold">S/ {estadisticas.kpis.costo_mercaderia.valor.toLocaleString('es-PE')}</CardTitle>
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
                </CardHeader>
              </Card>

              {/* KPI 3: Utilidad Neta */}
              <Card>
                <CardHeader className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
                  <CardDescription className="text-muted-foreground text-sm">Utilidad Neta</CardDescription>
                  <CardTitle className="font-display text-2xl lg:text-3xl font-bold text-primary">S/ {estadisticas.kpis.utilidad_neta.valor.toLocaleString('es-PE')}</CardTitle>
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
                </CardHeader>
              </Card>

              {/* KPI 4: IGV Acumulado */}
              <Card>
                <CardHeader className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6">
                  <CardDescription className="text-muted-foreground text-sm">IGV Acumulado</CardDescription>
                  <CardTitle className="font-display text-2xl lg:text-3xl font-bold text-red-500 dark:text-orange-400">S/ {estadisticas.kpis.igv_acumulado.valor.toLocaleString('es-PE')}</CardTitle>
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
                </CardHeader>
              </Card>
          </div>
        </div>

        {/* Fila 3: Grid natural - Top Productos + Rentabilidad */}
        <div className="gap-4 space-y-4 xl:grid xl:grid-cols-8 lg:space-y-0">
          {/* Top Productos - xl:col-span-3 */}
          <div className="xl:col-span-3">
            <Card className="h-full">
              <CardHeader className="px-6">
                <CardTitle className="text-base font-semibold">Top Productos Rentables</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">Los que dejan más margen</CardDescription>
              </CardHeader>
              <CardContent className="px-6">
                <div className="space-y-2.5">
                  {estadisticas.top_productos_rentables.map((producto, index) => (
                    <div
                      key={producto.nombre}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg border transition-colors hover:bg-muted/30"
                    >
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
              </CardContent>
            </Card>
          </div>

          {/* Rentabilidad por Categoría - xl:col-span-5 */}
          <div className="xl:col-span-5">
            <Card className="h-full">
              <CardHeader className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[data-slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6">
                <CardTitle className="leading-none font-semibold">Rentabilidad por Categoría</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">Análisis de rentabilidad por categoría de productos</CardDescription>
                <CardAction className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                  <Button size="icon" variant="outline" className="size-9">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="px-6">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
