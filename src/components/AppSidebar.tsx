import * as React from "react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarSeparator } from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ChartPie, ShoppingBag, ChevronsUpDown, ChevronRight } from "lucide-react"

export function AppSidebar() {
  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="offcanvas">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-10">
                <img alt="logo" src="/logo.png" className="me-1 rounded-[5px] size-8" />
                <span className="font-semibold">Shadcn UI Kit</span>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <ScrollArea className="h-full">
            <SidebarGroup>
              <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive>
                      <a href="#">
                        <ChartPie />
                        <span>Default</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <ShoppingBag />
                          <span>E-commerce</span>
                          <ChevronRight className="ml-auto" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <a href="#"><span>Dashboard</span></a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <a href="#"><span>Product List</span></a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <a href="#"><span>Product Detail</span></a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <a href="#"><span>Add Product</span></a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter>
          <Separator className="mx-2" />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset />
    </SidebarProvider>
  )
}

export default AppSidebar
