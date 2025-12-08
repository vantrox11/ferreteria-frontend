/**
 * MODAL DE EMISIÓN DE NOTA DE CRÉDITO
 * 
 * Permite emitir NC con:
 * - Selección de tipo de nota
 * - Motivo detallado
 * - Productos a devolver (con cantidades editables)
 * - Opción de devolver stock
 */

import * as React from "react"
import { Loader2 } from "lucide-react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

import { usePostApiNotasCredito } from "@/api/generated/notas-credito/notas-credito"
import { useGetApiVentasIdSaldoNc } from "@/api/generated/ventas-pos/ventas-pos"
import type { Venta } from "@/api/generated/model"
import { toast } from "sonner"
import { useCaja } from "@/context/CajaContext"

// Tipos de Nota de Crédito según SUNAT
const tiposNotaCredito = [
  { value: "ANULACION_DE_LA_OPERACION", label: "Anulación de la operación" },
  { value: "ANULACION_POR_ERROR_EN_EL_RUC", label: "Anulación por error en el RUC" },
  { value: "CORRECCION_POR_ERROR_EN_LA_DESCRIPCION", label: "Corrección por error en la descripción" },
  { value: "DESCUENTO_GLOBAL", label: "Descuento global" },
  { value: "DEVOLUCION_TOTAL", label: "Devolución total" },
  { value: "DEVOLUCION_PARCIAL", label: "Devolución parcial" },
  { value: "OTROS", label: "Otros" },
]

// Schema de validación
const notaCreditoSchema = z.object({
  tipo_nota: z.string().min(1, "Selecciona un tipo de nota"),
  motivo_sustento: z.string().min(10, "Mínimo 10 caracteres").max(500, "Máximo 500 caracteres"),
  devolver_stock: z.boolean(),
  devolver_efectivo: z.boolean().optional(),
  sesion_caja_id: z.number().optional(),
  detalles: z.array(
    z.object({
      producto_id: z.number(),
      cantidad: z.number().min(0.001, "Cantidad debe ser mayor a 0"),
      precio_unitario: z.number(),
    })
  ).min(1, "Debe incluir al menos un producto"),
})

type NotaCreditoForm = z.infer<typeof notaCreditoSchema>

interface ModalNotaCreditoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venta: Venta | null
  onSuccess?: () => void
}

