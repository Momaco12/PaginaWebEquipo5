"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function SidebarToggle() {
  const { state } = useSidebar();

  const left = state === "collapsed" ? 47.2 : 255.2;

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left,
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <SidebarTrigger className="pointer-events-auto bg-white/80 shadow-lg ring-1 ring-black/10 dark:bg-slate-900/70 dark:ring-white/20" />
    </div>
  );
}
