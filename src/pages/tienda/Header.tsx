import React, { useState } from "react"
import { ShoppingCart, Menu, X, Home, Package, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CarritoDrawer } from "@/pages/tienda/CarritoDrawer"
import { useCarritoStore } from "@/store/carrito"

import { Badge } from "@/components/ui/badge"

export function HeaderPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Obtener cantidad total de items en carrito
  const cantidadTotal = useCarritoStore((state) =>
    state.carrito.reduce((sum, item) => sum + item.cantidad, 0)
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl text-foreground">Ferretería Online</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Inicio
          </a>
          <a
            href="/tienda"
            className="flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            <Package className="h-4 w-4" />
            Productos
          </a>
          <a
            href="/contacto"
            className="flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            <Mail className="h-4 w-4" />
            Contacto
          </a>
        </nav>

        {/* Cart & Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Botón carrito */}
         <Button
  variant="ghost"
  size="icon"
  className="relative"
  aria-label="Carrito de compras"
  onClick={() => setIsCartOpen(true)}
>
  <ShoppingCart className="h-5 w-5" />
  {cantidadTotal > 0 && (
    <Badge
      variant="destructive"
      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full text-xs font-bold"
    >
      {cantidadTotal}
    </Badge>
  )}
</Button>

          {/* Drawer del carrito */}
          <CarritoDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />

          {/* Botón menú móvil */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden border-t bg-card animate-in slide-in-from-top-2">
          <div className="container space-y-1 px-4 py-3">
            <a
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="h-4 w-4" />
              Inicio
            </a>
            <a
              href="/tienda"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              <Package className="h-4 w-4" />
              Productos
            </a>
            <a
              href="/contacto"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              <Mail className="h-4 w-4" />
              Contacto
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}
