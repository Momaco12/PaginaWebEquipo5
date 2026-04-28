"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LayoutGrid, Map, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlertCount } from "@/components/ui/alert-count-provider";

export const TAB_BAR_HEIGHT = 80; // px — used by the bottom sheet to sit above this

const tabs = [
  { href: "/", icon: Map, label: "Mapa" },
  { href: "/areas", icon: LayoutGrid, label: "Áreas" },
  { href: "/alertas", icon: Bell, label: "Alertas" },
  { href: "/settings", icon: Settings, label: "Ajustes" },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();
  const { totalAlertCount } = useAlertCount();

  // Hide on pages that don't need app navigation (auth pages, etc.)
  const hiddenRoutes = ["/Inicio_sesion", "/login"];
  if (hiddenRoutes.some((r) => pathname.startsWith(r))) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ height: TAB_BAR_HEIGHT, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          const isAlerts = href === "/alertas";

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-colors",
                isActive ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {isAlerts && totalAlertCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
                    {totalAlertCount > 99 ? "99+" : totalAlertCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isActive ? "text-slate-900" : "text-slate-400"
                )}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-slate-900" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
