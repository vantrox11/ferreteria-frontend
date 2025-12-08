"use client"

import { useState, useMemo } from "react"
import { Search, Filter, ShoppingCart, Package } from "lucide-react"
// IMPORTANTE: Ajusta esta ruta según dónde tengas tus hooks generados
import { useGetApiPublicCatalogo } from "@/api/generated/público-catálogo/público-catálogo"
import type { ProductoCatalogoPublico } from "@/api/generated/model"
import { useCarritoStore } from "../../store/carrito"
import { FooterPage } from "./Footer"
import { HeaderPage } from "./Header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"



export default function Catalogo() {
  // Traemos los productos desde la API pública
  const { data: productos, isLoading, error } = useGetApiPublicCatalogo()

  // Función para agregar productos a carrito zustand
  const agregarItem = useCarritoStore((state) => state.agregarItem)

  // Estados para filtros y buscador
  const [busqueda, setBusqueda] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState("all")
  const [marcaFiltro, setMarcaFiltro] = useState("all")
  const [soloConStock, setSoloConStock] = useState(false)

  // Filtramos productos según los filtros y búsqueda
  const productosFiltrados = useMemo(() => {
    if (!productos?.data) return []

    return productos.data.filter((prod: ProductoCatalogoPublico) => {
      const cumpleBusqueda = prod.nombre.toLowerCase().includes(busqueda.toLowerCase())
      const cumpleCategoria = categoriaFiltro !== "all" ? prod.categoria === categoriaFiltro : true
      const cumpleMarca = marcaFiltro !== "all" ? prod.marca === marcaFiltro : true
      const cumpleStock = soloConStock ? prod.stock > 0 : true
      return cumpleBusqueda && cumpleCategoria && cumpleMarca && cumpleStock
    })
  }, [productos, busqueda, categoriaFiltro, marcaFiltro, soloConStock])

  // Obtener listas únicas de categorías y marcas para los selects
  const categoriasUnicas = Array.from(new Set(productos?.data?.map((p) => p.categoria) || []))
  const marcasUnicas = Array.from(new Set(productos?.data?.map((p) => p.marca) || []))

  if (isLoading) {
    return (
      <>
        <HeaderPage />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        </div>
        <FooterPage />
      </>
    )
  }

  if (error) {
    return (
      <>
        <HeaderPage />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-2">
              <Package className="w-12 h-12 text-destructive mx-auto" />
              <h2 className="text-lg font-semibold text-foreground">Error cargando productos</h2>
              <p className="text-sm text-muted-foreground">Intenta recargar la página</p>
            </CardContent>
          </Card>
        </div>
        <FooterPage />
      </>
    )
  }

  return (
    <>
      <HeaderPage />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 md:p-4">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-foreground mb-2 text-balance">Catálogo de Productos</h1>
            <p className="text-muted-foreground">
              {productosFiltrados.length} {productosFiltrados.length === 1 ? "producto" : "productos"} encontrados
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-80 ">
              <Card className="p-6 space-y-6 bg-card sticky top-27 gap-0">
                {/* Header de filtros */}
                <div className="flex items-center gap-2 pb-4 border-b border-border">
                  <Filter className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Filtros</h2>
                </div>

                {/* Buscador */}
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm font-medium text-foreground">
                    Buscar producto
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Buscar..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="pl-9 bg-background"
                    />
                  </div>
                </div>

                {/* Filtro de categoría */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-foreground">
                    Categoría
                  </Label>
                  <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                    <SelectTrigger id="category" className="bg-background">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categoriasUnicas.map((cat) => (
                        <SelectItem key={cat ?? "null"} value={cat ?? "all"}>
                          {cat ?? "Sin categoría"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de marca */}
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-sm font-medium text-foreground">
                    Marca
                  </Label>
                  <Select value={marcaFiltro} onValueChange={setMarcaFiltro}>
                    <SelectTrigger id="brand" className="bg-background">
                      <SelectValue placeholder="Todas las marcas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las marcas</SelectItem>
                      {marcasUnicas.map((mar) => (
                        <SelectItem key={mar ?? "null"} value={mar ?? "all"}>
                          {mar ?? "Sin marca"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de stock */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-start space-x-3">
                    <Checkbox id="stock" checked={soloConStock} onCheckedChange={setSoloConStock} className="mt-0.5" />
                    <div className="space-y-1">
                      <Label htmlFor="stock" className="text-sm font-medium text-foreground cursor-pointer">
                        Solo productos con stock
                      </Label>
                      <p className="text-xs text-muted-foreground">Mostrar únicamente productos disponibles</p>
                    </div>
                  </div>
                </div>
              </Card>
            </aside>

            <main className="flex-1">
              {productosFiltrados.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron productos</h3>
                  <p className="text-sm text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  {productosFiltrados.map((prod) => {
                    const imagenUrl =
  prod.imagen_url && prod.imagen_url.trim() !== ""
    ? prod.imagen_url
    : `https://placehold.co/300x300?text=${encodeURIComponent(prod.nombre ?? "Sin+imagen")}`;


                    return (
                      <Card key={prod.id} className="py-2 gap-1 overflow-hidden hover:shadow-lg transition-shadow animate-fadeIn">
                        {/* Imagen del producto */}
                        <div className="relative aspect-square bg-muted">
                          <img
                            src={imagenUrl || "/placeholder.svg"}
                            alt={prod.nombre}
                            className="w-full h-full object-cover"
                          />
                          {prod.stock === 0 && (
                            <Badge variant="destructive" className="absolute top-3 right-3">
                              Sin Stock
                            </Badge>
                          )}
                          {prod.stock > 0 && prod.stock <= 5 && (
                            <Badge variant="destructive" className="absolute top-3 right-3">
                              Últimas unidades
                            </Badge>
                          )}
                        </div>

                        {/* Contenido del producto */}
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-foreground text-lg leading-tight mb-1">{prod.nombre}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground h-10">
                              {prod.marca && <span>{prod.marca}</span>}
                              {prod.marca && prod.categoria && <span>•</span>}
                              {prod.categoria && <span>{prod.categoria}</span>}
                            </div>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-primary">S/ {prod.precio_venta}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className={prod.stock > 0 ? "text-foreground" : "text-destructive"}>
                              {prod.stock > 0 ? `${prod.stock} disponibles` : "Sin stock"}
                            </span>
                          </div>
                        </CardContent>

                        {/* Botón de agregar al carrito */}
                        <CardFooter className="p-4 pt-0">
                          <Button
                            disabled={prod.stock <= 0}
                            onClick={() =>
                              agregarItem(
                                {
                                  productoId: prod.id,
                                  nombre: prod.nombre,
                                  precio: prod.precio_venta,
                                  stock: prod.stock,
                                },
                                1,
                              )
                            }
                            className="w-full cursor-pointer active:scale-95 transition-transform duration-150"
                            variant={prod.stock <= 0 ? "secondary" : "default"}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {prod.stock <= 0 ? "Sin Stock" : "Agregar al carrito"}
                          </Button>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      <FooterPage />
    </>
  )
}
