import { useState,useEffect, useMemo } from "react";
import { useGetApiPedidos } from "@/api/generated/pedidos/pedidos";
import { usePostApiPedidosIdConfirmar,usePostApiPedidosIdCancelar ,useGetApiPedidosId} from "@/api/generated/pedidos/pedidos";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { MoreHorizontal, Eye, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

import type { Pedido } from "@/api/generated/model/pedido";
import DetallePedidoSheet from "./DetallePedidoSheet";




export default function PedidosPage() {
  const [pedidoIdSeleccionado, setPedidoIdSeleccionado] = useState<number | null>(null);
  const { data, isLoading } = useGetApiPedidos();

  const [estadoFiltro, setEstadoFiltro] = useState("all");

  const [fechaFiltro, setFechaFiltro] = useState("");
  const [pedidosLocal, setPedidosLocal] = useState<Pedido[]>([]);


  const [openDetalle, setOpenDetalle] = useState(false);
const [pedidoId, setPedidoId] = useState<number | null>(null);


  const { data: pedidoCompleto } = useGetApiPedidosId(
  pedidoIdSeleccionado!,
  {
    query: { enabled: pedidoIdSeleccionado !== null },
  }
);
  // -----------------------------------------------------------
  // Filtros (estilo ClientesPageV2)
  // -----------------------------------------------------------
useEffect(() => {
  if (data?.data) {
    setPedidosLocal(data.data);
  }
}, [data]);

  
  const pedidosFiltrados = useMemo(() => {
    return pedidosLocal.filter((p) => {
      const byEstado = estadoFiltro === "all" ? true : p.estado === estadoFiltro;


      let byFecha = true;
      if (fechaFiltro) {
        const fecha = new Date(p.created_at);
        const sel = new Date(fechaFiltro);
        byFecha =
          fecha.getFullYear() === sel.getFullYear() &&
          fecha.getMonth() === sel.getMonth() &&
          fecha.getDate() === sel.getDate();
      }

      return byEstado && byFecha;
    });
  }, [pedidosLocal, estadoFiltro, fechaFiltro]);

  // -----------------------------------------------------------
  // Acciones
  // -----------------------------------------------------------
  const confirmarMutation = usePostApiPedidosIdConfirmar(
  {
    mutation: {
      onSuccess: () => {
        toast.success("Pedido confirmado correctamente");
      },
      onError: () => {
        toast.error("No se pudo confirmar el pedido");
      },
    },
  }
);
const confirmarPedido = (id: number) => {
  confirmarMutation.mutate(
    {
      id,
      data: {}, // tu API espera ConfirmarPedido
    },
    {
      onSuccess: () => {
        toast.success("Pedido confirmado correctamente");

        // Actualiza localmente el estado del pedido
        setPedidosLocal((prev) =>
          prev.map((pedido) =>
            pedido.id === id ? { ...pedido, estado: "confirmado" } : pedido
          )
        );
      },
      onError: () => {
        toast.error("No se pudo confirmar el pedido");
      },
    }
  );
};

  const cancelarMutation = usePostApiPedidosIdCancelar({
  mutation: {
    onSuccess: () => {
      toast.success("Pedido cancelado correctamente");
    },
    onError: () => {
      toast.error("No se pudo cancelar el pedido");
    },
  },
});


  const cancelarPedido = (id: number) => {
  cancelarMutation.mutate(
    { id, data: { razon: "cancelacion manual" }}, // ajusta `data` si tu API requiere algo
    {
      onSuccess: () => {
        toast.success("Pedido cancelado correctamente");

        // Actualiza localmente el estado del pedido
        setPedidosLocal((prev) =>
          prev.map((pedido) =>
            pedido.id === id ? { ...pedido, estado: "cancelado" } : pedido
          )
        );
      },
      onError: () => {
        toast.error("No se pudo cancelar el pedido");
      },
    }
  );
};


  const navigate = useNavigate();

useEffect(() => {
  if (pedidoCompleto) {
    navigate("/dashboard/ventas", {
      state: {
        pedido: pedidoCompleto, // enviamos pedido completo
      },
    });
  }
}, [pedidoCompleto]);


  // -----------------------------------------------------------
  // Columnas estilo profesional
  // -----------------------------------------------------------
  const columns = useMemo<ColumnDef<Pedido>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="text-left"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.id}</span>
        ),
      },

      {
        accessorKey: "cliente_id",
        header: "Cliente",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.cliente?.nombre || `#${row.original.cliente_id}`}
          </span>
        ),
      },

      {
        accessorKey: "created_at",
        header: "Fecha",
        cell: ({ row }) => (
          <span>{format(new Date(row.original.created_at), "dd/MM/yyyy")}</span>
        ),
      },

      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
          const estado = row.original.estado.toLowerCase();
          
          if (estado === "entregado") {
            return (
              <Badge variant="secondary" className="bg-blue-500 text-white dark:bg-blue-600">
                Entregado
              </Badge>
            );
          }
          
          const variantMap = {
            pendiente: "secondary" as const,
            confirmado: "default" as const,
            cancelado: "destructive" as const,
          };
          
          return (
            <Badge variant={variantMap[estado as keyof typeof variantMap] || "secondary"}>
              {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </Badge>
          );
        },
      },

      {
        accessorKey: "tipo_recojo",
        header: "Recojo",
        cell: ({ row }) => (
          <span className="capitalize">{row.original.tipo_recojo}</span>
        ),
      },

      // ---------------------------------------------------------
      // ACCIONES
      // ---------------------------------------------------------
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          const p = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                {/* Ver detalles */}
                <DropdownMenuItem
                  onClick={() => {
                    setPedidoId(p.id)
                    setOpenDetalle(true)
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalles
                </DropdownMenuItem>


                <DropdownMenuSeparator />

                {/* Confirmar */}
                {p.estado === "pendiente" && (
                  <DropdownMenuItem
                    disabled={confirmarMutation.isPending}
                    onClick={() => confirmarPedido(p.id)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {confirmarMutation.isPending ? "Confirmando..." : "Confirmar pedido"}
                  </DropdownMenuItem>
                )}


                {/* Cancelar */}
                {p.estado === "pendiente" && (
                  <DropdownMenuItem
                    onClick={() => cancelarPedido(p.id)}
                    disabled={cancelarMutation.isPending}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {cancelarMutation.isPending ? "Cancelando..." : "Cancelar pedido"}
                  </DropdownMenuItem>

                )}

                {/* Generar POS */}
                {p.estado === "confirmado" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setPedidoIdSeleccionado(p.id)}

                      className="font-semibold"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Generar Venta POS
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  // -----------------------------------------------------------
  // Tabla Tanstack
  // -----------------------------------------------------------
  const table = useReactTable({
    data: pedidosFiltrados,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) return <p>Cargando pedidos...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Pedidos</h1>

      {/* ------------------------------------------------------- */}
      {/* Filtros */}
      {/* ------------------------------------------------------- */}
      <div className="flex gap-4 items-center">
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
           <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
            <SelectItem value="entregado">Entregado</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-[180px]"
          value={fechaFiltro}
          onChange={(e) => setFechaFiltro(e.target.value)}
        />
      </div>

      {/* ------------------------------------------------------- */}
      {/* Tabla */}
      {/* ------------------------------------------------------- */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((g) => (
              <TableRow key={g.id}>
                {g.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center h-24"
                >
                  No se encontraron pedidos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ------------------------------------------------------- */}
      {/* Paginación */}
      {/* ------------------------------------------------------- */}
      <div className="flex justify-between items-center pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>

        <span className="text-sm">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
      <DetallePedidoSheet
        open={openDetalle}
        onOpenChange={setOpenDetalle}
        pedidoId={pedidoId}
      />
    </div>
  );
}
