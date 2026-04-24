import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { Home, LayoutGrid, Map, Settings, Bell } from "lucide-react"
import Link from "next/link"

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Home size={20} />
          <span className="font-bold"></span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>

          <SidebarMenu>
            {/* Home */}
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton tooltip="Home">
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            {/* Map */}
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton tooltip="Map">
                  <Map />
                  <span>Map</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            {/* ALERTAS */}
            <SidebarMenuItem>
              <Link href="/alertas">
                <SidebarMenuButton tooltip="Alertas">
                  <Bell />
                  <span>Alertas</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            {/* ÁREAS */}
            <SidebarMenuItem>
              <Link href="/areas">
                <SidebarMenuButton tooltip="Áreas">
                  <LayoutGrid />
                  <span>Áreas</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>

            {/* Settings - Link global a la página de ajustes */}
            <SidebarMenuItem>
              <Link href="/settings">
                <SidebarMenuButton tooltip="Settings">
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Eliminamos la sección 'Other' y el Dummy Action para limpiar la interfaz */}
      </SidebarContent>

      <SidebarFooter>
        <div className="text-xs text-muted-foreground px-2 py-1">
          {new Date().getFullYear()} - Equipo 5
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}