"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Download, Leaf, MapPin, Square } from "lucide-react";
import { type AlertDto } from "@/components/ui/clusterexample";
import { TelemetryChart, prepareChartData, exportChartDataToCsv, type TelemetryPoint } from "@/components/ui/telemetry-chart";

interface AreaDetail {
  id: string | number;
  name_area?: string;
  tipo_cultivo?: string;
  tipo_tierra?: string;
  superficie_ha?: number;
  capacidad_campo?: number;
  punto_marchitez?: number;
  latitud?: number;
  longitud?: number;
  [key: string]: unknown;
}

type Period = "day" | "week" | "month";

const PERIOD_MS: Record<Period, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

function getAlertDisplayStatus(alert: AlertDto): string {
  if (alert.atendido) return "Atendido";
  return "Pendiente";
}

function formatAlertDate(alert: AlertDto): string {
  if (!alert.fechaHora) return "Fecha desconocida";
  const date = new Date(alert.fechaHora);
  return isNaN(date.getTime())
    ? "Fecha inválida"
    : date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default function AreaDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [area, setArea] = useState<AreaDetail | null>(null);
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [history, setHistory] = useState<TelemetryPoint[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [period, setPeriod] = useState<Period>("day");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/areas/${id}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts/area/${encodeURIComponent(id)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ]).then(([areaData, alertData]) => {
      setArea(areaData);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setHistoryLoading(true);
    const abort = new AbortController();
    const now = new Date();
    const start = new Date(now.getTime() - PERIOD_MS[period]);

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/area/${id}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(now.toISOString())}`,
      { signal: abort.signal, cache: "no-store" }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!abort.signal.aborted) setHistory(Array.isArray(data) ? data : null); })
      .catch(() => { if (!abort.signal.aborted) setHistory(null); })
      .finally(() => { if (!abort.signal.aborted) setHistoryLoading(false); });

    return () => abort.abort();
  }, [id, period]);

  const chartData = useMemo(
    () => (history ? prepareChartData(history as any, period) : []),
    [history, period]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Cargando área…
      </div>
    );
  }

  if (!area) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
        <p>Área no encontrada.</p>
        <Link href="/areas" className="text-sm font-semibold text-slate-900 underline">
          Volver a áreas
        </Link>
      </div>
    );
  }

  const pendingAlerts = alerts.filter((a) => !a.atendido);

  return (
    <div className="h-full overflow-auto bg-slate-50/50 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">

        <Link
          href="/areas"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Todas las áreas
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
            <Leaf className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-slate-900">{area.name_area ?? "Área"}</h1>
            <p className="text-slate-500">{area.tipo_cultivo ?? "Cultivo desconocido"}</p>
          </div>
          {pendingAlerts.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {pendingAlerts.length} alerta{pendingAlerts.length > 1 ? "s" : ""} pendiente{pendingAlerts.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Superficie", value: area.superficie_ha != null ? `${area.superficie_ha} ha` : "N/A" },
            { label: "Tipo de tierra", value: area.tipo_tierra ?? "N/A" },
            { label: "Cap. campo", value: area.capacidad_campo != null ? `${area.capacidad_campo}%` : "N/A" },
            { label: "P. marchitez", value: area.punto_marchitez != null ? `${area.punto_marchitez}%` : "N/A" },
          ].map((m) => (
            <div key={m.label} className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{m.label}</p>
              <p className="mt-1 font-semibold text-slate-900">{m.value}</p>
            </div>
          ))}
        </div>

        {area.latitud != null && (
          <div className="flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            {(area.latitud as number).toFixed(5)}, {(area.longitud as number)?.toFixed(5)}
          </div>
        )}

        {/* Telemetry */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Telemetría</h2>
            <div className="flex gap-2">
              {(["day", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={
                    "rounded-full px-3 py-1 text-xs font-semibold transition " +
                    (period === p
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                  }
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={historyLoading || chartData.length === 0}
                onClick={() =>
                  exportChartDataToCsv(
                    chartData,
                    `telemetria-${area.name_area ?? "area"}-${period}.csv`
                  )
                }
                className="rounded-full px-3 py-1 text-xs font-semibold transition bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Descargar datos a CSV
              </button>
            </div>
          </div>
          <TelemetryChart chartData={chartData} historyLoading={historyLoading} chartHeight={240} />
        </div>

        {/* Alerts */}
        <div>
          <h2 className="mb-3 font-semibold text-slate-900">
            Alertas{alerts.length > 0 ? ` (${alerts.length})` : ""}
          </h2>
          {alerts.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No hay alertas registradas para esta área.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={alert.id ?? index} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tipo de alerta</p>
                      <p className="mt-1 font-semibold text-slate-900">{alert.tipoAlerta}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatAlertDate(alert)}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                        alert.atendido
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {getAlertDisplayStatus(alert)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Valor reportado</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{alert.valor_reportado}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
