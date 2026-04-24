"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Bell, Leaf, MapPin, Navigation2, Square } from "lucide-react";

import { Map, MapClusterLayer, MapPopup, MapControls, useMap } from "@/components/ui/map";
import { useSidebar } from "@/components/ui/sidebar";
import { TelemetryChart, prepareChartData } from "@/components/ui/telemetry-chart";

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

function MapAlertStrip({ alertAreas }: { alertAreas: AlertArea[] }) {
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

  return (
    <div className="absolute bottom-10 left-0 right-0 z-10 px-4 pointer-events-none">
      <div className="pointer-events-auto max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
            <Bell className="h-3 w-3" />
            {alertAreas.length} área{alertAreas.length > 1 ? "s" : ""} con alertas
          </div>
          <button
            type="button"
            onClick={focusAll}
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-lg hover:bg-slate-50 transition"
          >
            <Navigation2 className="h-3 w-3" />
            Ver todas
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {alertAreas.map((area) => (
            <div
              key={area.id}
              className="flex-shrink-0 flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur px-3 py-2 shadow-lg"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="text-[11px] font-bold text-red-600">{area.alertCount}</span>
              </div>
              <span className="max-w-[100px] truncate text-sm font-medium text-slate-900">{area.name}</span>
              <button
                type="button"
                onClick={() => flyTo(area.coordinates)}
                className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-slate-700 transition"
              >
                Ir
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResumeSidebar({
  id,
  properties,
  alerts,
  chartData,
  historyLoading,
  period,
  onChangePeriod,
}: {
  id?: string | number;
  properties: AreaProperties;
  alerts: AlertDto[];
  chartData: any[];
  historyLoading: boolean;
  period: "day" | "week" | "month";
  onChangePeriod: (period: "day" | "week" | "month") => void;
}) {
  const alertCount = alerts.length;
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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-slate-50 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Periodo</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{period}</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
              {p}
            </button>
          ))}
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
                        {getAlertDisplayValue(alert) ?? "N/A"}
                      </p>
                    </div>
                  </div>

                  
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
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [history, setHistory] = useState<TelemetryData[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const lastSelectedPointRef = useRef<typeof selectedPoint>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine which point to display in popup and if it's selected
  const displayedPoint = selectedPoint ?? hoveredPoint;
  const isPointSelected = selectedPoint !== null;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/areas", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const raw = await response.json();

        const features = raw.map((item: any) => {
          const alerts: AlertDto[] = Array.isArray(item.alerts) ? item.alerts : [];
          return {
            type: "Feature" as const,
            id: item.id,
            geometry: {
              type: "Point" as const,
              coordinates: [item.longitud, item.latitud] as [number, number],
            },
            properties: {
              ...item,
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

  const sidebarPanelLeft = sidebarState === "collapsed" ? 47.2 : 255.2;
  const chartData = useMemo(() => (history ? prepareChartData(history) : []), [history]);

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

    setHistoryLoading(true);
    const abortController = new AbortController();

    const now = new Date();
    let start: Date;
    switch (period) {
      case "week":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
    }

    const startStr = start.toISOString();
    const endStr = now.toISOString();

    fetch(`http://localhost:8080/api/analytics/area/${id}?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`, {
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
  }, [period, selectedPoint]);

  useEffect(() => {
    const id = selectedPoint?.id ?? lastSelectedPointRef.current?.id;
    if (!id) {
      setSelectedPointAlerts([]);
      return;
    }

    const abortController = new AbortController();

    fetch(`http://localhost:8080/api/alerts/area/${encodeURIComponent(id)}`, {
      signal: abortController.signal,
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Alerts fetch failed");
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

  if (isLoading) {
    return <div className="h-[400px] w-full flex items-center justify-center">Loading map data...</div>;
  }

  return (
    <div className="h-full w-full">
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

              const response = await fetch(`http://localhost:8080/api/areas/${id}`, { cache: "no-store" });
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

        <MapControls />
        <MapAlertStrip alertAreas={alertAreas} />
      </Map>

      {isPanelVisible && (
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
              />
            );
          })()}
        </aside>
      )}
    </div>
  );
}