export function ModalNotaCredito({
  open,
  onOpenChange,
  venta,
  onSuccess,
}: ModalNotaCreditoProps) {
  const { mutateAsync: crearNC, isPending } = usePostApiNotasCredito()
  const { currentSession } = useCaja()

  // Hook para consultar saldo disponible
  const { data: saldoNCResponse } = useGetApiVentasIdSaldoNc(
    venta?.id?.toString() || '0',
    { 
      query: { 
        enabled: !!venta?.id && open,
        staleTime: 0,
      } 
    }
  );
  const saldoNC = saldoNCResponse?.data;

  const form = useForm<NotaCreditoForm>({
    resolver: zodResolver(notaCreditoSchema),
    defaultValues: {
      tipo_nota: "",
      motivo_sustento: "",
      devolver_stock: true,
      devolver_efectivo: true,
      sesion_caja_id: undefined,
      detalles: [],
    },
  })

  const { fields, update } = useFieldArray({
    control: form.control,
    name: "detalles",
  })

  // Inicializar detalles cuando se abre el modal
  React.useEffect(() => {
    if (open && venta?.detalles) {
      const detallesIniciales = venta.detalles.map((d: any) => ({
        producto_id: d.producto_id,
        cantidad: Number(d.cantidad),
        precio_unitario: Number(d.precio_unitario),
        producto_nombre: d.producto?.nombre || `Producto ${d.producto_id}`,
        cantidad_original: Number(d.cantidad),
      }))
      form.reset({
        tipo_nota: "",
        motivo_sustento: "",
        devolver_stock: true,
        devolver_efectivo: venta.condicion_pago === 'CONTADO' ? true : false,
        sesion_caja_id: currentSession?.id || undefined,
        detalles: detallesIniciales,
      })
    }
  }, [open, venta, form, currentSession])

  const onSubmit = async (data: NotaCreditoForm) => {
    if (!venta) return

    try {
      await crearNC({
        data: {
          venta_referencia_id: venta.id,
          tipo_nota: data.tipo_nota as any,
          motivo_sustento: data.motivo_sustento,
          devolver_stock: data.devolver_stock,
          devolver_efectivo: data.devolver_efectivo || false,
          sesion_caja_id: data.sesion_caja_id,
          detalles: data.detalles.map(d => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
          })),
        },
      })

      toast.success("Nota de Crédito emitida", {
        description: "La NC fue enviada a SUNAT correctamente",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error("Error al emitir NC", {
        description: error?.response?.data?.message || error.message,
      })
    }
  }

  const tipoNota = form.watch("tipo_nota")
  const devolverEfectivo = form.watch("devolver_efectivo")
  const mostrarDevolverStock = 
    tipoNota === "DEVOLUCION_TOTAL" || 
    tipoNota === "DEVOLUCION_PARCIAL"
  
  // Validaciones de estado
  const esVentaContado = venta?.condicion_pago === 'CONTADO'
  const ventaAceptadaEnSunat = venta?.estado_sunat === 'ACEPTADO'
  const haySesionCajaAbierta = currentSession?.estado === 'ABIERTA'
  const tiposQueReducenDeuda = ['DEVOLUCION_TOTAL', 'DEVOLUCION_PARCIAL', 'ANULACION_DE_LA_OPERACION']
  const debeValidarEfectivo = esVentaContado && devolverEfectivo && tiposQueReducenDeuda.includes(tipoNota)

  const calcularTotal = () => {
    return fields.reduce((sum, field: any) => {
      return sum + (field.cantidad * field.precio_unitario)
    }, 0)
  }

  // Validar si el total calculado excede el saldo disponible
  const totalCalculado = calcularTotal()
  const excedeDisponible = saldoNC ? totalCalculado > saldoNC.saldo_disponible : false

  if (!venta) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Emitir Nota de Crédito
            {ventaAceptadaEnSunat && saldoNC?.puede_emitir_nc && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                Disponible
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Venta: {venta.serie?.codigo}-{String(venta.numero_comprobante).padStart(6, "0")} | 
            Total: S/ {Number(venta.total).toFixed(2)} | 
            Estado SUNAT: <span className={ventaAceptadaEnSunat ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {venta.estado_sunat || 'PENDIENTE'}
            </span>
          </DialogDescription>
          
          {/* Alerta si la venta no está ACEPTADA */}
          {!ventaAceptadaEnSunat && (
            <div className="mt-3 p-4 rounded-lg bg-red-50 border-2 border-red-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Venta no aceptada en SUNAT</p>
                  <p className="text-xs text-red-800 mt-1">
                    Solo puedes emitir Notas de Crédito sobre ventas con estado <strong>ACEPTADO</strong>.
                    Espera a que SUNAT procese esta venta antes de continuar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col space-y-4">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {/* Información de saldo disponible - MEJORADA */}
                {ventaAceptadaEnSunat && saldoNC && (
                  <div className={`p-4 rounded-lg border-2 ${
                    saldoNC.puede_emitir_nc 
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300' 
                      : 'bg-gradient-to-r from-red-50 to-red-100 border-red-300'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className={`text-sm font-semibold mb-1 ${
                          saldoNC.puede_emitir_nc ? 'text-blue-900' : 'text-red-900'
                        }`}>
                          {saldoNC.puede_emitir_nc ? '💰 Saldo Disponible para NC' : '🚫 Sin Saldo Disponible'}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-3xl font-mono font-bold ${
                            saldoNC.puede_emitir_nc ? 'text-blue-700' : 'text-red-700'
                          }`}>
                            S/ {saldoNC.saldo_disponible.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            de S/ {saldoNC.total_venta.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Indicador visual de progreso */}
                      <div className="flex-shrink-0 w-16 h-16 relative">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-gray-200"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - (saldoNC.saldo_disponible / saldoNC.total_venta))}`}
                            className={saldoNC.puede_emitir_nc ? 'text-blue-600' : 'text-red-600'}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-xs font-bold ${
                            saldoNC.puede_emitir_nc ? 'text-blue-700' : 'text-red-700'
                          }`}>
                            {Math.round((saldoNC.saldo_disponible / saldoNC.total_venta) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Detalle de montos */}
                    <div className="mt-3 pt-3 border-t border-current/10 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total venta:</span>
                        <span className="font-mono">S/ {saldoNC.total_venta.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Ya devuelto en NCs:</span>
                        <span className="font-mono text-red-600">- S/ {saldoNC.total_devuelto.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold pt-1 border-t border-current/10">
                        <span>Disponible:</span>
                        <span className="font-mono">S/ {saldoNC.saldo_disponible.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* Mensaje de bloqueo */}
                    {!saldoNC.puede_emitir_nc && saldoNC.razon_bloqueo && (
                      <div className="mt-3 p-2 rounded bg-red-100 border border-red-200">
                        <p className="text-xs text-red-900 font-medium">
                          ⚠️ {saldoNC.razon_bloqueo}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tipo de Nota */}
                <FormField
                  control={form.control}
                  name="tipo_nota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Nota de Crédito *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tiposNotaCredito.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Motivo */}
                <FormField
                  control={form.control}
                  name="motivo_sustento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo del Sustento *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe el motivo de la NC (min. 10 caracteres)"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value.length}/500 caracteres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Devolver Stock (solo para devoluciones) */}
                {mostrarDevolverStock && (
                  <FormField
                    control={form.control}
                    name="devolver_stock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Devolver productos al inventario
                          </FormLabel>
                          <FormDescription>
                            Si está marcado, las cantidades se sumarán nuevamente al stock
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {/* Devolver Efectivo (solo para CONTADO) */}
                {esVentaContado && mostrarDevolverStock && (
                  <FormField
                    control={form.control}
                    name="devolver_efectivo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-blue-50">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!haySesionCajaAbierta}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className={!haySesionCajaAbierta ? 'opacity-50' : ''}>
                            💵 Generar egreso automático de caja
                          </FormLabel>
                          <FormDescription className={!haySesionCajaAbierta ? 'opacity-50' : ''}>
                            {haySesionCajaAbierta ? (
                              <>
                                Se creará un movimiento de EGRESO por S/ {totalCalculado.toFixed(2)} en la caja actual.
                                {!field.value && (
                                  <span className="block mt-1 text-amber-700 font-medium">
                                    ⚠️ Deberás registrar el egreso manualmente más tarde
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-red-700 font-medium">
                                ❌ No hay sesión de caja abierta. Abre una caja para habilitar esta opción.
                              </span>
                            )}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <Separator />

                {/* Productos */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Productos a incluir en la NC</h3>
                  <div className="space-y-2">
                    {fields.map((field: any, index) => (
                      <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{field.producto_nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            Precio: S/ {field.precio_unitario.toFixed(2)} | 
                            Original: {field.cantidad_original} unid.
                          </p>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            max={field.cantidad_original}
                            value={field.cantidad}
                            onChange={(e) => {
                              const newValue = Number(e.target.value)
                              update(index, { ...field, cantidad: newValue })
                            }}
                            className={excedeDisponible ? 'border-red-500 bg-red-50' : ''}
                          />
                        </div>
                        <div className="w-24 text-right font-mono text-sm">
                          S/ {(field.cantidad * field.precio_unitario).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total y validación */}
                  <div className={`mt-3 p-3 rounded-md border ${
                    excedeDisponible 
                      ? 'bg-red-50 border-red-300' 
                      : 'bg-muted/30 border-muted'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total de la NC:</span>
                      <span className={`font-mono font-bold text-lg ${
                        excedeDisponible ? 'text-red-700' : ''
                      }`}>
                        S/ {totalCalculado.toFixed(2)}
                      </span>
                    </div>
                    {excedeDisponible && (
                      <p className="text-xs text-red-700 mt-2 font-medium">
                        ⚠️ El monto excede el saldo disponible (S/ {saldoNC?.saldo_disponible.toFixed(2)})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={
                  isPending || 
                  excedeDisponible || 
                  !ventaAceptadaEnSunat || 
                  (debeValidarEfectivo && !haySesionCajaAbierta) ||
                  (saldoNC !== undefined && saldoNC.puede_emitir_nc === false)
                }
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!ventaAceptadaEnSunat ? '🚫 Venta no aceptada' : 'Emitir Nota de Crédito'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
