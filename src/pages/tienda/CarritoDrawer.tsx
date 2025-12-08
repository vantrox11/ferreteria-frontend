import { useCarritoStore } from "@/store/carrito"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Trash2, ShoppingCart } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

type CarritoDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CarritoDrawer({ open, onOpenChange }: CarritoDrawerProps) {
  const items = useCarritoStore((s) => s.carrito)
  const eliminarItem = useCarritoStore((s) => s.eliminarItem)
  const total = useCarritoStore((s) => s.total)

  const cantidadTotal = items.reduce((sum, item) => sum + item.cantidad, 0)
  console.log("Renderizando CarritoDrawer con items:", items.length)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right" >
      <DrawerContent className="fixed bottom-0 right-0 w-80 max-w-full rounded-t-lg border-t bg-background shadow-lg ">
        <DrawerHeader>
          <DrawerTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Tu carrito ({cantidadTotal})
          </DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar carrito"
            className="ml-auto"
          >
            ✕
          </Button>
        </DrawerHeader>

        <Separator />

        <ScrollArea className="h-[300px] px-4">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">El carrito está vacío</p>
          ) : (
            <div className="space-y-4 py-4">
              {items.map((item) => (
                <div
                  key={item.productoId}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card"
                >
                  <div>
                    <p className="font-medium">{item.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.cantidad} × S/ {item.precio}
                    </p>
                  </div>

                  <button
                    onClick={() => eliminarItem(item.productoId)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <DrawerFooter>
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">Total:</p>
            <p className="text-xl font-bold text-primary">S/ {total().toFixed(2)}</p>
          </div>

          <Button
            className={`w-full mt-2 ${
    items.length === 0
      ? "cursor-not-allowed opacity-50 bg-white text-gray-400 hover:bg-transparent"
      : "bg-primary text-primary-foreground hover:bg-primary/90"
  }`}
            disabled={items.length === 0}
            asChild
          >
            <a
    href={items.length === 0 ? undefined : "/tienda/checkout"}  // Quita href si está deshabilitado
    onClick={(e) => {
      if (items.length === 0) e.preventDefault()  // Previene navegación si vacío
    }}
    aria-disabled={items.length === 0}
    tabIndex={items.length === 0 ? -1 : 0} 
  >
    Finalizar compra
  </a>
          </Button>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Seguir comprando
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
