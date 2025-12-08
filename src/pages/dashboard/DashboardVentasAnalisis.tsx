// Dashboard de Ventas (Análisis Comercial)
// Inteligencia de Negocio - Entender qué se vende, cómo y a quién

import { useState } from 'react';
import { useGetApiDashboardVentasAnalisis } from '@/api/generated/dashboard/dashboard';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Percent, 
  CreditCard, 
  FileX,
  RefreshCcw,
  Calendar,
  DollarSign,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function DashboardVentasAnalisisPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data, isLoading, error, refetch } = useGetApiDashboardVentasAnalisis({
    fecha_inicio: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    fecha_fin: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  });

  if (isLoading) return <DashboardSkeleton />;
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">Error al cargar el dashboard</p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Ventas</h1>
          <p className="text-muted-foreground">Análisis Comercial e Inteligencia de Negocio</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd MMM', { locale: es })} - {format(dateRange.to, 'dd MMM yyyy', { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, 'dd MMM yyyy', { locale: es })
                  )
                ) : (
                  <span>Últimos 30 días</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fila 1: KPIs de Rendimiento */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ticket Promedio"
          value={formatCurrency(data.kpis.ticket_promedio.valor)}
          icon={<TrendingUp />}
          trend={{
            value: data.kpis.ticket_promedio.comparacion_mes_anterior,
            label: 'vs. mes anterior',
          }}
          colorClass="text-blue-600"
        />

        <StatCard
          title="Margen de Ganancia"
          value={`${data.kpis.margen_ganancia.porcentaje.toFixed(1)}%`}
          icon={<Percent />}
          colorClass="text-green-600"
        />

        <StatCard
          title="Ratio Contado/Crédito"
          value={`${data.kpis.ratio_contado_credito.contado_porcentaje.toFixed(0)}% / ${data.kpis.ratio_contado_credito.credito_porcentaje.toFixed(0)}%`}
          icon={<CreditCard />}
          colorClass="text-purple-600"
        />

        <StatCard
          title="Notas de Crédito"
          value={formatCurrency(data.kpis.notas_credito.monto_total)}
          icon={<FileX />}
          colorClass="text-red-600"
        />
      </div>

      {/* Fila 2: Análisis de Producto */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico: Ventas por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Categoría</CardTitle>
            <CardDescription>Distribución de ingresos por tipo de producto</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.ventas_por_categoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, porcentaje }) => `${categoria}: ${porcentaje.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="monto"
                >
                  {data.ventas_por_categoria.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico: Métodos de Pago por Día */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.metodos_pago_ultimos_7_dias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="dia" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('es-PE', { weekday: 'short' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('es-PE')}
                />
                <Legend />
                <Bar dataKey="efectivo" stackId="a" fill="#10b981" name="Efectivo" />
                <Bar dataKey="yape" stackId="a" fill="#3b82f6" name="Yape" />
                <Bar dataKey="tarjeta" stackId="a" fill="#f59e0b" name="Tarjeta" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fila 3: Rankings */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top 10 Productos Más Vendidos */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Productos Más Vendidos</CardTitle>
            <CardDescription>Tus productos estrella (Pareto 80/20)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_10_productos.map((producto: any, index: number) => (
                  <TableRow key={producto.producto_id}>
                    <TableCell>
                      <Badge variant={index < 3 ? 'default' : 'secondary'}>
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                    <TableCell className="text-right">{producto.cantidad_vendida}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(producto.total_generado)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top 10 Mejores Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Mejores Clientes</CardTitle>
            <CardDescription>A quiénes hay que cuidar o dar descuentos VIP</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total Comprado</TableHead>
                  <TableHead>Última Compra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_10_clientes.map((cliente: any, index: number) => (
                  <TableRow key={cliente.cliente_id}>
                    <TableCell>
                      <Badge variant={index < 3 ? 'default' : 'secondary'}>
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {cliente.nombre}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(cliente.total_comprado)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(cliente.ultima_compra).toLocaleDateString('es-PE')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Insights adicionales */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>Análisis automático de tus datos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Margen de Ganancia
            </h4>
            <p className="text-sm text-muted-foreground">
              Tu margen actual es de {data.kpis.margen_ganancia.porcentaje.toFixed(1)}%, 
              generando {formatCurrency(data.kpis.margen_ganancia.total)} en ganancias netas. 
              {data.kpis.margen_ganancia.porcentaje >= 25 
                ? ' ¡Excelente! Estás muy por encima del promedio del sector.' 
                : ' Considera revisar tus costos o ajustar precios para mejorar la rentabilidad.'}
            </p>
          </div>
          
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Patrón de Ventas
            </h4>
            <p className="text-sm text-muted-foreground">
              {data.kpis.ratio_contado_credito.contado_porcentaje > 70 
                ? 'La mayoría de tus ventas son al contado, lo que mejora tu flujo de caja.' 
                : 'Tienes un alto porcentaje de ventas a crédito. Monitorea las cobranzas de cerca.'}
            </p>
          </div>

          {data.kpis.notas_credito.cantidad > 0 && (
            <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
              <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Devoluciones
              </h4>
              <p className="text-sm text-muted-foreground">
                Se han emitido {data.kpis.notas_credito.cantidad} notas de crédito por un total de {formatCurrency(data.kpis.notas_credito.monto_total)}. 
                {data.kpis.notas_credito.cantidad > 10 
                  ? ' Esto podría indicar problemas de calidad o atención al cliente.' 
                  : ' Mantente atento para no perder clientes.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
