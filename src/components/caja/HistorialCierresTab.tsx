import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Eye, User, Loader2, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetApiSesionesCajaHistorialAuditoria } from "@/api/generated/sesiones-de-caja/sesiones-de-caja";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";

interface HistorialItem {
  id: number;
  caja: {
    id: number;
    nombre: string;
  };
  usuario: {
    id: number;
    nombre: string | null;
    email: string;
  };
  fecha_apertura: string;
  fecha_cierre: string | null;
  monto_inicial: number;
  total_ventas: number;
  monto_teorico: number;
  monto_real: number | null;
  diferencia: number;
  tipo_cierre: "NORMAL" | "ADMINISTRATIVO";
}

/**
 * Tab "Historial de Cierres"
 * Tabla de auditoría con filtros avanzados y semáforo de descuadres
 */
export default function HistorialCierresTab() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);

  // Filtros
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [usuarioId, setUsuarioId] = useState<number | undefined>();
  const [soloDescuadres, setSoloDescuadres] = useState(false);

  // Query con filtros
  const { data, isLoading, error } = useGetApiSesionesCajaHistorialAuditoria({
    fecha_inicio: dateRange?.from?.toISOString(),
    fecha_fin: dateRange?.to?.toISOString(),
    usuario_id: usuarioId,
    solo_descuadres: soloDescuadres,
    page: 1,
    limit: 50,
  });

  const cierres = data?.data || [];

  // Definición de columnas
  const columns: ColumnDef<HistorialItem>[] = [
    {
      accessorKey: "fecha_cierre",
      header: "Fecha/Hora Cierre",
      cell: ({ row }) => {
        const fecha = row.original.fecha_cierre;
        if (!fecha) return "-";
        return format(new Date(fecha), "dd MMM, hh:mm a", { locale: es });
      },
    },
    {
      accessorKey: "usuario",
      header: "Cajero",
      cell: ({ row }) => {
        const usuario = row.original.usuario;
        const nombre = usuario.nombre || usuario.email;
        const initials = nombre
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{nombre}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "caja",
      header: "Caja",
      cell: ({ row }) => row.original.caja.nombre,
    },
    {
      accessorKey: "monto_inicial",
      header: "Monto Inicial",
      cell: ({ row }) => (
        <span className="font-mono">S/ {row.original.monto_inicial.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "total_ventas",
      header: "Total Ventas",
      cell: ({ row }) => (
        <span className="font-mono text-green-600">
          S/ {row.original.total_ventas.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "monto_real",
      header: "Monto Final",
      cell: ({ row }) => {
        const monto = row.original.monto_real;
        if (monto === null) return "-";
        return <span className="font-mono">S/ {monto.toFixed(2)}</span>;
      },
    },
    {
      accessorKey: "diferencia",
      header: "Diferencia",
      cell: ({ row }) => {
        const diferencia = row.original.diferencia;

        if (diferencia === 0) {
          return (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Cuadrado
            </Badge>
          );
        }

        if (diferencia < 0) {
          return (
            <Badge variant="destructive" className="font-bold">
              - S/ {Math.abs(diferencia).toFixed(2)}
            </Badge>
          );
        }

        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            + S/ {diferencia.toFixed(2)}
          </Badge>
        );
      },
    },
    {
      id: "resolución",
      header: "Resolución",
      cell: ({ row }) => {
        const diferencia = row.original.diferencia;

        if (diferencia === 0) {
          return <span className="text-muted-foreground text-sm">--</span>;
        }

        // TODO: Implementar persistencia de estado de resolución
        return (
          <Select defaultValue="PENDIENTE">
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDIENTE">⏳ Pendiente</SelectItem>
              <SelectItem value="COBRADO">✅ Cobrado</SelectItem>
              <SelectItem value="ASUMIDO">🏢 Asumido</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/dashboard/cajas/${row.original.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver Detalle
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: cierres,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar historial de cierres. Por favor intenta nuevamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Herramientas */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
        {/* Filtro de Fechas */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Rango de Fechas</Label>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>

        {/* Filtro de Usuario */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Usuario</Label>
          <Select
            value={usuarioId?.toString() || "all"}
            onValueChange={(val) =>
              setUsuarioId(val === "all" ? undefined : Number(val))
            }
          >
            <SelectTrigger className="w-48">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Todos los usuarios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              {/* TODO: Cargar lista de usuarios desde API */}
            </SelectContent>
          </Select>
        </div>

        {/* Switch Solo Descuadres */}
        <div className="flex items-center gap-2 mt-6">
          <Switch
            id="solo-descuadres"
            checked={soloDescuadres}
            onCheckedChange={setSoloDescuadres}
          />
          <Label htmlFor="solo-descuadres" className="text-sm cursor-pointer">
            Ver solo descuadres
          </Label>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-8 w-8" />
                    <p>No se encontraron cierres de caja</p>
                    {soloDescuadres && (
                      <p className="text-xs">
                        Intenta desactivar el filtro "Ver solo descuadres"
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación (TODO: Implementar en futuro) */}
      {data?.pagination && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Mostrando {cierres.length} de {data.pagination.total} registros
          </p>
        </div>
      )}
    </div>
  );
}
