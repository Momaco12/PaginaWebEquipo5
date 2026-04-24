"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Leaf } from "lucide-react";
import { type AlertDto } from "@/components/ui/clusterexample";
import { FIELD_CONFIG } from "@/components/ui/telemetry-chart";

interface AreaDetail {
  id: string | number;
  name_area?: string;
  tipo_cultivo?: string;
  [key: string]: unknown;
}

type Tab = "todas" | "pendientes" | "atendidas";

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

export default function AreaAlertasPage() {
  const { areaId } = useParams<{ areaId: string }>();

  const [area, setArea] = useState<AreaDetail | null>(null);
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("todas");
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!areaId) return;
    Promise.all([
      fetch(`http://localhost:8080/api/areas/${areaId}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`http://localhost:8080/api/alerts/area/${encodeURIComponent(areaId)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ]).then(([areaData, alertData]) => {
      setArea(areaData);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      setLoading(false);
    });
  }, [areaId]);

  const sortedAlerts = useMemo(() => {
    const pending = alerts
      .filter((a) => !a.atendido)
      .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
    const attended = alerts
      .filter((a) => a.atendido)
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
    return [...pending, ...attended];
  }, [alerts]);

  const displayedAlerts = useMemo(() => {
    if (tab === "pendientes") return sortedAlerts.filter((a) => !a.atendido);
    if (tab === "atendidas") return sortedAlerts.filter((a) => a.atendido);
    return sortedAlerts;
  }, [sortedAlerts, tab]);

  const handleMarkAtendido = async (alertId: string) => {
    const id = String(alertId);
    setMarkingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`http://localhost:8080/api/alerts/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atendido: true }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setAlerts((prev) =>
        prev.map((a) => (String(a.id) === id ? { ...a, atendido: true } : a))
      );
    } catch (err) {
      console.error("Error al marcar alerta como atendida:", err);
    } finally {
      setMarkingIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Cargando alertas…
      </div>
    );
  }

  if (!area) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
        <p>Área no encontrada.</p>
        <Link href="/alertas" className="text-sm font-semibold text-slate-900 underline">
          Volver a alertas
        </Link>
      </div>
    );
  }

  const pendingCount = alerts.filter((a) => !a.atendido).length;

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">

        <Link
          href="/alertas"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Todas las alertas
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
            <Leaf className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{area.name_area ?? "Área"}</h1>
            <p className="text-slate-500">{area.tipo_cultivo ?? "Cultivo desconocido"}</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {pendingCount} pendiente{pendingCount === 1 ? "" : "s"}
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["todas", "pendientes", "atendidas"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                "rounded-full px-4 py-1.5 text-sm font-semibold transition capitalize " +
                (tab === t
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200")
              }
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Alert count */}
        <p className="text-sm text-slate-500">
          {displayedAlerts.length} alerta{displayedAlerts.length === 1 ? "" : "s"}
        </p>

        {/* Alert list */}
        {displayedAlerts.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No hay alertas en esta categoría.
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAlerts.map((alert, index) => {
              const fieldCfg = alert.campo
                ? FIELD_CONFIG.find((f) => f.key === alert.campo)
                : undefined;

              return (
                <div
                  key={alert.id ?? index}
                  className={
                    "rounded-3xl border bg-white p-4 shadow-sm " +
                    (alert.atendido ? "border-slate-100 opacity-75" : "border-slate-200")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tipo de alerta</p>
                      <p className="mt-1 font-semibold text-slate-900">{alert.tipoAlerta}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(alert.fechaHora)}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                        alert.atendido
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {alert.atendido ? "Atendido" : "Pendiente"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Valor reportado</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {alert.valor_reportado}{fieldCfg?.unit ?? ""}
                      </p>
                    </div>
                    {fieldCfg && (
                      <span
                        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ backgroundColor: `${fieldCfg.color}18`, color: fieldCfg.color }}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: fieldCfg.color }}
                        />
                        {fieldCfg.label}
                      </span>
                    )}
                  </div>

                  {!alert.atendido && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={markingIds.has(String(alert.id))}
                        onClick={() => handleMarkAtendido(String(alert.id))}
                        className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {markingIds.has(alert.id) ? "Procesando…" : "Marcar como atendido"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
