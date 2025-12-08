// Dashboard General (Home / Vista del Dueño)
// El Pulso del Negocio - KPIs de salud financiera y acciones inmediatas

import { useGetApiDashboardGeneral } from '@/api/generated/dashboard/dashboard';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  AlertTriangle, 
  PackageX, 
  Wallet,
  RefreshCcw,
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function DashboardGeneralPage() {
  const navigate = useNavigate();
  
  const { data, isLoading, error, refetch } = useGetApiDashboardGeneral();

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
          <h1 className="text-3xl font-bold">Dashboard General</h1>
          <p className="text-muted-foreground">El Pulso del Negocio</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Fila 1: KPIs de Salud Financiera */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventas del Día"
          value={formatCurrency(data.kpis.ventas_del_dia.valor)}
          icon={<DollarSign />}
          trend={{
            value: data.kpis.ventas_del_dia.comparacion_ayer,
            label: 'vs. ayer',
          }}
          colorClass="text-green-600"
        />

        <StatCard
          title="Cuentas por Cobrar Vencidas"
          value={formatCurrency(data.kpis.cuentas_por_cobrar_vencidas.monto_total)}
          icon={<AlertTriangle />}
          colorClass="text-red-600"
        />

        <StatCard
          title="Stock Crítico"
          value={`${data.kpis.stock_critico.cantidad_productos} productos`}
          icon={<PackageX />}
          colorClass="text-orange-600"
        />

        <StatCard
          title="Caja Actual"
          value={formatCurrency(data.kpis.caja_actual.saldo_total)}
          icon={<Wallet />}
          colorClass="text-blue-600"
        />
      </div>

      {/* Fila 2: Tendencias y Operación */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico: Ventas Últimos 30 Días */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Últimos 30 Días</CardTitle>
            <CardDescription>Tendencia de ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.ventas_ultimos_30_dias}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('es-PE')}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico: Ventas por Vendedor */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Vendedor</CardTitle>
            <CardDescription>Top 5 del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.ventas_por_vendedor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendedor_nombre" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="total_ventas" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fila 3: Centro de Acción Inmediata */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Panel: Facturas Pendientes SUNAT */}
        <Card>
          <CardHeader>
            <CardTitle>Facturas Pendientes SUNAT</CardTitle>
            <CardDescription>
              {data.facturas_pendientes_sunat.length} comprobantes por enviar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.facturas_pendientes_sunat.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                <RefreshCcw className="h-5 w-5 text-green-600" />
                No hay facturas pendientes
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.facturas_pendientes_sunat.slice(0, 5).map((factura: any) => (
                    <TableRow key={factura.venta_id}>
                      <TableCell className="font-medium">{factura.comprobante}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{factura.cliente}</TableCell>
                      <TableCell className="text-right">{formatCurrency(factura.total)}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/dashboard/ventas/historial-v2`)}
                        >
                          <RefreshCcw className="h-3 w-3 mr-1" />
                          Reintentar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Panel: Productos por Agotarse */}
        <Card>
          <CardHeader>
            <CardTitle>Productos por Agotarse</CardTitle>
            <CardDescription>
              {data.productos_criticos.length} productos con stock crítico
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.productos_criticos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                <PackageX className="h-5 w-5 text-green-600" />
                Stock en niveles normales
              </div>
            ) : (
              <div className="space-y-3">
                {data.productos_criticos.map((producto: any) => (
                  <div 
                    key={producto.producto_id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate('/dashboard/inventario')}
                  >
                    <div>
                      <p className="font-medium">{producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        Mínimo: {producto.stock_minimo}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      Stock: {producto.stock_actual}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
