"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useMap } from "@/components/ui/map";
import { TAB_BAR_HEIGHT } from "@/components/ui/mobile-tab-bar";

export const ALERT_STRIP_HEIGHT = 56; // px — used by MobileBottomSheet to anchor above strip

type AlertArea = {
  id: string | number;
  name: string;
  alertCount: number;
  coordinates: [number, number];
};

export function MobileAlertStrip({ alertAreas }: { alertAreas: AlertArea[] }) {
  const { map } = useMap();

  if (alertAreas.length === 0) return null;

  const totalAlerts = alertAreas.reduce((sum, a) => sum + a.alertCount, 0);
  const isMultiple = alertAreas.length > 1;
  const primary = alertAreas[0];

  const focusAll = () => {
    if (alertAreas.length === 1) {
      map?.flyTo({ center: primary.coordinates, zoom: 14, duration: 1200 });
      return;
    }
    const lngs = alertAreas.map((a) => a.coordinates[0]);
    const lats = alertAreas.map((a) => a.coordinates[1]);
    map?.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80, duration: 1200, maxZoom: 15 }
    );
  };

  return (
    <div
      className="fixed inset-x-0 z-[49] md:hidden bg-white border-t border-slate-100"
      style={{
        bottom: TAB_BAR_HEIGHT,
        height: ALERT_STRIP_HEIGHT,
        boxShadow: "0 -4px 16px rgba(0,0,0,0.07)",
      }}
    >
      <div className="flex h-full items-center overflow-hidden">
        {/* Left accent */}
        <div className="flex shrink-0 items-center gap-1.5 bg-red-50 px-3 h-full border-r border-red-100">
          <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
          <span className="text-xs font-semibold text-red-700 whitespace-nowrap">
            {totalAlerts} alerta{totalAlerts !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Area label */}
        <p className="min-w-0 flex-1 truncate px-3 text-sm font-semibold text-slate-900">
          {isMultiple
            ? `${alertAreas.length} áreas con alertas`
            : primary.name}
        </p>

        {/* Action */}
        {isMultiple ? (
          <Link
            href="/areas"
            onClick={focusAll}
            className="flex shrink-0 items-center gap-1 border-l border-slate-100 px-4 h-full text-xs font-semibold text-slate-900 hover:bg-slate-50 transition"
          >
            Ver áreas
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={focusAll}
            className="flex shrink-0 items-center gap-1 border-l border-slate-100 px-4 h-full text-xs font-semibold text-slate-900 hover:bg-slate-50 transition"
          >
            Ir al área
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
