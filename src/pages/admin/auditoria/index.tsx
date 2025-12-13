"use client"

import * as React from "react"
import type {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
} from "@tanstack/react-table"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    ArrowUpDown,
    ChevronDown,
    Loader2,
    Shield,
    User,
    Calendar,
    Table2,
    Eye,
    Download,
    FileText,
    LogIn,
    LogOut,
    PlusCircle,
    Pencil,
    Trash2,
    XCircle,
    Settings,
    RefreshCw,
} from "lucide-react"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"

import {
    useGetApiAuditoria,
    useGetApiAuditoriaEstadisticas,
} from "@/api/generated/auditoría/auditoría"
import type { AuditoriaLog, AuditoriaLogAccion } from "@/api/generated/model"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// Configuración de iconos y colores por acción
const ACCION_CONFIG: Record<AuditoriaLogAccion, { icon: React.ElementType; color: string; label: string }> = {
    CREAR: { icon: PlusCircle, color: "bg-green-500", label: "Crear" },
    ACTUALIZAR: { icon: Pencil, color: "bg-blue-500", label: "Actualizar" },
    ELIMINAR: { icon: Trash2, color: "bg-red-500", label: "Eliminar" },
    ANULAR: { icon: XCircle, color: "bg-orange-500", label: "Anular" },
    AJUSTAR: { icon: Settings, color: "bg-purple-500", label: "Ajustar" },
    LOGIN: { icon: LogIn, color: "bg-cyan-500", label: "Login" },
    LOGOUT: { icon: LogOut, color: "bg-gray-500", label: "Logout" },
}

