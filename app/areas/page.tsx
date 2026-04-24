"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Leaf, MapPin, Square } from "lucide-react";
import { type AlertDto } from "@/components/ui/clusterexample";

interface AreaSummary {
  id: string | number;
  name_area?: string;
  tipo_cultivo?: string;
  superficie_ha?: number;
  latitud?: number;
  longitud?: number;
  alerts?: AlertDto[];
  alertCount?: number;
}

export default function AreasPage() {
  const [areas, setAreas] = useState<AreaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/areas", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setAreas(Array.isArray(data) ? data : []))
      .catch(() => setAreas([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Cargando áreas…
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Áreas de cultivo</h1>
        <p className="mt-1 text-sm text-slate-500">{areas.length} áreas registradas</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => {
          const pending = Array.isArray(area.alerts)
            ? area.alerts.filter((a) => !a.atendido).length
            : (area.alertCount ?? 0);

          return (
            <Link key={area.id} href={`/areas/${area.id}`} className="block">
              <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Leaf className="h-5 w-5" />
                  </div>
                  {pending > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      {pending}
                    </div>
                  )}
                </div>

                <h2 className="mt-3 font-semibold text-slate-900 group-hover:text-slate-700">
                  {area.name_area ?? "Área sin nombre"}
                </h2>
                <p className="text-sm text-slate-500">{area.tipo_cultivo ?? "Cultivo desconocido"}</p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {area.superficie_ha != null && (
                    <span className="flex items-center gap-1">
                      <Square className="h-3 w-3" />
                      {area.superficie_ha} ha
                    </span>
                  )}
                  {area.latitud != null && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {area.latitud.toFixed(3)}, {area.longitud?.toFixed(3)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
