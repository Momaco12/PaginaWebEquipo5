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
  SidebarSeparator,
} from "@/components/ui/sidebar"

import { Home, LayoutGrid, Map, Settings, Bell } from "lucide-react"
import Link from "next/link"

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Home />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>

          <SidebarMenu>
            {/* Home */}
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Home" isActive>
                <Home />
                <span>Home</span>
              </SidebarMenuButton>
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

            {/*  ALERTAS */}
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

            {/* Settings */}
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Dummy Action">
                <Settings />
                <span>Dummy Action</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="text-xs text-muted-foreground px-2 py-1">
          Footer content
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}