// Componente para ver detalle de cambios
function DetalleLogModal({
    log,
    open,
    onOpenChange,
}: {
    log: AuditoriaLog | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    if (!log) return null

    const IconAccion = ACCION_CONFIG[log.accion]?.icon ?? FileText

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconAccion className="h-5 w-5" />
                        Detalle de Auditoría #{log.id}
                    </DialogTitle>
                    <DialogDescription>
                        Información completa del evento de auditoría
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh]">
                    <div className="space-y-4 pr-4">
                        {/* Info básica */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Fecha y hora</p>
                                <p className="font-medium">
                                    {format(new Date(log.fecha), "PPpp", { locale: es })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Usuario</p>
                                <p className="font-medium">
                                    {log.usuario?.nombre ?? log.usuario?.email ?? `ID: ${log.usuario_id}`}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Acción</p>
                                <Badge className={`${ACCION_CONFIG[log.accion]?.color} text-white`}>
                                    {ACCION_CONFIG[log.accion]?.label}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tabla afectada</p>
                                <p className="font-medium font-mono">{log.tabla_afectada}</p>
                            </div>
                            {log.registro_id && (
                                <div>
                                    <p className="text-sm text-muted-foreground">ID del registro</p>
                                    <p className="font-medium font-mono">#{log.registro_id}</p>
                                </div>
                            )}
                            {log.ip_address && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Dirección IP</p>
                                    <p className="font-medium font-mono">{log.ip_address}</p>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Datos antes */}
                        {log.datos_antes && (
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500" />
                                    Datos Anteriores
                                </h4>
                                <pre className="bg-muted rounded-lg p-4 text-xs overflow-auto max-h-48">
                                    {typeof log.datos_antes === "string"
                                        ? log.datos_antes
                                        : JSON.stringify(log.datos_antes, null, 2)}
                                </pre>
                            </div>
                        )}

                        {/* Datos después */}
                        {log.datos_despues && (
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-green-500" />
                                    Datos Nuevos
                                </h4>
                                <pre className="bg-muted rounded-lg p-4 text-xs overflow-auto max-h-48">
                                    {typeof log.datos_despues === "string"
                                        ? log.datos_despues
                                        : JSON.stringify(log.datos_despues, null, 2)}
                                </pre>
                            </div>
                        )}

                        {/* User Agent */}
                        {log.user_agent && (
                            <div>
                                <p className="text-sm text-muted-foreground">Navegador / User Agent</p>
                                <p className="text-xs font-mono text-muted-foreground break-all">
                                    {log.user_agent}
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

// Componente para tarjetas de estadísticas
function StatCard({
    title,
    value,
    icon: Icon,
    description,
}: {
    title: string
    value: string | number
    icon: React.ElementType
    description?: string
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </CardContent>
        </Card>
    )
}

export default function AuditoriaPage() {
    // Estados de tabla
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
        ip_address: false,
        user_agent: false,
    })
    const [rowSelection, setRowSelection] = React.useState({})

    // Estados de filtros
    const [accionFilter, setAccionFilter] = React.useState<string>("all")
    const [tablaFilter, setTablaFilter] = React.useState("")
    const [limitFilter, setLimitFilter] = React.useState("100")

    // Estado para modal de detalle
    const [selectedLog, setSelectedLog] = React.useState<AuditoriaLog | null>(null)
    const [showDetail, setShowDetail] = React.useState(false)

    // Queries
    const { data: logsData, isLoading, refetch } = useGetApiAuditoria({
        accion: accionFilter !== "all" ? (accionFilter as AuditoriaLogAccion) : undefined,
        tabla_afectada: tablaFilter || undefined,
        limit: parseInt(limitFilter),
    })

    const { data: statsData, isLoading: statsLoading } = useGetApiAuditoriaEstadisticas()

    const logs = logsData?.data ?? []
    const stats = statsData

    // Definición de columnas
    const columns = React.useMemo<ColumnDef<AuditoriaLog>[]>(
        () => [
            {
                accessorKey: "fecha",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Fecha
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(row.original.fecha), "dd/MM/yy HH:mm", { locale: es })}
                    </div>
                ),
            },
            {
                id: "usuario",
                header: "Usuario",
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                            {row.original.usuario?.nombre ?? row.original.usuario?.email ?? `ID: ${row.original.usuario_id}`}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "accion",
                header: "Acción",
                cell: ({ row }) => {
                    const accion = row.original.accion
                    const config = ACCION_CONFIG[accion]
                    const Icon = config?.icon ?? FileText
                    return (
                        <Badge className={`${config?.color ?? "bg-gray-500"} text-white`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config?.label ?? accion}
                        </Badge>
                    )
                },
                filterFn: (row, id, value) => {
                    return value === "all" || row.getValue(id) === value
                },
            },
            {
                accessorKey: "tabla_afectada",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Tabla
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Table2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{row.original.tabla_afectada}</span>
                    </div>
                ),
            },
            {
                accessorKey: "registro_id",
                header: "Registro",
                cell: ({ row }) =>
                    row.original.registro_id ? (
                        <span className="font-mono text-sm">#{row.original.registro_id}</span>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    ),
            },
            {
                accessorKey: "ip_address",
                header: "IP",
                cell: ({ row }) =>
                    row.original.ip_address ? (
                        <span className="font-mono text-xs">{row.original.ip_address}</span>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    ),
            },
            {
                id: "actions",
                enableHiding: false,
                cell: ({ row }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedLog(row.original)
                            setShowDetail(true)
                        }}
                    >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver detalle</span>
                    </Button>
                ),
            },
        ],
        []
    )

    const table = useReactTable({
        data: logs,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        initialState: {
            pagination: { pageSize: 20 },
        },
    })

    // Exportar a CSV
    const exportToCSV = () => {
        const headers = ["Fecha", "Usuario", "Email", "Acción", "Tabla", "Registro ID", "IP"]
        const rows = logs.map((log) => [
            format(new Date(log.fecha), "yyyy-MM-dd HH:mm:ss"),
            log.usuario?.nombre ?? "",
            log.usuario?.email ?? "",
            log.accion,
            log.tabla_afectada,
            log.registro_id ?? "",
            log.ip_address ?? "",
        ])

        const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `auditoria_${format(new Date(), "yyyy-MM-dd")}.csv`
        link.click()
    }

    if (isLoading && logs.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6 px-4 lg:px-6 pt-1 md:pt-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-semibold">Auditoría del Sistema</h1>
                        <p className="text-sm text-muted-foreground">
                            Registro de todas las acciones realizadas en el sistema
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualizar
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {/* Estadísticas */}
            {stats && !statsLoading && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Eventos (7 días)"
                        value={stats.total_eventos}
                        icon={FileText}
                        description={`Desde ${format(new Date(stats.periodo.desde), "dd/MM", { locale: es })}`}
                    />
                    <StatCard
                        title="Creaciones"
                        value={stats.por_accion?.CREAR ?? 0}
                        icon={PlusCircle}
                    />
                    <StatCard
                        title="Actualizaciones"
                        value={stats.por_accion?.ACTUALIZAR ?? 0}
                        icon={Pencil}
                    />
                    <StatCard
                        title="Eliminaciones"
                        value={stats.por_accion?.ELIMINAR ?? 0}
                        icon={Trash2}
                    />
                </div>
            )}

            {/* Usuarios más activos */}
            {stats?.usuarios_mas_activos && stats.usuarios_mas_activos.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Usuarios Más Activos (últimos 7 días)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {stats.usuarios_mas_activos.slice(0, 5).map((u) => (
                                <Badge key={u.usuario_id} variant="secondary" className="px-3 py-1">
                                    <User className="h-3 w-3 mr-1" />
                                    {u.nombre || u.email}: <span className="font-bold ml-1">{u.count}</span>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={accionFilter} onValueChange={setAccionFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Acción" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las acciones</SelectItem>
                        <SelectItem value="CREAR">Crear</SelectItem>
                        <SelectItem value="ACTUALIZAR">Actualizar</SelectItem>
                        <SelectItem value="ELIMINAR">Eliminar</SelectItem>
                        <SelectItem value="ANULAR">Anular</SelectItem>
                        <SelectItem value="AJUSTAR">Ajustar</SelectItem>
                        <SelectItem value="LOGIN">Login</SelectItem>
                        <SelectItem value="LOGOUT">Logout</SelectItem>
                    </SelectContent>
                </Select>

                <Input
                    placeholder="Filtrar por tabla..."
                    value={tablaFilter}
                    onChange={(e) => setTablaFilter(e.target.value)}
                    className="w-48"
                />

                <Select value={limitFilter} onValueChange={setLimitFilter}>
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder="Límite" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="50">50 registros</SelectItem>
                        <SelectItem value="100">100 registros</SelectItem>
                        <SelectItem value="200">200 registros</SelectItem>
                        <SelectItem value="500">500 registros</SelectItem>
                    </SelectContent>
                </Select>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columnas <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                >
                                    {column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Tabla */}
            <div className="relative">
                {isLoading && (
                    <div className="absolute top-2 right-2 z-10">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                )}

                <div className={isLoading ? "opacity-80 pointer-events-none" : ""}>
                    <div className="overflow-hidden rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => {
                                                setSelectedLog(row.original)
                                                setShowDetail(true)
                                            }}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No se encontraron registros de auditoría.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {table.getRowModel().rows.length} de {logsData?.total ?? 0} registros
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de detalle */}
            <DetalleLogModal log={selectedLog} open={showDetail} onOpenChange={setShowDetail} />
        </div>
    )
}
