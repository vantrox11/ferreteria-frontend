"use client"

import * as React from "react"
import {
    TrendingUp,
    DollarSign,
    RefreshCw,
    Loader2,
    Users,
    BarChart3,
    Activity,
    TrendingDown,
} from "lucide-react"
import { subDays, format } from "date-fns"

import { useGetApiDashboardVentas } from "@/api/generated/dashboard/dashboard"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value)

const getHeatColor = (value: number, max: number) => {
    const intensity = max > 0 ? value / max : 0
    if (intensity > 0.8) return "bg-blue-600"
    if (intensity > 0.6) return "bg-blue-500"
    if (intensity > 0.4) return "bg-blue-400"
    if (intensity > 0.2) return "bg-blue-300"
    if (intensity > 0) return "bg-blue-200"
    return "bg-muted"
}

const getHeatTextColor = (value: number, max: number) => {
    const intensity = max > 0 ? value / max : 0
    return intensity > 0.4 ? "text-white" : "text-foreground"
}

// KPI Card denso
function KPICard({
    title,
    value,
    cambio,
    icon: Icon,
    description,
}: {
    title: string
    value: string | number
    cambio?: number
    icon: React.ElementType
    description?: string
}) {
    const isPositive = cambio !== undefined && cambio >= 0
    
    return (
        <Card>
            <CardContent className="p-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs font-medium text-muted-foreground">{title}</p>
                    </div>
                    
                    <p className="text-2xl font-bold tracking-tight">
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
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{description}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default function DashboardVentasPage() {
    const [periodo, setPeriodo] = React.useState<string>("30")
    
    const fechaFin = new Date()
    const fechaInicio = subDays(fechaFin, parseInt(periodo))
    
    const { data, isLoading, refetch, isRefetching } = useGetApiDashboardVentas({
        fecha_inicio: format(fechaInicio, "yyyy-MM-dd"),
        fecha_fin: format(fechaFin, "yyyy-MM-dd"),
    })

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
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No se pudieron cargar los datos</p>
                <Button onClick={() => refetch()}>Reintentar</Button>
            </div>
        )
    }

    const porcentajeEfectivo = data.distribucion_pago.efectivo > 0
        ? (data.distribucion_pago.efectivo / (data.distribucion_pago.efectivo + data.distribucion_pago.credito)) * 100
        : 0
    const porcentajeCredito = 100 - porcentajeEfectivo

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
            {/* Header compacto */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard de Ventas</h1>
                    <p className="text-xs text-muted-foreground">Análisis de productos y rendimiento</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <Select value={periodo} onValueChange={setPeriodo}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Últimos 7 días</SelectItem>
                            <SelectItem value="15">Últimos 15 días</SelectItem>
                            <SelectItem value="30">Últimos 30 días</SelectItem>
                            <SelectItem value="60">Últimos 60 días</SelectItem>
                            <SelectItem value="90">Últimos 90 días</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                        <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin mr-1.5" : "mr-1.5"}`} />
                        <span className="text-xs">Actualizar</span>
                    </Button>
                </div>
            </div>

            {/* KPIs densos */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Ventas Netas"
                    value={data.ventas_totales_netas.valor}
                    cambio={data.ventas_totales_netas.cambio_porcentual}
                    icon={DollarSign}
                />
                <KPICard
                    title="Margen Promedio"
                    value={`${data.margen_promedio.valor.toFixed(1)}%`}
                    cambio={data.margen_promedio.cambio_porcentual}
                    icon={Activity}
                />
                <KPICard
                    title="Tasa Recurrencia"
                    value={`${data.tasa_recurrencia.toFixed(1)}%`}
                    icon={Users}
                    description="Clientes que regresan"
                />
                <KPICard
                    title="Tasa Devoluciones"
                    value={`${data.tasa_devoluciones.toFixed(1)}%`}
                    icon={data.tasa_devoluciones > 5 ? TrendingDown : TrendingUp}
                    description={data.tasa_devoluciones > 5 ? "Alto" : "Normal"}
                />
            </div>

            {/* Análisis de Productos - Más denso */}
            <div className="grid gap-3 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3 space-y-0">
                        <CardTitle className="text-sm font-semibold">Top Rotación</CardTitle>
                        <CardDescription className="text-xs">Productos más vendidos</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                        <div className="space-y-1.5">
                            {data.top_rotacion.slice(0, 10).map((p, idx) => (
                                <div key={p.producto_id} className="flex items-center justify-between py-1 hover:bg-muted/50 rounded px-1 -mx-1">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Badge 
                                            variant={idx < 3 ? "default" : "secondary"} 
                                            className="w-5 h-5 flex items-center justify-center p-0 text-[9px] shrink-0"
                                        >
                                            {idx + 1}
                                        </Badge>
                                        <span className="text-xs font-medium truncate">{p.producto_nombre}</span>
                                    </div>
                                    <span className="text-xs font-bold ml-2 shrink-0">{p.unidades_vendidas}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-3 space-y-0">
                        <CardTitle className="text-sm font-semibold">Top Rentabilidad</CardTitle>
                        <CardDescription className="text-xs">Mayor utilidad generada</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                        <div className="space-y-1.5">
                            {data.top_rentabilidad.slice(0, 10).map((p, idx) => (
                                <div key={p.producto_id} className="flex items-center justify-between py-1 hover:bg-muted/50 rounded px-1 -mx-1">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Badge 
                                            variant={idx < 3 ? "default" : "secondary"} 
                                            className="w-5 h-5 flex items-center justify-center p-0 text-[9px] shrink-0"
                                        >
                                            {idx + 1}
                                        </Badge>
                                        <span className="text-xs font-medium truncate">{p.producto_nombre}</span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2 shrink-0">
                                        <span className="text-xs font-bold text-emerald-600">
                                            {formatCurrency(p.utilidad)}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {p.margen_porcentaje.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Rankings densos */}
            <div className="grid gap-3 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3 space-y-0">
                        <CardTitle className="text-sm font-semibold">Ranking Vendedores</CardTitle>
                        <CardDescription className="text-xs">Por utilidad generada</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                        {data.ranking_vendedores.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <Users className="h-8 w-8 text-muted-foreground/30 mb-1.5" />
                                <p className="text-xs text-muted-foreground">Sin datos</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {data.ranking_vendedores.map((v, idx) => (
                                    <div key={v.usuario_id} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge 
                                                    variant={idx < 3 ? "default" : "secondary"}
                                                    className="w-6 h-6 flex items-center justify-center p-0 text-[10px] font-bold shrink-0"
                                                >
                                                    {idx + 1}
                                                </Badge>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium truncate">{v.vendedor_nombre}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {v.cantidad_ventas} ventas • {formatCurrency(v.ventas_total)}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-600 ml-2 shrink-0">
                                                {formatCurrency(v.utilidad_generada)}
                                            </span>
                                        </div>
                                        <Progress 
                                            value={(v.utilidad_generada / data.ranking_vendedores[0].utilidad_generada) * 100}
                                            className="h-1.5"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 space-y-0">
                        <CardTitle className="text-sm font-semibold">Formas de Pago</CardTitle>
                        <CardDescription className="text-xs">Efectivo vs Crédito</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Efectivo</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {formatCurrency(data.distribucion_pago.efectivo)}
                                        </span>
                                        <span className="text-xl font-bold">{porcentajeEfectivo.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <Progress value={porcentajeEfectivo} className="h-2" />
                            </div>
                            
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Crédito</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {formatCurrency(data.distribucion_pago.credito)}
                                        </span>
                                        <span className="text-xl font-bold">{porcentajeCredito.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <Progress value={porcentajeCredito} className="h-2" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Mapa de calor compacto */}
            <Card>
                <CardHeader className="pb-3 space-y-0">
                    <CardTitle className="text-sm font-semibold">Mapa de Calor Horario</CardTitle>
                    <CardDescription className="text-xs">Ventas por hora del día</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                    <div className="overflow-x-auto -mx-2">
                        <div className="inline-block min-w-full px-2">
                            <div className="space-y-1">
                                {/* Header */}
                                <div className="grid grid-cols-25 gap-0.5">
                                    <div />
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <div key={i} className="text-[9px] text-center font-medium text-muted-foreground">
                                            {i}h
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Fila */}
                                <div className="grid grid-cols-25 gap-0.5">
                                    <div className="flex items-center justify-end pr-1.5 text-[10px] font-medium text-muted-foreground">
                                        Ventas
                                    </div>
                                    {(() => {
                                        const maxVentas = Math.max(...data.mapa_calor_horario.map(h => h.monto_total), 1)
                                        
                                        return Array.from({ length: 24 }, (_, hora) => {
                                            const dato = data.mapa_calor_horario.find(h => h.hora === hora)
                                            const valor = dato?.monto_total || 0
                                            const cantidad = dato?.cantidad_ventas || 0
                                            
                                            return (
                                                <div
                                                    key={hora}
                                                    className={`h-9 rounded flex items-center justify-center text-[9px] font-bold transition-colors ${getHeatColor(valor, maxVentas)} ${getHeatTextColor(valor, maxVentas)}`}
                                                    title={`${hora}:00 - ${cantidad} ventas: ${formatCurrency(valor)}`}
                                                >
                                                    {cantidad > 0 ? cantidad : ""}
                                                </div>
                                            )
                                        })
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t">
                        <span className="text-[10px] text-muted-foreground">Menos</span>
                        <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-sm bg-muted" />
                            <div className="w-3 h-3 rounded-sm bg-blue-200" />
                            <div className="w-3 h-3 rounded-sm bg-blue-300" />
                            <div className="w-3 h-3 rounded-sm bg-blue-400" />
                            <div className="w-3 h-3 rounded-sm bg-blue-500" />
                            <div className="w-3 h-3 rounded-sm bg-blue-600" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">Más</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
