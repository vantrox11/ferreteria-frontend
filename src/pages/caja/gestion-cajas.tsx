/**
 * GestionCajasPage - Centro de Control de Cajas
 * 
 * Diseño moderno y minimalista sin shadows.
 * - Tab A: Monitor Activo (Cards de cajas abiertas)
 * - Tab B: Historial de Cierres (Auditoría con filtros)
 * 
 * Solo admin ve ambas tabs y el historial.
 */

"use client"

import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    Loader2,
    Wallet,
    Plus,
    Eye,
    Clock,
    DollarSign,
    TrendingUp,
    TrendingDown,
    User,
    ArrowRight,
    History,
    Activity,
    AlertTriangle,
    CheckCircle2,
    MinusCircle,
    PlusCircle,
    Filter,
    ChevronRight,
    CreditCard,
    Banknote,
} from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { getErrorMessage } from "@/lib/api-error"

// API Hooks
import {
    useGetApiSesionesCajaActiva,
    useGetApiSesionesCajaMonitorActivo,
    useGetApiSesionesCajaHistorial,
    usePostApiSesionesCajaApertura,
    getGetApiSesionesCajaActivaQueryKey,
    getGetApiSesionesCajaMonitorActivoQueryKey,
} from "@/api/generated/sesiones-de-caja/sesiones-de-caja"
import { useGetApiCajas } from "@/api/generated/cajas/cajas"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function GestionCajasPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuth()

    // Estados
    const [showAbrirModal, setShowAbrirModal] = useState(false)
    const [selectedCajaId, setSelectedCajaId] = useState<string>("")
    const [montoInicial, setMontoInicial] = useState<string>("200")
    const [soloDescuadres, setSoloDescuadres] = useState(false)
    const [filtroUsuario, setFiltroUsuario] = useState<string>("todos")

    // Determinar rol
    const isAdmin = user?.rol === "admin"

    // Query: Sesión activa del usuario actual
    const {
        data: miSesionData,
        isLoading: loadingMiSesion,
    } = useGetApiSesionesCajaActiva()

    // Query: Todas las sesiones activas (para admin)
    const {
        data: todasSesionesData,
        isLoading: loadingTodas,
    } = useGetApiSesionesCajaMonitorActivo({
        query: { enabled: isAdmin },
    })

    // Query: Historial de sesiones cerradas (para admin)
    const {
        data: historialData,
        isLoading: loadingHistorial,
    } = useGetApiSesionesCajaHistorial({}, {
        query: { enabled: isAdmin },
    })

    // Query: Lista de cajas disponibles
    const { data: cajasData, isLoading: loadingCajas } = useGetApiCajas()

    // Mutation: Abrir caja
    const abrirCajaMutation = usePostApiSesionesCajaApertura({
        mutation: {
            onSuccess: (data) => {
                toast.success("Caja aperturada exitosamente")
                queryClient.invalidateQueries({ queryKey: getGetApiSesionesCajaActivaQueryKey() })
                queryClient.invalidateQueries({ queryKey: getGetApiSesionesCajaMonitorActivoQueryKey() })
                setShowAbrirModal(false)
                if (data?.sesion?.id) {
                    navigate(`/dashboard/cajas/${data.sesion.id}`)
                }
            },
            onError: (error) => {
                toast.error("Error al abrir caja", { description: getErrorMessage(error) })
            },
        },
    })

    // Datos procesados
    const miSesionActiva = miSesionData?.tiene_sesion_activa ? miSesionData.sesion : null
    const todasLasSesiones = todasSesionesData?.data ?? []

    // Historial filtrado
    const historialFiltrado = useMemo(() => {
        let sesiones = historialData?.data ?? []
        sesiones = sesiones.filter(s => s.estado === 'CERRADA')
        if (soloDescuadres) {
            sesiones = sesiones.filter(s => Number(s.diferencia ?? 0) !== 0)
        }
        if (filtroUsuario && filtroUsuario !== "todos") {
            sesiones = sesiones.filter(s => String(s.usuario_id) === filtroUsuario)
        }
        return sesiones
    }, [historialData, soloDescuadres, filtroUsuario])

    // Usuarios del historial
    const usuariosHistorial = useMemo(() => {
        const usuarios = new Map<number, string>()
        historialData?.data?.forEach(s => {
            if (s.usuario?.id && s.usuario?.nombre) {
                usuarios.set(s.usuario.id, s.usuario.nombre)
            }
        })
        return Array.from(usuarios, ([id, nombre]) => ({ id, nombre }))
    }, [historialData])

    // Cajas disponibles
    const cajasDisponibles = useMemo(() => {
        const cajas = cajasData?.data ?? []
        const cajasConSesion = new Set(todasLasSesiones.map(s => s.caja?.id))
        return cajas.filter(c => c.isActive && !cajasConSesion.has(c.id))
    }, [cajasData, todasLasSesiones])

    // Handlers
    const handleAbrirCaja = () => {
        if (!selectedCajaId || !montoInicial) {
            toast.error("Completa todos los campos")
            return
        }
        abrirCajaMutation.mutate({
            data: {
                caja_id: Number(selectedCajaId),
                monto_inicial: Number(montoInicial),
            },
        })
    }

    const handleVerDetalle = (sesionId: number) => {
        navigate(`/dashboard/cajas/${sesionId}`)
    }

    // Loading
    const isLoading = loadingMiSesion || (isAdmin && loadingTodas)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // ==============================================
    // VISTA EMPLEADO
    // ==============================================
    if (!isAdmin) {
        return (
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Mi Caja</h1>
                        <p className="text-muted-foreground">
                            Gestiona tu sesión de caja del día
                        </p>
                    </div>
                    {!miSesionActiva && (
                        <Button onClick={() => setShowAbrirModal(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Aperturar Caja
                        </Button>
                    )}
                </div>

                {!miSesionActiva ? (
                    <EmptyState
                        icon={Wallet}
                        title="No tienes una caja abierta"
                        description="Abre una caja para comenzar a registrar ventas y movimientos del día."
                        action={
                            <Button onClick={() => setShowAbrirModal(true)} size="lg">
                                <Plus className="mr-2 h-4 w-4" />
                                Aperturar Caja
                            </Button>
                        }
                    />
                ) : (
                    <CajaActivaCard
                        sesion={miSesionActiva}
                        onGestionar={() => handleVerDetalle(miSesionActiva.id)}
                        variant="primary"
                    />
                )}

                <AbrirCajaModal
                    open={showAbrirModal}
                    onOpenChange={setShowAbrirModal}
                    cajasDisponibles={cajasDisponibles}
                    selectedCajaId={selectedCajaId}
                    setSelectedCajaId={setSelectedCajaId}
                    montoInicial={montoInicial}
                    setMontoInicial={setMontoInicial}
                    onConfirm={handleAbrirCaja}
                    isLoading={abrirCajaMutation.isPending || loadingCajas}
                />
            </div>
        )
    }

    // ==============================================
    // VISTA ADMIN
    // ==============================================
    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Gestión de Cajas</h1>
                    <p className="text-muted-foreground">
                        Monitoreo en tiempo real y auditoría de cierres
                    </p>
                </div>
                {!miSesionActiva && (
                    <Button onClick={() => setShowAbrirModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Aperturar Caja
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="monitor" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="monitor" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Monitor Activo
                        {todasLasSesiones.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                {todasLasSesiones.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="historial" className="gap-2">
                        <History className="h-4 w-4" />
                        Historial de Cierres
                    </TabsTrigger>
                </TabsList>

                {/* TAB: Monitor Activo */}
                <TabsContent value="monitor" className="space-y-6">
                    {/* Mi caja destacada */}
                    {miSesionActiva && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                Tu caja activa
                            </div>
                            <CajaActivaCard
                                sesion={miSesionActiva}
                                onGestionar={() => handleVerDetalle(miSesionActiva.id)}
                                variant="primary"
                            />
                        </div>
                    )}

                    {/* Otras cajas */}
                    {todasLasSesiones.filter(s => s.usuario?.id !== user?.id).length > 0 && (
                        <div className="space-y-4">
                            {miSesionActiva && <Separator />}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CreditCard className="h-4 w-4" />
                                Otras cajas abiertas
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {todasLasSesiones
                                    .filter(s => s.usuario?.id !== user?.id)
                                    .map((sesion) => (
                                        <CajaActivaCard
                                            key={sesion.id}
                                            sesion={sesion}
                                            onGestionar={() => handleVerDetalle(sesion.id)}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {todasLasSesiones.length === 0 && (
                        <EmptyState
                            icon={Banknote}
                            title="No hay cajas abiertas"
                            description="Todas las cajas están cerradas. Los empleados pueden abrir sus cajas cuando inicien su turno."
                        />
                    )}
                </TabsContent>

                {/* TAB: Historial */}
                <TabsContent value="historial" className="space-y-4">
                    {/* Filtros */}
                    <Card>
                        <CardContent className="flex flex-wrap items-center gap-4 p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Filter className="h-4 w-4" />
                                Filtros:
                            </div>

                            <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Todos los usuarios" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los usuarios</SelectItem>
                                    {usuariosHistorial.map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            {u.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-2 ml-auto">
                                <Switch
                                    id="descuadres"
                                    checked={soloDescuadres}
                                    onCheckedChange={setSoloDescuadres}
                                />
                                <Label htmlFor="descuadres" className="text-sm cursor-pointer">
                                    Solo descuadres
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabla */}
                    {loadingHistorial ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : historialFiltrado.length === 0 ? (
                        <EmptyState
                            icon={soloDescuadres ? CheckCircle2 : History}
                            title={soloDescuadres ? "¡Sin descuadres!" : "Sin registros"}
                            description={
                                soloDescuadres
                                    ? "Todas las cajas han cerrado correctamente cuadradas."
                                    : "No hay sesiones cerradas en el período seleccionado."
                            }
                            variant={soloDescuadres ? "success" : "default"}
                        />
                    ) : (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha Cierre</TableHead>
                                        <TableHead>Cajero</TableHead>
                                        <TableHead>Caja</TableHead>
                                        <TableHead className="text-right">Inicial</TableHead>
                                        <TableHead className="text-right">Ventas</TableHead>
                                        <TableHead className="text-right">Final</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historialFiltrado.map((sesion) => {
                                        const diferencia = Number(sesion.diferencia ?? 0)
                                        const estado = diferencia === 0 ? "cuadrado" : diferencia < 0 ? "faltante" : "sobrante"

                                        return (
                                            <TableRow key={sesion.id}>
                                                <TableCell>
                                                    <div className="space-y-0.5">
                                                        <div className="font-medium">
                                                            {sesion.fecha_cierre
                                                                ? format(new Date(sesion.fecha_cierre), "dd MMM yyyy", { locale: es })
                                                                : "-"}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {sesion.fecha_cierre
                                                                ? format(new Date(sesion.fecha_cierre), "hh:mm a", { locale: es })
                                                                : ""}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <span className="font-medium">{sesion.usuario?.nombre ?? "—"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {sesion.caja?.nombre ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    S/ {Number(sesion.monto_inicial ?? 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm text-emerald-600">
                                                    S/ {Number(sesion.total_ventas ?? 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm font-semibold">
                                                    S/ {Number(sesion.monto_final ?? 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <DiferenciaBadge diferencia={diferencia} estado={estado} />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleVerDetalle(sesion.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            <AbrirCajaModal
                open={showAbrirModal}
                onOpenChange={setShowAbrirModal}
                cajasDisponibles={cajasDisponibles}
                selectedCajaId={selectedCajaId}
                setSelectedCajaId={setSelectedCajaId}
                montoInicial={montoInicial}
                setMontoInicial={setMontoInicial}
                onConfirm={handleAbrirCaja}
                isLoading={abrirCajaMutation.isPending || loadingCajas}
            />
        </div>
    )
}

// ==============================================
// COMPONENTE: Empty State
// ==============================================
interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    action?: React.ReactNode
    variant?: "default" | "success"
}

function EmptyState({ icon: Icon, title, description, action, variant = "default" }: EmptyStateProps) {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className={`rounded-full p-3 mb-4 ${variant === "success" ? "bg-emerald-100 dark:bg-emerald-950" : "bg-muted"
                    }`}>
                    <Icon className={`h-8 w-8 ${variant === "success" ? "text-emerald-600" : "text-muted-foreground"
                        }`} />
                </div>
                <h3 className="text-lg font-semibold mb-1">{title}</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
                {action}
            </CardContent>
        </Card>
    )
}

// ==============================================
// COMPONENTE: Card de Caja Activa
// ==============================================
interface CajaActivaCardProps {
    sesion: {
        id: number
        caja?: { nombre?: string } | null
        usuario?: { nombre?: string; email?: string } | null
        fecha_apertura?: string
        hora_apertura?: string
        monto_inicial?: number | null
        total_ventas?: number | null
        total_ingresos?: number | null
        total_egresos?: number | null
        saldo_actual?: number | null
    }
    onGestionar: () => void
    variant?: "default" | "primary"
}

function CajaActivaCard({ sesion, onGestionar, variant = "default" }: CajaActivaCardProps) {
    const horaApertura = sesion.hora_apertura || sesion.fecha_apertura
    const ingresos = Number(sesion.total_ingresos ?? sesion.total_ventas ?? 0)
    const egresos = Number(sesion.total_egresos ?? 0)
    const saldoActual = sesion.saldo_actual ?? (Number(sesion.monto_inicial ?? 0) + ingresos - egresos)
    const saldoAlto = saldoActual > 5000

    return (
        <Card className={variant === "primary" ? "border-primary/30 bg-primary/5" : ""}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${variant === "primary" ? "bg-primary/10" : "bg-muted"
                            }`}>
                            <Wallet className={`h-5 w-5 ${variant === "primary" ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                            <CardTitle className="text-base">{sesion.caja?.nombre ?? "Caja"}</CardTitle>
                            <CardDescription className="flex items-center gap-1.5">
                                <User className="h-3 w-3" />
                                {sesion.usuario?.nombre ?? sesion.usuario?.email ?? "Cajero"}
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Abierta
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Hora apertura */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Apertura: </span>
                    <span className="font-medium text-foreground">
                        {horaApertura
                            ? format(new Date(horaApertura), "hh:mm a", { locale: es })
                            : "Hoy"}
                    </span>
                </div>

                {/* Saldo Principal */}
                <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground mb-1">Saldo en Caja</div>
                    <div className="text-3xl font-bold tracking-tight">
                        S/ {saldoActual.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </div>
                </div>

                {/* Alerta saldo alto */}
                {saldoAlto && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Saldo alto. Considera realizar un retiro parcial.</span>
                    </div>
                )}

                {/* KPIs */}
                <div className="grid grid-cols-3 gap-3">
                    <KpiMini label="Inicial" value={Number(sesion.monto_inicial ?? 0)} icon={DollarSign} />
                    <KpiMini label="Ingresos" value={ingresos} icon={TrendingUp} variant="success" />
                    <KpiMini label="Egresos" value={egresos} icon={TrendingDown} variant="danger" />
                </div>
            </CardContent>

            <CardFooter className="pt-0">
                <Button onClick={onGestionar} className="w-full" variant={variant === "primary" ? "default" : "secondary"}>
                    Gestionar / Arquear
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
}

// ==============================================
// COMPONENTE: KPI Mini
// ==============================================
interface KpiMiniProps {
    label: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    variant?: "default" | "success" | "danger"
}

function KpiMini({ label, value, icon: Icon, variant = "default" }: KpiMiniProps) {
    const colorClass = variant === "success" ? "text-emerald-600" : variant === "danger" ? "text-red-500" : "text-muted-foreground"

    return (
        <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className={`flex items-center justify-center gap-1 text-xs mb-0.5 ${colorClass}`}>
                <Icon className="h-3 w-3" />
                {label}
            </div>
            <div className={`font-semibold text-sm ${colorClass}`}>
                {variant === "success" && "+"}
                {variant === "danger" && "-"}
                S/ {value.toFixed(0)}
            </div>
        </div>
    )
}

// ==============================================
// COMPONENTE: Badge de Diferencia
// ==============================================
function DiferenciaBadge({ diferencia, estado }: { diferencia: number; estado: string }) {
    if (estado === "cuadrado") {
        return (
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Cuadrado
            </Badge>
        )
    }
    if (estado === "faltante") {
        return (
            <Badge variant="destructive">
                <MinusCircle className="h-3 w-3 mr-1" />
                S/ {Math.abs(diferencia).toFixed(2)}
            </Badge>
        )
    }
    return (
        <Badge className="bg-blue-500 hover:bg-blue-600">
            <PlusCircle className="h-3 w-3 mr-1" />
            +S/ {diferencia.toFixed(2)}
        </Badge>
    )
}

// ==============================================
// MODAL: Aperturar Caja
// ==============================================
interface AbrirCajaModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cajasDisponibles: Array<{ id: number; nombre: string }>
    selectedCajaId: string
    setSelectedCajaId: (id: string) => void
    montoInicial: string
    setMontoInicial: (monto: string) => void
    onConfirm: () => void
    isLoading: boolean
}

function AbrirCajaModal({
    open,
    onOpenChange,
    cajasDisponibles,
    selectedCajaId,
    setSelectedCajaId,
    montoInicial,
    setMontoInicial,
    onConfirm,
    isLoading,
}: AbrirCajaModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Aperturar Caja
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona una caja e ingresa el monto de efectivo inicial.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="caja">Caja registradora</Label>
                        <Select value={selectedCajaId} onValueChange={setSelectedCajaId}>
                            <SelectTrigger id="caja">
                                <SelectValue placeholder="Selecciona una caja" />
                            </SelectTrigger>
                            <SelectContent>
                                {cajasDisponibles.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        No hay cajas disponibles
                                    </SelectItem>
                                ) : (
                                    cajasDisponibles.map((caja) => (
                                        <SelectItem key={caja.id} value={String(caja.id)}>
                                            {caja.nombre}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="monto">Monto inicial (S/)</Label>
                        <Input
                            id="monto"
                            type="text"
                            inputMode="decimal"
                            value={montoInicial}
                            onChange={(e) => setMontoInicial(e.target.value.replace(/[^0-9.]/g, ""))}
                            placeholder="200.00"
                            className="text-lg"
                        />
                        <p className="text-xs text-muted-foreground">
                            Cuenta el efectivo físico antes de empezar.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!selectedCajaId || !montoInicial || isLoading || cajasDisponibles.length === 0}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Abriendo...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Aperturar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
