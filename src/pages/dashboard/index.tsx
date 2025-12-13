"use client"

import * as React from "react"
import {
    TrendingUp,
    AlertTriangle,
    Package,
    CreditCard,
    Wallet,
    RefreshCw,
    Loader2,
} from "lucide-react"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { useGetApiDashboardGeneral } from "@/api/generated/dashboard/dashboard"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value)

// KPI Card denso y moderno
function KPICard({
    title,
    value,
    cambio,
    icon: Icon,
    description,
    alert,
}: {
    title: string
    value: string | number
    cambio?: number
    icon: React.ElementType
    description?: string
    alert?: boolean
}) {
    const isPositive = cambio !== undefined && cambio >= 0
    return (
        <Card className={alert ? "border-l-4 border-l-orange-500" : ""}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
                        </div>
                        
                        <p className="text-2xl font-bold tracking-tight truncate">
                            {typeof value === "number" ? formatCurrency(value) : value}
                        </p>
                        
                        {cambio !== undefined && (
                            <div className="flex items-center gap-1.5">
                                <Badge 
                                    variant="outline" 
                                    className={`text-[10px] px-1 h-5 ${
                                        isPositive 
                                            ? "border-emerald-200 text-emerald-700 bg-emerald-50" 
                                            : "border-red-200 text-red-700 bg-red-50"
                                    }`}
                                >
                                    {isPositive ? "↑" : "↓"} {Math.abs(cambio).toFixed(1)}%
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">vs anterior</span>
                            </div>
                        )}
                        
                        {description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">{description}</p>
                        )}
                    </div>
                    
                    {alert && (
                        <Badge variant="destructive" className="text-[9px] h-5 shrink-0">Alerta</Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function LiquidezCard({ enCaja, disponible }: { enCaja: number; disponible: number }) {
    const riesgoAlto = enCaja > 5000
    const porcentaje = disponible > 0 ? (enCaja / disponible) * 100 : 0
    
    return (
        <Card className={riesgoAlto ? "border-l-4 border-l-orange-500" : ""}>
            <CardContent className="p-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-xs font-medium text-muted-foreground">Liquidez</p>
                        </div>
                        {riesgoAlto && (
                            <Badge variant="destructive" className="text-[9px] h-5">Riesgo Alto</Badge>
                        )}
                    </div>
                    
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(disponible)}</p>
                    <p className="text-[10px] text-muted-foreground">Disponible total</p>
                    
                    <div className="pt-2 space-y-1.5">
                        <div className="flex justify-between text-xs">
                            <span className="font-medium">En caja</span>
                            <span className="font-semibold">{formatCurrency(enCaja)}</span>
                        </div>
                        <Progress value={porcentaje} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground text-right">
                            {porcentaje.toFixed(1)}% del total
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function DashboardPage() {
    const { data, isLoading, refetch, isRefetching } = useGetApiDashboardGeneral({})

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No se pudieron cargar los datos</p>
                <Button onClick={() => refetch()}>Reintentar</Button>
            </div>
        )
    }

    const creditoAlto = data.porcentaje_ventas_credito > 40

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
            {/* Header compacto */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Torre de Control</h1>
                    <p className="text-xs text-muted-foreground">Visión ejecutiva del negocio</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin mr-1.5" : "mr-1.5"}`} />
                    <span className="text-xs">Actualizar</span>
                </Button>
            </div>

            {/* KPIs densos */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <LiquidezCard
                    enCaja={data.liquidez.en_caja_riesgo}
                    disponible={data.liquidez.disponible_total}
                />
                <KPICard
                    title="Utilidad Bruta (30d)"
                    value={data.utilidad_bruta.valor}
                    cambio={data.utilidad_bruta.cambio_porcentual}
                    icon={TrendingUp}
                />
                <KPICard
                    title="CxC Vencidas"
                    value={data.cxc_vencidas.valor}
                    cambio={data.cxc_vencidas.cambio_porcentual}
                    icon={CreditCard}
                    alert={data.cxc_vencidas.valor > 0}
                    description={data.cxc_vencidas.valor > 0 ? "Dinero que debería estar en caja" : "Sin deudas vencidas"}
                />
                <KPICard
                    title="Inventario"
                    value={data.valor_inventario}
                    icon={Package}
                    description="Capital inmovilizado"
                />
            </div>

            {/* Alerta compacta */}
            {creditoAlto && (
                <Card className="border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
                    <CardContent className="p-3">
                        <div className="flex gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
                            <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-orange-900 dark:text-orange-100">
                                    Riesgo de Liquidez: {data.porcentaje_ventas_credito.toFixed(1)}% a crédito
                                </p>
                                <p className="text-[10px] text-orange-800 dark:text-orange-200">
                                    Intensificar cobranzas recomendado
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Charts densos */}
            <div className="grid gap-3 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3 space-y-0">
                        <CardTitle className="text-sm font-semibold">Flujo de Caja</CardTitle>
                        <CardDescription className="text-xs">Últimos 30 días</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data.flujo_caja_30d}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                                <XAxis
                                    dataKey="fecha"
                                    tickFormatter={(v) => format(new Date(v), "dd MMM", { locale: es })}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--popover))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        padding: '6px 8px',
                                    }}
                                />
                                <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="egresos" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 space-y-0">
                        <CardTitle className="text-sm font-semibold">Ticket Promedio</CardTitle>
                        <CardDescription className="text-xs">Evolución últimos 30 días</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={data.ticket_promedio_30d}>
                                <defs>
                                    <linearGradient id="ticket" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                                <XAxis
                                    dataKey="fecha"
                                    tickFormatter={(v) => format(new Date(v), "dd MMM", { locale: es })}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tickFormatter={(v) => `S/${v}`}
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--popover))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        padding: '6px 8px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="ticket_promedio"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    fill="url(#ticket)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Alertas operativas densas */}
            <div className="grid gap-3 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3 space-y-0">
                        <CardTitle className="text-sm font-semibold">Quiebre Inminente</CardTitle>
                        <CardDescription className="text-xs">Productos en riesgo</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                        {data.alertas_quiebre.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <Package className="h-8 w-8 text-muted-foreground/30 mb-1.5" />
                                <p className="text-xs text-muted-foreground">Sin productos en riesgo</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.alertas_quiebre.map((alerta) => (
                                    <div key={alerta.producto_id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{alerta.producto_nombre}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                Stock: {alerta.stock_actual} • {alerta.velocidad_diaria}/día
                                            </p>
                                        </div>
                                        <Badge 
                                            variant={alerta.dias_restantes < 3 ? "destructive" : "secondary"}
                                            className="ml-2 text-[10px] h-5 shrink-0"
                                        >
                                            {alerta.dias_restantes.toFixed(1)}d
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 space-y-0">
                        <CardTitle className="text-sm font-semibold">Deudas Vencidas</CardTitle>
                        <CardDescription className="text-xs">Top deudores</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                        {data.top_deudores.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <CreditCard className="h-8 w-8 text-muted-foreground/30 mb-1.5" />
                                <p className="text-xs text-muted-foreground">Sin deudas vencidas</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="h-8 text-xs font-semibold">Cliente</TableHead>
                                        <TableHead className="h-8 text-right text-xs font-semibold">Deuda</TableHead>
                                        <TableHead className="h-8 text-right text-xs font-semibold">Días</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.top_deudores.map((deudor) => (
                                        <TableRow key={deudor.cliente_id} className="hover:bg-muted/50">
                                            <TableCell className="py-2 text-xs font-medium">{deudor.cliente_nombre}</TableCell>
                                            <TableCell className="py-2 text-right text-xs font-semibold text-red-600">
                                                {formatCurrency(deudor.deuda_vencida)}
                                            </TableCell>
                                            <TableCell className="py-2 text-right">
                                                <Badge variant="outline" className="text-[10px] h-5">{deudor.dias_vencido}d</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Forma de pago compacta */}
            <Card>
                <CardHeader className="pb-3 space-y-0">
                    <CardTitle className="text-sm font-semibold">Forma de Pago</CardTitle>
                    <CardDescription className="text-xs">Distribución Efectivo vs Crédito</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Contado</span>
                                <span className="text-xl font-bold">{(100 - data.porcentaje_ventas_credito).toFixed(1)}%</span>
                            </div>
                            <Progress value={100 - data.porcentaje_ventas_credito} className="h-2" />
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Crédito</span>
                                <span className="text-xl font-bold">{data.porcentaje_ventas_credito.toFixed(1)}%</span>
                            </div>
                            <Progress value={data.porcentaje_ventas_credito} className="h-2" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
