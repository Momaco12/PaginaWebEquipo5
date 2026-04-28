"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Leaf, SlidersHorizontal } from "lucide-react";
import { type AlertDto } from "@/components/ui/clusterexample";

interface AreaSummary {
  id: string | number;
  name_area?: string;
  tipo_cultivo?: string;
  activeCount: number;
  mostRecentActive?: AlertDto;
  mostRecentAttended?: AlertDto;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "Fecha inválida";
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlertasPage() {
  const [areas, setAreas] = useState<AreaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/areas", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then(async (raw: any[]) => {
        const alertsResults = await Promise.allSettled(
          raw.map((item) =>
            fetch(`http://localhost:8080/api/alerts/area/${encodeURIComponent(item.id)}`, { cache: "no-store" })
              .then((r) => (r.ok ? (r.json() as Promise<AlertDto[]>) : []))
              .catch(() => [] as AlertDto[])
          )
        );

        const byDateDesc = (a: AlertDto, b: AlertDto) =>
          new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime();

        const summaries: AreaSummary[] = raw.map((item, idx) => {
          const alerts: AlertDto[] =
            alertsResults[idx].status === "fulfilled" ? alertsResults[idx].value : [];
          const active = alerts.filter((a) => !a.atendido);
          const attended = alerts.filter((a) => a.atendido);
          return {
            id: item.id,
            name_area: item.name_area,
            tipo_cultivo: item.tipo_cultivo,
            activeCount: active.length,
            mostRecentActive: [...active].sort(byDateDesc)[0],
            mostRecentAttended: [...attended].sort(byDateDesc)[0],
          };
        });

        setAreas(summaries);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Cargando alertas…
      </div>
    );
  }

  const totalActive = areas.reduce((s, a) => s + a.activeCount, 0);
  const areasWithAlerts = areas.filter((a) => a.activeCount > 0).length;

  return (
    <div className="h-full overflow-auto bg-slate-50/50 p-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-bold text-slate-900">Alertas</h1>
          </div>
          <Link
            href="/limitesconfiguracion"
            className="flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            Configurar límites
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {totalActive > 0
            ? `${totalActive} alerta${totalActive === 1 ? "" : "s"} activa${totalActive === 1 ? "" : "s"} en ${areasWithAlerts} área${areasWithAlerts === 1 ? "" : "s"}`
            : "Sin alertas activas"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <Link key={area.id} href={`/alertas/${area.id}`} className="block">
            <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Leaf className="h-5 w-5" />
                </div>
                {area.activeCount > 0 ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                    <AlertTriangle className="h-3 w-3" />
                    {area.activeCount} pendiente{area.activeCount === 1 ? "" : "s"}
                  </div>
                ) : (
                  <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Sin alertas activas
                  </div>
                )}
              </div>

              <h2 className="mt-3 font-semibold text-slate-900 group-hover:text-slate-700">
                {area.name_area ?? "Área sin nombre"}
              </h2>
              <p className="text-sm text-slate-500">{area.tipo_cultivo ?? "Cultivo desconocido"}</p>

              <p className="mt-2 text-xs text-slate-400">
                {area.activeCount > 0 && area.mostRecentActive ? (
                  <>
                    Último:{" "}
                    <span className="font-medium text-slate-600">
                      {area.mostRecentActive.tipoAlerta}
                    </span>
                  </>
                ) : area.mostRecentAttended ? (
                  <>Atendida: {formatDate(area.mostRecentAttended.fechaHora)}</>
                ) : (
                  "Sin alertas registradas"
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
