/**
 * MODAL DE EMISIÓN DE GUÍA DE REMISIÓN
 * 
 * Permite emitir GRE con:
 * - Reutilización de productos de una venta existente
 * - Selección de motivo de traslado (VENTA, COMPRA, TRASLADO_ENTRE_ESTABLECIMIENTOS, OTROS)
 * - Modo transporte: PRIVADO (con datos conductor/vehículo) o PUBLICO (con RUC transportista)
 * - Puntos de partida y llegada
 * - Fecha de inicio de traslado
 * - Peso bruto y número de bultos
 */

import * as React from "react"
import { Loader2, Truck, Calendar, MapPin } from "lucide-react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { usePostApiGuiasRemision } from "@/api/generated/guias-remision/guias-remision"
import type { Venta, CreateGuiaRemisionMotivoTraslado } from "@/api/generated/model"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/api-error"

// Motivos de traslado según SUNAT
const motivosTraslado = [
  { value: "VENTA", label: "Venta" },
  { value: "COMPRA", label: "Compra" },
  { value: "TRASLADO_ENTRE_ESTABLECIMIENTOS", label: "Traslado entre establecimientos" },
  { value: "OTROS", label: "Otros" },
]

// Schema de validación
const guiaRemisionSchema = z.object({
  motivo_traslado: z.string().min(1, "Selecciona un motivo"),
  descripcion_motivo: z.string().max(500, "Máximo 500 caracteres").optional(),

  // Datos de carga
  peso_bruto_total: z.number().min(0.001, "Peso debe ser mayor a 0"),
  numero_bultos: z.number().int().min(1, "Mínimo 1 bulto"),

  // Puntos
  direccion_partida: z.string().min(10, "Mínimo 10 caracteres"),
  ubigeo_partida: z.string().optional(),
  direccion_llegada: z.string().min(10, "Mínimo 10 caracteres"),
  ubigeo_llegada: z.string().optional(),

  // Transporte
  modalidad_transporte: z.enum(["PRIVADO", "PUBLICO"]),

  // PUBLICO
  ruc_transportista: z.string().optional(),
  razon_social_transportista: z.string().optional(),

  // PRIVADO
  placa_vehiculo: z.string().optional(),
  licencia_conducir: z.string().optional(),
  nombre_conductor: z.string().optional(),

  // Fecha
  fecha_inicio_traslado: z.date({ required_error: "Selecciona una fecha" }),

  // Detalles
  detalles: z.array(
    z.object({
      producto_id: z.number(),
      cantidad: z.number().min(0.001, "Cantidad debe ser mayor a 0"),
    })
  ).min(1, "Debe incluir al menos un producto"),
}).refine((data) => {
  // Validación condicional: si es PUBLICO, requiere RUC y razón social
  if (data.modalidad_transporte === "PUBLICO") {
    return data.ruc_transportista && data.razon_social_transportista
  }
  return true
}, {
  message: "Completa los datos del transportista",
  path: ["ruc_transportista"],
}).refine((data) => {
  // Validación condicional: si es PRIVADO, requiere placa, licencia y conductor
  if (data.modalidad_transporte === "PRIVADO") {
    return data.placa_vehiculo && data.licencia_conducir && data.nombre_conductor
  }
  return true
}, {
  message: "Completa los datos del vehículo y conductor",
  path: ["placa_vehiculo"],
})

type GuiaRemisionForm = z.infer<typeof guiaRemisionSchema>

interface ModalGuiaRemisionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venta?: Venta | null  // Opcional: si se pasa, precarga productos
  onSuccess?: () => void
}

