/**
 * Demo Shell - Layout del modo demostración
 * Muestra la estructura del sistema con sidebar simplificado
 */
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import "@/global.css"
import DashboardDemo from "./DashboardDemo"

export default function DemoShell() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-3 py-3 md:gap-4 md:py-3">
              {/* Banner Modo Demo */}
              <div className="mx-4 rounded-lg bg-primary/10 border border-primary/20 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      <span className="font-semibold text-primary">Modo Demostración</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Estás viendo datos de ejemplo. Inicia sesión para acceder a tu información real.
                    </span>
                  </div>
                  <a 
                    href="/login" 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Iniciar Sesión
                  </a>
                </div>
              </div>
              
              {/* Dashboard Demo */}
              <DashboardDemo />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
