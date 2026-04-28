"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Download, Leaf, MapPin, Navigation2, Square } from "lucide-react";

import { Map, MapClusterLayer, MapPopup, MapControls, useMap } from "@/components/ui/map";
import { useSidebar } from "@/components/ui/sidebar";
import { TelemetryChart, prepareChartData, exportChartDataToCsv, FIELD_CONFIG, FieldKey } from "@/components/ui/telemetry-chart";
import { CalendarDatePicker } from "@/components/ui/calendar-date-picker";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { MobileAlertStrip, ALERT_STRIP_HEIGHT } from "@/components/ui/mobile-alert-strip";
import { TAB_BAR_HEIGHT } from "@/components/ui/mobile-tab-bar";
import { useAlertCount } from "@/components/ui/alert-count-provider";

interface TelemetryData {
  fechaHora: string;
  humedadSuelo?: number;
  temperatura?: number;
  radiacionSolar?: number;
  evapotranspiracion?: number;
  consumoAgua?: number;
  conductividadSuelo?: number;
  desarrolloVegetativo?: string;
}

export interface AlertDto {
  id: string;
  area: string
  tipoAlerta: "EXCESO" | "INSUFICIENCIA" | "PERDIDA_CONEXION"; // Tipado estricto
  campo?: FieldKey;
  valor_reportado: number;
  fechaHora: string; // ISO String que viene del Instant
  atendido: boolean;
}

function getAlertDisplayHeader(alert: AlertDto): string {
  return (
    alert.tipoAlerta
    
    
  );
}

function getAlertDisplayValue(alert: AlertDto) {
  const value =
    alert.valor_reportado
  
  if (value == null) return null;
  return value.toString();
}

function getAlertDisplayStatus(alert: AlertDto): string {
  if (alert.atendido === true) return "Atendido";
  if (alert.atendido === false) return "Pendiente";
  return "Sin estado";
}

function formatAlertDate(alert: AlertDto): string {
  if (!alert.fechaHora) return "Fecha desconocida";
  const date = new Date(alert.fechaHora);
  return isNaN(date.getTime()) ? "Fecha inválida" : date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAlertFieldConfig(alert: AlertDto) {
  if (!alert.campo) return null;
  return FIELD_CONFIG.find((f) => f.key === alert.campo) ?? null;
}

interface AreaProperties {
  name_area?: string;
  cultivo?: string;
  fecha_hora?: string;
  humedad_suelo?: number;
  temperatura?: number;
  radiacion_solar?: number;
  evapotranspiracion?: number;
  consumo_agua?: number;
  conductividad_suelo?: number;
  desarrollo_vegetativo?: string;
  tipo_cultivo?: string;
  tipo_tierra?: string;
  superficie_ha?: number;
  capacidad_campo?: number;
  punto_marchitez?: number;
  latitud?: number;
  longitud?: number;
  last_updated?: number;
  alerts: AlertDto[];
  alertCount?: number;
  [key: string]: unknown;
}

type AlertArea = {
  id: string | number;
  name: string;
  alertCount: number;
  coordinates: [number, number];
};

function MapAlertStrip({ alertAreas, leftOffset }: { alertAreas: AlertArea[]; leftOffset: number }) {
  const { map } = useMap();

  if (alertAreas.length === 0) return null;

  const flyTo = (coords: [number, number]) => {
    map?.flyTo({ center: coords, zoom: 14, duration: 1200 });
  };

  const focusAll = () => {
    if (alertAreas.length === 1) {
      flyTo(alertAreas[0].coordinates);
      return;
    }
    const lngs = alertAreas.map((a) => a.coordinates[0]);
    const lats = alertAreas.map((a) => a.coordinates[1]);
    map?.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80, duration: 1200, maxZoom: 15 }
    );
  };

  const primary = alertAreas[0];
  const totalAlerts = alertAreas.reduce((sum, a) => sum + a.alertCount, 0);

  return (
    <div className="fixed bottom-4 z-20 pointer-events-none" style={{ left: leftOffset + 16, right: 56 }}>
      <div className="pointer-events-auto flex items-stretch bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Alert count */}
        <div className="flex items-center gap-2 bg-red-50 px-4 py-3 shrink-0 border-r border-red-100">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-xs font-semibold text-red-700 whitespace-nowrap">
            {totalAlerts} alerta{totalAlerts !== 1 ? "s" : ""} activa{totalAlerts !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Primary area info */}
        <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{primary.name}</p>
            <p className="text-xs text-slate-500">
              {primary.alertCount} pendiente{primary.alertCount !== 1 ? "s" : ""}
              {alertAreas.length > 1 && ` · ${alertAreas.length - 1} área${alertAreas.length - 1 > 1 ? "s" : ""} más con alertas`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0 border-l border-slate-100">
          <button
            type="button"
            onClick={focusAll}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            Ver todas
          </button>
          <button
            type="button"
            onClick={() => flyTo(primary.coordinates)}
            className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            <Navigation2 className="h-3 w-3" />
            Ir al área
          </button>
        </div>
      </div>
    </div>
  );
}

