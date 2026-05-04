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

import { Home, LayoutGrid, Map, Settings, Bell, SlidersHorizontal, LogOut, User } from "lucide-react"
import Link from "next/link"
import { AdminOnly } from "@/components/auth/UserContext"
import { useUser } from "@/components/auth/UserContext"
import { useRouter } from "next/navigation"

export function AppSidebar() {
  const { user, logout } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/Inicio_sesion');
  };

  return (
    <div className="hidden md:block">
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

            {/* CONFIGURACIÓN DE LÍMITES - Only for Admin */}
            <AdminOnly>
              <SidebarMenuItem>
                <Link href="/limitesconfiguracion">
                  <SidebarMenuButton tooltip="Configuración de límites">
                    <SlidersHorizontal />
                    <span>Configuración de límites</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </AdminOnly>

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
        <div className="border-t border-sidebar-border p-2">
          {user && (
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.nombreCompleto}
                </p>
                <p className="text-xs text-sidebar-foreground/70">
                  {user.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Lector'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
          <div className="mt-3 px-2 text-xs text-sidebar-foreground/50 text-center">
            {new Date().getFullYear()} - Equipo 5
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
    </div>
  )
}
