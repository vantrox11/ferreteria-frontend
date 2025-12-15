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
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useAuth } from "@/auth/AuthContext"
import { useNavigate } from "react-router-dom"
import { useState, useMemo, useEffect } from "react"
import { navMainItems } from "@/components/app-sidebar"

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Agrupar items por sección para el Command
  const groupedNavItems = useMemo(() => {
    const groups: { label: string; items: typeof navMainItems }[] = []
    let currentGroup: { label: string; items: typeof navMainItems } | null = null

    navMainItems.forEach((item) => {
      if ('label' in item && item.label) {
        if (currentGroup) {
          groups.push(currentGroup)
        }
        currentGroup = { label: item.label, items: [] }
      } else if (currentGroup && 'title' in item) {
        currentGroup.items.push(item)
      }
    })

    if (currentGroup) {
      groups.push(currentGroup)
    }

    return groups
  }, [])

  // Manejar selección de item
  const handleSelect = (url: string) => {
    setOpen(false)
    navigate(url)
  }

  const onToggleTheme = () => {
    const root = document.documentElement
    if (root.classList.contains("dark")) root.classList.remove("dark")
    else root.classList.add("dark")
  }

  // Atajo de teclado Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <header
      className={[
        "group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
        "sticky top-0 z-50",
        "flex h-(--header-height) shrink-0 items-center gap-2",
        "bg-background/40 backdrop-blur-md border-b",
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
              placeholder="Buscar..."
              className="h-9 w-full pr-4 pl-10 cursor-pointer"
              readOnly
              onClick={() => setOpen(true)}
            />
            <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded-sm bg-zinc-200 p-1 font-mono text-xs font-medium sm:flex dark:bg-neutral-700">
              <CommandIcon className="size-3" />
              <span>K</span>
            </div>
          </div>
          <div className="block lg:hidden">
            <Button size="icon" variant="ghost" className="size-9" onClick={() => setOpen(true)}>
              <Search />
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
            <AvatarImage alt="user" src="https://github.com/shadcn.png" />
            <AvatarFallback>{user?.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar página o acción..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          {groupedNavItems.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => {
                if ('title' in item && 'url' in item) {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.url}
                      onSelect={() => item.url && handleSelect(item.url)}
                      className="flex items-center gap-2"
                    >
                      {Icon && <Icon className="size-4 text-muted-foreground" />}
                      <span>{item.title}</span>
                    </CommandItem>
                  )
                }
                return null
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </header>
  )
}
