import { useParams, Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function PedidoConfirmado() {
  const { id } = useParams() // ID viene desde /tienda/confirmacion/:id

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center p-6 space-y-4">
        <CardHeader>
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-2" />
          <CardTitle className="text-2xl">¡Pedido confirmado!</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <p className="text-muted-foreground">
            Hemos recibido tu pedido correctamente.
          </p>

          {id && (
            <p className="font-semibold text-lg">
              Número de pedido:{" "}
              <span className="text-primary">#{id}</span>
            </p>
          )}

          <Button asChild className="w-full mt-4">
            <Link to="/tienda/catalogo">Volver al catálogo</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
