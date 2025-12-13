// Sidebar de navegación principal con menú de módulos
import * as React from "react"
import {
  BarChartIcon,
  CameraIcon,
  ClipboardListIcon,
  ClipboardCheckIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
  BoxIcon,
  BoxesIcon,
  TagsIcon,
  TruckIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  UserCog as UserCogIcon,
  DollarSignIcon,
  FileCheck,
  Truck,
  Wallet,
  PackageIcon,
  ReceiptIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Link } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
// Eliminamos íconos de Tabler para mantener estética coherente con Lucide
import { useAuth } from "@/auth/AuthContext"

const data = {
  user: {
    name: "Ferreteria Admin",
    email: "m@example.com",
    avatar: "https://github.com/shadcn.png",
  },
  navMain: [
    // Dashboards
    { label: "Dashboards" },
    { title: "Dashboard General", url: "/dashboard", icon: LayoutDashboardIcon },
    { title: "Dashboard Ventas", url: "/dashboard/dashboard-ventas-analisis", icon: BarChartIcon },

    // Ventas
    { label: "Ventas" },
    { title: "Punto de Venta", url: "/dashboard/ventas", icon: ShoppingCartIcon },
    { title: "POS V2", url: "/dashboard/ventas/pos-v2", icon: ShoppingCartIcon },
    { title: "Historial de Ventas", url: "/dashboard/ventas/historial-v2", icon: FileTextIcon },
    { title: "Notas de Crédito", url: "/dashboard/ventas/notas-credito-v2", icon: FileCheck },
    { title: "Guías de Remisión", url: "/dashboard/documentos/guias-remision-v2", icon: Truck },

    // Clientes & Pedidos
    { label: "Clientes & Pedidos" },
    { title: "Clientes", url: "/dashboard/clientes", icon: UsersIcon },
    { title: "Pedidos", url: "/dashboard/pedidos", icon: ClipboardCheckIcon },
    { title: "Cuentas por Cobrar", url: "/dashboard/cobranzas", icon: DollarSignIcon },

    // Inventario & Productos
    { label: "Inventario & Productos" },
    { title: "Productos", url: "/dashboard/productos", icon: PackageIcon },
    { title: "Inventario", url: "/dashboard/inventario", icon: BoxesIcon },
    { title: "Categorías", url: "/dashboard/categorias", icon: TagsIcon },
    { title: "Marcas", url: "/dashboard/marcas", icon: TagsIcon },
    { title: "Unidades de Medida", url: "/dashboard/unidades-medida", icon: TagsIcon },

    // Compras
    { label: "Compras" },
    { title: "Órdenes de Compra", url: "/dashboard/compras", icon: ShoppingBagIcon },
    { title: "Proveedores", url: "/dashboard/proveedores", icon: TruckIcon },

    // Caja & Tesorería
    { label: "Caja & Tesorería" },
    { title: "Gestión de Cajas", url: "/dashboard/cajas", icon: Wallet },
    { title: "Movimientos de Caja", url: "/dashboard/caja/movimientos", icon: ReceiptIcon },

    // Reportes
    { label: "Reportes" },
    { title: "Kardex Fiscal", url: "/dashboard/kardex", icon: ClipboardListIcon },
    
    // Administración
    { label: "Administración" },
    { title: "Configuración", url: "/dashboard/configuracion", icon: SettingsIcon },
    { title: "Usuarios", url: "/dashboard/usuarios", icon: UserCogIcon },
    { title: "Cajas (Maestro)", url: "/dashboard/admin/cajas", icon: BoxIcon },
    { title: "Series SUNAT", url: "/dashboard/admin/series", icon: ShieldCheckIcon },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: CameraIcon,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: FileTextIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: FileCodeIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: DatabaseIcon,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardListIcon,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: FileIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const displayUser = {
    name: user?.email ? user.email.split("@")[0] : data.user.name,
    email: user?.email || data.user.email,
    avatar: data.user.avatar,
  };
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/dashboard" className="flex items-center gap-2">
                <img
                  src="/assets/logo/logoDefecto.svg"
                  alt="Logo"
                  className="h-6 w-6"
                />
                <span className="text-base font-semibold">FerrePro</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden group-data-[collapsible=icon]:[&_.scroll-area-scrollbar]:hidden">
        <ScrollArea className="h-full w-full">
          <div className="px-3 py-2 group-data-[collapsible=icon]:px-2">
            <NavMain items={data.navMain} />
          </div>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
