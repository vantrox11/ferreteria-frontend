// Header del sitio con trigger del sidebar
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Search, Bell, Sun, Settings, Command as CommandIcon } from "lucide-react"
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useAuth } from "@/auth/AuthContext"
import { useLocation } from "react-router-dom"
import { useEffect, useState } from "react"

export function SiteHeader() {
  const [atTop, setAtTop] = useState(true)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => {
      setAtTop(window.scrollY === 0)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  const location = useLocation()
  const { user } = useAuth()
  const pathTitleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/productos": "Productos",
    "/dashboard/categorias": "Categorías",
    "/dashboard/inventario": "Inventario",
    "/dashboard/usuarios": "Usuarios",
    "/dashboard/clientes": "Clientes",
    "/dashboard/proveedores": "Proveedores",
    "/dashboard/pedidos": "Pedidos",
    "/dashboard/ventas": "Ventas",
    "/dashboard/compras": "Compras",
    "/dashboard/reportes": "Reportes",
    "/dashboard/configuracion": "Configuración",
  }
  const title = pathTitleMap[location.pathname] ?? "Ferretería"
  const onToggleTheme = () => {
    const root = document.documentElement
    if (root.classList.contains("dark")) root.classList.remove("dark")
    else root.classList.add("dark")
  }

  return (
    <header
      className={[
        "group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
        "sticky top-0 z-50",
        "flex h-(--header-height) shrink-0 items-center gap-2",
        "bg-background/40 backdrop-blur-md border-b",
        atTop ? "md:rounded-tl-xl md:rounded-tr-xl" : "",
      ].join(" ")}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-6 w-[2px] bg-foreground/20" />

        <div className="lg:flex-1">
          <div className="relative hidden max-w-sm flex-1 lg:block">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search..."
              className="h-9 w-full pr-4 pl-10 cursor-pointer"
              readOnly
              onClick={() => setOpen(true)}
            />
            <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded-sm bg-zinc-200 p-1 font-mono text-xs font-medium sm:flex dark:bg-neutral-700">
              <CommandIcon className="size-3" />
              <span>k</span>
            </div>
          </div>
          <div className="block lg:hidden">
            <Button size="icon" variant="ghost" className="size-9">
              <Search onClick={() => setOpen(true)} />
            </Button>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="icon" variant="ghost" className="size-9 relative">
            <Bell />
            <span className="bg-destructive absolute end-0 top-0 block size-2 shrink-0 rounded-full" />
          </Button>
          <Button size="icon" variant="ghost" className="size-9" onClick={onToggleTheme}>
            <Sun />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="size-9">
                <Settings />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Preferencias</DropdownMenuItem>
              <DropdownMenuItem>Salir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" className="mx-2 h-6 w-[2px] bg-foreground/20" />
          <Avatar>
            <AvatarImage alt="user" src={user?.avatar || "https://github.com/shadcn.png"} />
            <AvatarFallback>{user?.name?.[0] || "M"}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => setOpen(false)}>Dashboard</CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>Productos</CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>Clientes</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  )
}
