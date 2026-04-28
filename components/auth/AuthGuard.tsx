"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarToggle } from "@/components/ui/sidebar-toggle";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/Inicio_sesion")) return;
    if (!isAuthenticated()) {
      router.replace("/Inicio_sesion");
    }
  }, [pathname, router]);

  // Show sidebar layout only when not on login page
  if (pathname.startsWith("/Inicio_sesion")) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <AppSidebar />
        <div className="relative flex-1 overflow-hidden transition-all duration-200 ease-linear">
          <SidebarToggle />
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
