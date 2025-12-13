/**
 * Página: Movimientos de Caja
 * Gestión completa de ingresos y egresos de caja
 */

import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MovimientosCajaModal } from '@/components/MovimientosCajaModal';
import {
  useGetApiMovimientosCajaSesionActiva,
} from '@/api/generated/movimientos-de-caja/movimientos-de-caja';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MovimientosCajaPage() {
  const [showModal, setShowModal] = useState(false);

  // Obtener movimientos de la sesión activa
  const { data: movimientos, isLoading } = useGetApiMovimientosCajaSesionActiva();

  const movimientosData = movimientos?.data || [];

  // Calcular totales
  const totalIngresos = movimientosData
    .filter((m) => m.tipo === 'INGRESO')
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const totalEgresos = movimientosData
    .filter((m) => m.tipo === 'EGRESO')
    .reduce((sum, m) => sum + Number(m.monto), 0);

  const saldoNeto = totalIngresos - totalEgresos;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimientos de Caja</h1>
          <p className="text-muted-foreground">
            Gestiona los ingresos y egresos de tu sesión de caja actual
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Nuevo Movimiento
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIngresos)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sesión actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Egresos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalEgresos)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sesión actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Neto</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoNeto >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatCurrency(saldoNeto)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ingresos - Egresos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <CardDescription>
            Todos los movimientos registrados en tu sesión de caja actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : movimientosData.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No hay movimientos registrados</h3>
              <p className="text-muted-foreground mt-2">
                Comienza registrando tu primer ingreso o egreso
              </p>
              <Button onClick={() => setShowModal(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Crear Movimiento
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Caja</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientosData.map((movimiento) => (
                    <TableRow key={movimiento.id}>
                      <TableCell className="font-medium">
                        {format(new Date(movimiento.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>
                        {movimiento.tipo === 'INGRESO' ? (
                          <Badge variant="default" className="bg-green-600">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            INGRESO
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <TrendingDown className="mr-1 h-3 w-3" />
                            EGRESO
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={movimiento.descripcion}>
                          {movimiento.descripcion}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {movimiento.venta_id ? (
                          <span className="font-mono">Venta #{movimiento.venta_id}</span>
                        ) : movimiento.nota_credito_id ? (
                          <span className="font-mono">NC #{movimiento.nota_credito_id}</span>
                        ) : movimiento.pago_id ? (
                          <span className="font-mono">Pago #{movimiento.pago_id}</span>
                        ) : (
                          <span className="italic">Manual</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${movimiento.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {movimiento.tipo === 'INGRESO' ? '+' : '-'}
                        {formatCurrency(Number(movimiento.monto))}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {movimiento.sesion_caja?.caja?.nombre || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear Movimiento */}
      <MovimientosCajaModal
        open={showModal}
        onOpenChange={setShowModal}
      />
    </div>
  );
}
