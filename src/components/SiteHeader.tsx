import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Search, Bell, Sun, Settings } from "lucide-react"
import * as React from "react"

export function SiteHeader() {
  const onToggleTheme = React.useCallback(() => {
    const root = document.documentElement
    if (root.classList.contains("dark")) root.classList.remove("dark")
    else root.classList.add("dark")
  }, [])

  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <SidebarTrigger className="size-9 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50" />
        <Separator orientation="vertical" className="mx-2 h-4" />

        <div className="lg:flex-1">
          <div className="relative hidden max-w-sm flex-1 lg:block">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input type="search" placeholder="Search..." className="h-9 w-full pr-4 pl-10 cursor-pointer" />
            <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded-sm bg-zinc-200 p-1 font-mono text-xs font-medium sm:flex dark:bg-neutral-700">
              <span>k</span>
            </div>
          </div>
          <div className="block lg:hidden">
            <Button size="icon" variant="ghost" className="size-9">
              <Search />
            </Button>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="icon" variant="ghost" className="size-9 relative">
            <Bell className="animate-tada" />
            <span className="bg-destructive absolute end-0 top-0 block size-2 shrink-0 rounded-full" />
          </Button>

          <Button size="icon" variant="ghost" className="size-9 relative" onClick={onToggleTheme}>
            <Sun />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="size-9">
                <Settings className="animate-tada" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Preferencias</DropdownMenuItem>
              <DropdownMenuItem>Salir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Avatar>
            <AvatarImage alt="user" src="/images/avatars/01.png" />
            <AvatarFallback>US</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
