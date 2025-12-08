// Componente de navegación principal del sidebar
import { MailIcon, PlusCircleIcon, type LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: (
    | {
        title: string
        url: string
        icon?: LucideIcon
      }
    | {
        label: string
      }
  )[]
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              tooltip="Acceso rápido"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0"
            >
              <PlusCircleIcon className="group-data-[collapsible=icon]:!m-0" />
              <span>Acceso rápido</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <MailIcon />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item, index) => {
            if ("label" in item) {
              return (
                <SidebarMenuItem key={`label-${item.label}`} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                  {isCollapsed ? (
                    <Separator className="my-2 w-8" />
                  ) : (
                    <SidebarGroupLabel className="px-2 text-xs font-semibold text-sidebar-foreground/70">
                      {item.label}
                    </SidebarGroupLabel>
                  )}
                </SidebarMenuItem>
              )
            }
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link to={item.url} className="group-data-[collapsible=icon]:justify-center">
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
