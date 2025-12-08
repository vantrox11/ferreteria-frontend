import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePostApiPublicCheckout } from "@/api/generated/público-checkout/público-checkout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCarritoStore } from "@/store/carrito"
import { toast } from "sonner"
import { HeaderPage } from "./Header"
import { FooterPage } from "./Footer"

export default function Checkout() {
  const navigate = useNavigate()
  const { carrito, total, vaciarCarrito } = useCarritoStore()

  const [form, setForm] = useState({
    nombre: "",
    documento_identidad: "",
    email: "",
    telefono: "",
    direccion: "",
    tipoRecojo: "tienda", // tienda | delivery
  })

  const mutation = usePostApiPublicCheckout()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (carrito.length === 0) {
      toast.error("Tu carrito está vacío")
      return
    }

    if (!form.nombre.trim()) return toast.error("Ingresa tu nombre")
    if (!form.documento_identidad.trim()) return toast.error("Ingresa tu DNI o RUC")
    if (!form.telefono.trim()) return toast.error("Ingresa tu número de teléfono")
    if (form.tipoRecojo === "delivery" && !form.direccion.trim()) return toast.error("Ingresa la dirección para envío")

    mutation.mutate(
      {
        data: {
          cliente: {
            nombre: form.nombre,
            documento_identidad: form.documento_identidad,
            email: form.email || "",
            telefono: form.telefono,
            direccion: form.tipoRecojo === "delivery" ? form.direccion : undefined,
          },
          tipo_recojo: form.tipoRecojo === "delivery" ? "envio" : "tienda",
          carrito: carrito.map((i) => ({
            producto_id: i.productoId,
            cantidad: i.cantidad,
          })),
        },
      },
      {
       onSuccess: (response) => {
      toast.success("Pedido enviado correctamente!")
      vaciarCarrito()
      navigate(`/tienda/pedido-confirmado/${response.pedido_id}`)
    },
    onError: () => {
      toast.error("Ocurrió un error al procesar el pedido")
    },
      }
    )
  }

  return (
    <>
      <HeaderPage />
      <div className="max-w-4xl mx-auto py-10 grid md:grid-cols-2 gap-6">
        {/* FORMULARIO */}
        <Card>
          <CardHeader>
            <CardTitle>Finalizar Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>DNI o RUC</Label>
                <Input
                  name="documento_identidad"
                  value={form.documento_identidad}
                  onChange={handleChange}
                  placeholder="Ejemplo: 12345678 o 20123456789"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Correo (opcional)</Label>
                <Input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="987654321"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de recojo</Label>
                <select
                  name="tipoRecojo"
                  value={form.tipoRecojo}
                  onChange={handleChange}
                  className="border rounded-md px-3 py-2 w-full bg-background"
                >
                  <option value="tienda">Recojo en tienda</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              {form.tipoRecojo === "delivery" && (
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChange}
                    placeholder="Dirección para envío"
                    required={form.tipoRecojo === "delivery"}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Enviando..." : "Confirmar Pedido"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* RESUMEN DEL CARRITO */}
        <Card>
          <CardHeader>
            <CardTitle>Tu Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {carrito.length === 0 ? (
              <p className="text-muted-foreground">Tu carrito está vacío.</p>
            ) : (
              carrito.map((item) => (
                <div
                  key={item.productoId}
                  className="flex justify-between border-b pb-2"
                >
                  <span>
                    {item.nombre} x {item.cantidad}
                  </span>
                  <span>S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
              ))
            )}

            <div className="flex justify-between font-bold text-lg pt-3">
              <span>Total:</span>
              <span>S/ {total().toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <FooterPage />
    </>
  )
}