function MapFitBounds({ coordinates }: { coordinates: [number, number][] }) {
  const { map, isLoaded } = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!isLoaded || !map || coordinates.length === 0 || fitted.current) return;
    fitted.current = true;

    if (coordinates.length === 1) {
      map.flyTo({ center: coordinates[0], zoom: 14, duration: 1000 });
      return;
    }

    const lngs = coordinates.map((c) => c[0]);
    const lats = coordinates.map((c) => c[1]);
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80, maxZoom: 15, duration: 1000 }
    );
  }, [isLoaded, map, coordinates]);

  return null;
}

function ResumeSidebar({
  id,
  properties,
  alerts,
  chartData,
  historyLoading,
  period,
  onChangePeriod,
  customDateRange,
  onChangeCustomDateRange,
  onMarkAtendido,
}: {
  id?: string | number;
  properties: AreaProperties;
  alerts: AlertDto[];
  chartData: any[];
  historyLoading: boolean;
  period: "day" | "week" | "month" | "custom";
  onChangePeriod: (period: "day" | "week" | "month" | "custom") => void;
  customDateRange?: { from: Date; to: Date };
  onChangeCustomDateRange?: (range: { from: Date; to: Date }) => void;
  onMarkAtendido: (alertId: string) => Promise<void>;
}) {
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());
  const alertCount = alerts.filter((a) => !a.atendido).length;
  const sizeValue = properties.superficie_ha;

  return (
    <div className="space-y-5 rounded-xl bg-white p-5 shadow-sm text-slate-900">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Leaf className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">Área seleccionada</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {properties.name_area ?? "Área"}
          </h1>
          <p className="text-sm text-slate-500">
            {properties.tipo_cultivo ?? "Cultivo desconocido"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Periodo</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {period === "custom" ? "Personalizado" : period === "day" ? "Día" : period === "week" ? "Semana" : "Mes"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["day", "week", "month"] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={
                  "rounded-full px-3 py-1 text-xs font-semibold transition " +
                  (period === p
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 shadow-sm hover:bg-slate-100")
                }
                onClick={() => onChangePeriod(p)}
              >
                {p === "day" ? "Día" : p === "week" ? "Semana" : "Mes"}
              </button>
            ))}
            {onChangeCustomDateRange && (
              <CalendarDatePicker
                date={customDateRange ?? { from: new Date(), to: new Date() }}
                onDateSelect={(range) => {
                  onChangeCustomDateRange(range);
                  onChangePeriod("custom");
                }}
                variant="outline"
                className={
                  "rounded-full px-3 py-1 text-xs font-semibold transition h-auto border-none " +
                  (period === "custom"
                    ? "bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
                    : "bg-white text-slate-600 shadow-sm hover:bg-slate-100")
                }
              />
            )}
            <button
              type="button"
              disabled={historyLoading || chartData.length === 0}
              onClick={() =>
                exportChartDataToCsv(
                  chartData,
                  `telemetria-${properties.name_area ?? "area"}-${period}.csv`
                )
              }
              className="rounded-full px-3 py-1 text-xs font-semibold transition bg-white text-slate-600 shadow-sm hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Descargar datos a CSV
            </button>
          </div>
        </div>
      </div>

      <TelemetryChart chartData={chartData} historyLoading={historyLoading} />

      <div className="grid gap-3">
        <div className="flex items-center gap-3 rounded-3xl bg-slate-50 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Cultivo</p>
            <p className="font-semibold text-slate-900">{properties.tipo_cultivo ?? "N/A"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-3xl bg-slate-50 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Ubicación</p>
            <p className="font-semibold text-slate-900">{properties.name_area ?? "N/A"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-3xl bg-slate-50 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Square className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Tamaño</p>
            <p className="font-semibold text-slate-900">
              {sizeValue != null ? `${sizeValue} hectáreas` : "N/A"}
            </p>
          </div>
        </div>
        <div className="rounded-3xl bg-red-50 p-4 text-sm text-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Alertas activas</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{alertCount > 0 ? `${alertCount} alerta${alertCount === 1 ? "" : "s"}` : "Sin alertas"}</p>
            </div>
            <div
              className={
                "rounded-full px-3 py-1 text-xs font-semibold " +
                (alertCount > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-500")
              }
            >
              {alertCount > 0 ? "Activa" : "Estable"}
            </div>
          </div>

          {alertCount > 0 ? (
            
            <div className="mt-4 space-y-3">
              
              {alerts.slice(0, 3).map((alert, index) => (
                <div key={alert.id ?? index} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Parámetro en problema</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{getAlertDisplayHeader(alert)}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatAlertDate(alert)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                      alert.atendido === true
                        ? "bg-emerald-100 text-emerald-700"
                        : alert.atendido === false
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {getAlertDisplayStatus(alert)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Valor reportado</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {getAlertDisplayValue(alert) != null
                          ? `${getAlertDisplayValue(alert)}${getAlertFieldConfig(alert)?.unit ?? ""}`
                          : "N/A"}
                      </p>
                    </div>
                    {(() => {
                      const fieldCfg = getAlertFieldConfig(alert);
                      if (!fieldCfg) return null;
                      return (
                        <span
                          className="flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-auto"
                          style={{ backgroundColor: `${fieldCfg.color}18`, color: fieldCfg.color }}
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: fieldCfg.color }}
                          />
                          {fieldCfg.label}
                        </span>
                      );
                    })()}
                  </div>

                  {!alert.atendido && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={markingIds.has(String(alert.id))}
                        onClick={async () => {
                          const sid = String(alert.id);
                          setMarkingIds((prev) => new Set(prev).add(sid));
                          try { await onMarkAtendido(sid); }
                          finally {
                            setMarkingIds((prev) => { const n = new Set(prev); n.delete(sid); return n; });
                          }
                        }}
                        className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {markingIds.has(String(alert.id)) ? "Procesando…" : "Marcar como atendido"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {alertCount > 3 && (
                <p className="text-xs text-slate-500">Y {alertCount - 3} alerta{alertCount - 3 === 1 ? " adicional" : "s adicionales"}.</p>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">La zona no tiene alertas activas actualmente.</p>
          )}
        </div>
      </div>

      <Link
        href={id != null ? `/areas/${id}` : "/areas"}
        className="flex w-full items-center justify-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Ver más detalles
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function ClusterExample() {
  const { state: sidebarState } = useSidebar();
  const { setTotalAlertCount } = useAlertCount();

  const [data, setData] = useState<GeoJSON.FeatureCollection<GeoJSON.Point, AreaProperties> | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{
    id?: string | number;
    coordinates: [number, number];
    properties: AreaProperties;
    history?: unknown[];
  } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    coordinates: [number, number];
    properties: AreaProperties;
  } | null>(null);
  const [selectedPointAlerts, setSelectedPointAlerts] = useState<AlertDto[]>([]);
  const [period, setPeriod] = useState<"day" | "week" | "month" | "custom">("day");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [history, setHistory] = useState<TelemetryData[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const lastSelectedPointRef = useRef<typeof selectedPoint>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [mobileSnap, setMobileSnap] = useState<"closed" | "peek" | "expanded">("closed");

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Open mobile sheet when a point is selected
  useEffect(() => {
    if (selectedPoint && isMobile) {
      setIsMobileSheetOpen(true);
    }
  }, [selectedPoint, isMobile]);

  useEffect(() => {
    if (period === "custom") return;

    const now = new Date();
    let start: Date;

    switch (period) {
      case "week":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "day":
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
    }

    setCustomDateRange({ from: start, to: now });
  }, [period]);

  // Determine which point to display in popup and if it's selected
  const displayedPoint = selectedPoint ?? hoveredPoint;
  const isPointSelected = selectedPoint !== null;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/areas`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const raw = await response.json();

        const alertsResults = await Promise.allSettled(
          raw.map((item: any) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts/area/${encodeURIComponent(item.id)}`, { cache: "no-store" })
              .then((r) => (r.ok ? (r.json() as Promise<AlertDto[]>) : []))
              .catch(() => [] as AlertDto[])
          )
        );

        const alertsByArea: Record<string, AlertDto[]> = {};
        raw.forEach((item: any, idx: number) => {
          const result = alertsResults[idx];
          alertsByArea[item.id as string] = result.status === "fulfilled" ? (result.value as AlertDto[]) : [];
        });

        const features = raw.map((item: any) => {
          const alerts: AlertDto[] = alertsByArea[item.id] ?? [];
          return {
            type: "Feature" as const,
            id: item.id,
            geometry: {
              type: "Point" as const,
              coordinates: [item.longitud, item.latitud] as [number, number],
            },
            properties: {
              ...item,
              alerts,
              alertCount: alerts.filter((a) => !a.atendido).length,
            },
          };
        });

        if (!isMounted) return;

        setData({
          type: "FeatureCollection",
          features,
        });
      } catch {
        if (!isMounted) return;
        setData({ type: "FeatureCollection", features: [] });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const mapCenter = useMemo<[number, number]>(() => {
    if (!data || data.features.length === 0) {
      return [-103.59, 40.66];
    }

    const coordinates = data.features
      .map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        return typeof lng === "number" && typeof lat === "number"
          ? [lng, lat] as [number, number]
          : null;
      })
      .filter((coordinate): coordinate is [number, number] => coordinate !== null);

    if (coordinates.length === 0) {
      return [-103.59, 40.66];
    }

    const totals = coordinates.reduce(
      (acc, point) => ({ lng: acc.lng + point[0], lat: acc.lat + point[1] }),
      { lng: 0, lat: 0 }
    );
    return [totals.lng / coordinates.length, totals.lat / coordinates.length];
  }, [data]);

  const alertAreas = useMemo<AlertArea[]>(() => {
    if (!data) return [];
    return data.features
      .filter((f) => (f.properties.alertCount ?? 0) > 0)
      .map((f) => ({
        id: f.id as string | number,
        name: f.properties.name_area ?? "Área",
        alertCount: f.properties.alertCount ?? 0,
        coordinates: f.geometry.coordinates as [number, number],
      }));
  }, [data]);

  useEffect(() => {
    const total = alertAreas.reduce((sum, a) => sum + a.alertCount, 0);
    setTotalAlertCount(total);
  }, [alertAreas, setTotalAlertCount]);

  const sidebarPanelLeft = sidebarState === "collapsed" ? 47.2 : 255.2;
  const chartData = useMemo(
    () => (history ? prepareChartData(history, period) : []),
    [history, period]
  );

  const allCoordinates = useMemo<[number, number][]>(
    () => data?.features.map((f) => f.geometry.coordinates as [number, number]) ?? [],
    [data]
  );

  const lastUpdate = useMemo(() => {
    if (!history || history.length === 0) return null;
    const lastHistoryItem = history[history.length - 1];
    return lastHistoryItem?.fechaHora ? new Date(lastHistoryItem.fechaHora) : null;
  }, [history]);

  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    if (selectedPoint) {
      lastSelectedPointRef.current = selectedPoint;
      setIsPanelVisible(true);
      // Wait for mounting before starting the open animation
      requestAnimationFrame(() => setIsPanelOpen(true));
    } else {
      setIsPanelOpen(false);
      const timeout = window.setTimeout(() => {
        setIsPanelVisible(false);
        lastSelectedPointRef.current = null;
        setHistory(null);
        setSelectedPointAlerts([]);
      }, 200);
      return () => window.clearTimeout(timeout);
    }
  }, [selectedPoint]);

  useEffect(() => {
    const id = selectedPoint?.id ?? lastSelectedPointRef.current?.id;
    if (!id) {
      setHistory(null);
      return;
    }

    if (period === "custom" && !customDateRange) {
      return;
    }

    setHistoryLoading(true);
    const abortController = new AbortController();

    const now = new Date();
    let start: Date;
    let end: Date = now;
    
    switch (period) {
      case "week":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        if (customDateRange) {
          start = customDateRange.from;
          end = customDateRange.to;
        } else {
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        break;
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
    }

    const startStr = start.toISOString();
    const endStr = end.toISOString();

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/area/${id}?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`, {
      signal: abortController.signal,
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("History fetch failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data as TelemetryData[]);
        } else {
          setHistory(null);
        }
      })
      .catch(() => {
        if (!abortController.signal.aborted) {
          setHistory(null);
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setHistoryLoading(false);
        }
      });

    return () => abortController.abort();
  }, [period, selectedPoint, customDateRange]);

  useEffect(() => {
    const id = selectedPoint?.id ?? lastSelectedPointRef.current?.id;
    if (!id) {
      setSelectedPointAlerts([]);
      return;
    }

    const abortController = new AbortController();

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts/area/${encodeURIComponent(id)}`, {
      signal: abortController.signal,
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Alerts fetch failed");
        console.log("Raw alert response:", res);
        return res.json();
      })
      .then((alertData) => {
        setSelectedPointAlerts(Array.isArray(alertData) ? (alertData as AlertDto[]) : []);
      })
      .catch(() => {
        if (!abortController.signal.aborted) setSelectedPointAlerts([]);
      });

    return () => abortController.abort();
  }, [selectedPoint]);

  

  const handleMarkAtendido = async (alertId: string): Promise<void> => {
    const id = String(alertId);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ atendido: true }),
    });
    if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
    setSelectedPointAlerts((prev) =>
      prev.map((a) => (String(a.id) === id ? { ...a, atendido: true } : a))
    );
  };

  if (isLoading) {
    return <div className="h-[400px] w-full flex items-center justify-center">Loading map data...</div>;
  }

  return (
    <div className="h-full w-full">
      {/* Map wrapped in its own div so pointer-events:none only blocks the map, not the sheet */}
      <div
        className="h-full w-full"
        style={isMobile && mobileSnap === "expanded" ? { pointerEvents: "none" } : undefined}
      >
      <Map center={mapCenter} zoom={8} fadeDuration={0} theme="light">
        <MapClusterLayer<AreaProperties>
          data={data ?? { type: "FeatureCollection", features: [] }}
          clusterRadius={50}
          clusterMaxZoom={0}
          clusterColors={["#1d8cf8", "#6d5dfc", "#e23670"]}
          pointColor="#1d8cf8"
          onPointClick={async (feature, coordinates) => {
            // Show something immediately while the detailed API request completes
            setSelectedPoint({
              coordinates,
              properties: feature.properties,
            });

            try {
              const id = feature.properties.id;
              if (id == null) return;

              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/areas/${id}`, { cache: "no-store" });
              if (!response.ok) return;
              const apiFeature = (await response.json()) as GeoJSON.Feature<GeoJSON.Geometry, AreaProperties>;
              const apiCoords =
                apiFeature.geometry?.type === "Point" &&
                Array.isArray(apiFeature.geometry.coordinates) &&
                typeof apiFeature.geometry.coordinates[0] === "number" &&
                typeof apiFeature.geometry.coordinates[1] === "number"
                  ? (apiFeature.geometry.coordinates as [number, number])
                  : coordinates;
              setSelectedPoint({
                id: apiFeature.id ?? feature.id,
                coordinates: apiCoords,
                properties: {
                  ...feature.properties,
                  ...(apiFeature.properties ?? {}),
                },
                history: (apiFeature.properties as any)?.history ?? undefined,
              });
            } catch {
              // Keep current selection if the request fails
            }
          }}
        />

        {displayedPoint && (
          <MapPopup
            key={`${displayedPoint.coordinates[0]}-${displayedPoint.coordinates[1]}`}
            longitude={displayedPoint.coordinates[0]}
            latitude={displayedPoint.coordinates[1]}
            onClose={() => isPointSelected && setSelectedPoint(null)}
            closeOnClick={false}
            focusAfterOpen={false}
            closeButton={isPointSelected}
            
          >
            <div className="space-y-1 p-1" onMouseEnter={() => setHoveredPoint(hoveredPoint)} onMouseLeave={() => !isPointSelected && setHoveredPoint(null)}>
              <p className="text-sm font-medium">
                {displayedPoint.properties.name_area ?? "Area"}
              </p>
              <p className="text-sm">Cultivo: {displayedPoint.properties.tipo_cultivo ?? "N/A"}</p>
              <p className="text-sm">
                Superficie (ha): {displayedPoint.properties.superficie_ha ?? "N/A"}
              </p>
              <p className="text-sm">
                Última actualización:{" "}
                {lastUpdate ? lastUpdate.toLocaleString() : "N/A"}
              </p>
            </div>
          </MapPopup>
        )}

        <MapFitBounds coordinates={allCoordinates} />
        <MapControls />
        {/* Alert strip: desktop only */}
        {!isMobile && (
          <MapAlertStrip alertAreas={alertAreas} leftOffset={sidebarPanelLeft + (isPanelOpen ? 320 : 0)} />
        )}
        {/* Alert strip: mobile only — pinned above the tab bar */}
        {isMobile && alertAreas.length > 0 && (
          <MobileAlertStrip alertAreas={alertAreas} />
        )}
      </Map>
      </div>

      {/* Desktop right-side panel — hidden on mobile */}
      {!isMobile && isPanelVisible && (
        <aside
          className={
            "fixed top-0 bottom-0 z-5 w-80 overflow-auto border-l border-muted/30 bg-white/90 p-4 text-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/80 transition-transform duration-200"
            + (isPanelOpen ? " translate-x-0" : " -translate-x-full")
          }
          style={{ left: sidebarPanelLeft }}
        >
          {(() => {
            const panelPoint = selectedPoint ?? lastSelectedPointRef.current;
            if (!panelPoint) return null;

            return (
              <ResumeSidebar
                id={panelPoint.id}
                properties={panelPoint.properties}
                alerts={selectedPointAlerts}
                chartData={chartData}
                historyLoading={historyLoading}
                period={period}
                onChangePeriod={setPeriod}
                customDateRange={customDateRange}
                onChangeCustomDateRange={setCustomDateRange}
                onMarkAtendido={handleMarkAtendido}
              />
            );
          })()}
        </aside>
      )}

      {/* Mobile: Google Maps-style bottom sheet */}
      {isMobile && (() => {
        const panelPoint = selectedPoint ?? lastSelectedPointRef.current;
        if (!panelPoint) return null;
        return (
          <MobileBottomSheet
            isOpen={isMobileSheetOpen}
            onClose={() => {
              setIsMobileSheetOpen(false);
              setSelectedPoint(null);
            }}
            onSnapChange={setMobileSnap}
            bottomOffset={TAB_BAR_HEIGHT + (alertAreas.length > 0 ? ALERT_STRIP_HEIGHT : 0)}
            peekContent={
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Leaf className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {panelPoint.properties.name_area ?? "Área"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {panelPoint.properties.tipo_cultivo ?? "Cultivo desconocido"}
                  </p>
                </div>
              </div>
            }
          >
            <ResumeSidebar
              id={panelPoint.id}
              properties={panelPoint.properties}
              alerts={selectedPointAlerts}
              chartData={chartData}
              historyLoading={historyLoading}
              period={period}
              onChangePeriod={setPeriod}
              customDateRange={customDateRange}
              onChangeCustomDateRange={setCustomDateRange}
              onMarkAtendido={handleMarkAtendido}
            />
          </MobileBottomSheet>
        );
      })()}
    </div>
  );
}