export function ModalGuiaRemision({
  open,
  onOpenChange,
  venta,
  onSuccess,
}: ModalGuiaRemisionProps) {
  const { mutateAsync: crearGRE, isPending } = usePostApiGuiasRemision()

  const form = useForm<GuiaRemisionForm>({
    resolver: zodResolver(guiaRemisionSchema),
    defaultValues: {
      motivo_traslado: "VENTA",
      descripcion_motivo: "",
      peso_bruto_total: 1,
      numero_bultos: 1,
      direccion_partida: "",
      ubigeo_partida: "",
      direccion_llegada: "",
      ubigeo_llegada: "",
      modalidad_transporte: "PRIVADO",
      ruc_transportista: "",
      razon_social_transportista: "",
      placa_vehiculo: "",
      licencia_conducir: "",
      nombre_conductor: "",
      fecha_inicio_traslado: new Date(),
      detalles: [],
    },
  })

  const { fields, update } = useFieldArray({
    control: form.control,
    name: "detalles",
  })

  const modalidadTransporte = form.watch("modalidad_transporte")

  // Inicializar detalles cuando se abre el modal con una venta
  React.useEffect(() => {
    if (open && venta?.detalles) {
      const detallesIniciales = venta.detalles.map((d) => ({
        producto_id: d.producto_id,
        cantidad: Number(d.cantidad),
        producto_nombre: d.producto?.nombre || `Producto ${d.producto_id}`,
        producto_unidad: d.producto?.unidad_medida?.codigo || "UND",
        cantidad_original: Number(d.cantidad),
      }))

      form.reset({
        motivo_traslado: "VENTA",
        descripcion_motivo: venta.serie && venta.numero_comprobante
          ? `Traslado por venta ${venta.serie.codigo}-${String(venta.numero_comprobante).padStart(6, "0")}`
          : "",
        peso_bruto_total: 1,
        numero_bultos: 1,
        direccion_partida: "",
        ubigeo_partida: "",
        direccion_llegada: "",
        ubigeo_llegada: "",
        modalidad_transporte: "PRIVADO",
        ruc_transportista: "",
        razon_social_transportista: "",
        placa_vehiculo: "",
        licencia_conducir: "",
        nombre_conductor: "",
        fecha_inicio_traslado: new Date(),
        detalles: detallesIniciales,
      })
    } else if (open && !venta) {
      // Modal abierto sin venta: resetear completamente
      form.reset()
    }
  }, [open, venta, form])

  const onSubmit = async (data: GuiaRemisionForm) => {
    try {
      await crearGRE({
        data: {
          venta_id: venta?.id,
          motivo_traslado: data.motivo_traslado as CreateGuiaRemisionMotivoTraslado,
          descripcion_motivo: data.descripcion_motivo,
          peso_bruto_total: data.peso_bruto_total,
          numero_bultos: data.numero_bultos,
          direccion_partida: data.direccion_partida,
          ubigeo_partida: data.ubigeo_partida,
          direccion_llegada: data.direccion_llegada,
          ubigeo_llegada: data.ubigeo_llegada,
          modalidad_transporte: data.modalidad_transporte,
          ruc_transportista: data.modalidad_transporte === "PUBLICO" ? data.ruc_transportista : undefined,
          razon_social_transportista: data.modalidad_transporte === "PUBLICO" ? data.razon_social_transportista : undefined,
          placa_vehiculo: data.modalidad_transporte === "PRIVADO" ? data.placa_vehiculo : undefined,
          licencia_conducir: data.modalidad_transporte === "PRIVADO" ? data.licencia_conducir : undefined,
          nombre_conductor: data.modalidad_transporte === "PRIVADO" ? data.nombre_conductor : undefined,
          fecha_inicio_traslado: data.fecha_inicio_traslado.toISOString(),
          detalles: data.detalles.map(d => ({
            producto_id: d.producto_id,
            cantidad: d.cantidad,
          })),
        },
      })

      toast.success("Guía de Remisión emitida", {
        description: "La GRE fue enviada a SUNAT correctamente",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error("Error al emitir GRE", {
        description: getErrorMessage(error, "No se pudo emitir la guía de remisión"),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Emitir Guía de Remisión Electrónica
          </DialogTitle>
          <DialogDescription>
            {venta
              ? `Basada en venta: ${venta.serie?.codigo}-${String(venta.numero_comprobante).padStart(6, "0")}`
              : "Traslado sin venta asociada"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col gap-4">
            <ScrollArea className="flex-1 pr-4" style={{ maxHeight: 'calc(95vh - 180px)' }}>
              <div className="space-y-6">
                {/* Motivo de Traslado */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">📋 Motivo del Traslado</h3>

                  <FormField
                    control={form.control}
                    name="motivo_traslado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un motivo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {motivosTraslado.map((motivo) => (
                              <SelectItem key={motivo.value} value={motivo.value}>
                                {motivo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descripcion_motivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción adicional (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ej: Entrega a cliente en Av. Los Pinos 123"
                            className="min-h-[60px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/500 caracteres
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Datos de Carga */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">📦 Datos de Carga</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="peso_bruto_total"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso Bruto Total (kg) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="50.5"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numero_bultos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Bultos *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="5"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Puntos de Partida y Llegada */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Puntos de Partida y Llegada
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="direccion_partida"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección de Partida *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Av. Industrial 456, Lima"
                                className="min-h-[70px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ubigeo_partida"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ubigeo Partida (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="150101" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Código SUNAT (6 dígitos)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="direccion_llegada"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección de Llegada *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Jr. Las Flores 789, Callao"
                                className="min-h-[70px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ubigeo_llegada"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ubigeo Llegada (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="070101" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Código SUNAT (6 dígitos)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Fecha de Inicio de Traslado */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha de Traslado
                  </h3>

                  <FormField
                    control={form.control}
                    name="fecha_inicio_traslado"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Inicio del Traslado *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Selecciona una fecha</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Fecha en que se realizará el traslado físico
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Modalidad de Transporte */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Datos del Transporte
                  </h3>

                  <FormField
                    control={form.control}
                    name="modalidad_transporte"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Modalidad de Transporte *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-3 space-y-0">
                              <RadioGroupItem value="PRIVADO" />
                              <Label className="font-normal">
                                Transporte Privado (Vehículo propio)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3 space-y-0">
                              <RadioGroupItem value="PUBLICO" />
                              <Label className="font-normal">
                                Transporte Público (Empresa transportista)
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campos PRIVADO */}
                  {modalidadTransporte === "PRIVADO" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">Datos del vehículo y conductor</p>

                      <FormField
                        control={form.control}
                        name="placa_vehiculo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Placa del Vehículo *</FormLabel>
                            <FormControl>
                              <Input placeholder="ABC-123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="licencia_conducir"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Licencia de Conducir *</FormLabel>
                              <FormControl>
                                <Input placeholder="A-I" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="nombre_conductor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre del Conductor *</FormLabel>
                              <FormControl>
                                <Input placeholder="Juan Pérez" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Campos PUBLICO */}
                  {modalidadTransporte === "PUBLICO" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">Datos de la empresa transportista</p>

                      <FormField
                        control={form.control}
                        name="ruc_transportista"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RUC del Transportista *</FormLabel>
                            <FormControl>
                              <Input placeholder="20123456789" maxLength={11} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="razon_social_transportista"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Razón Social del Transportista *</FormLabel>
                            <FormControl>
                              <Input placeholder="TRANSPORTES XYZ S.A.C." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Productos */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">📦 Productos a Trasladar</h3>

                  {fields.length === 0 ? (
                    <div className="p-4 border rounded-lg bg-muted/30 text-center text-sm text-muted-foreground">
                      No hay productos. Vincula esta guía a una venta o agrégalos manualmente.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fields.map((field, index) => {
                        const f = field as { id: string; producto_id: number; cantidad: number; producto_nombre: string; producto_unidad: string; cantidad_original: number }
                        return (
                          <div key={f.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{f.producto_nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                Unidad: {f.producto_unidad} | Original: {f.cantidad_original}
                              </p>
                            </div>
                            <div className="w-28">
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                max={f.cantidad_original}
                                value={f.cantidad}
                                onChange={(e) => {
                                  const newValue = Number(e.target.value)
                                  update(index, { ...f, cantidad: newValue })
                                }}
                              />
                            </div>
                            <div className="w-20 text-right text-sm font-mono">
                              {f.cantidad} {f.producto_unidad}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="flex-shrink-0 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || fields.length === 0}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Emitir Guía de Remisión
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog >
  )
}
