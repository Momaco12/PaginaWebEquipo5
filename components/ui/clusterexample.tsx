"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, ArrowRight, Leaf, MapPin, Square } from "lucide-react";

import { Map, MapClusterLayer, MapPopup, MapControls } from "@/components/ui/map";
import { useSidebar } from "@/components/ui/sidebar";

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
  general?: {
    estado_id?: number;
    fecha_siembra?: string;
    superficie_ha?: number;
    densidad_plantas_ha?: number;
  };
  suelo?: {
    humedad_actual?: number;
    capacidad_de_campo?: number;
    punto_de_marchitez?: number;
    conductividad_electrica_ds_m?: number;
    temperatura_suelo_c?: number;
  };
  riego?: {
    sistema_activo?: boolean;
    caudal_l_s?: number;
    consumo_mensual_m3?: number;
    evapotranspiracion_etc_mm_dia?: number;
    necesidad_hidrica_m3_ha?: number;
  };
  ambiental?: {
    temperatura_aire_c?: number;
    humedad_relativa_porcentaje?: number;
    radiacion_solar_w_m2?: number;
    velocidad_viento_km_h?: number;
    probabilidad_lluvia_porcentaje?: number;
  };
  [key: string]: unknown;
}

function prepareChartData(telemetryArray: any[]): any[] {
  return telemetryArray.map((item) => {
    const date = new Date(item.fechaHora);
    const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return {
      time: timeStr,
      humedadSuelo: item.humedadSuelo ?? null,
      temperatura: item.temperatura ?? null,
    };
  });
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0]?.payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-slate-900">{entry?.time ?? "Tiempo"}</p>
      <p className="mt-1 text-slate-600">Humedad: {entry?.humedadSuelo != null ? `${entry.humedadSuelo.toFixed(1)}%` : "N/A"}</p>
      <p className="text-slate-600">Temperatura: {entry?.temperatura != null ? `${entry.temperatura.toFixed(1)}°C` : "N/A"}</p>
    </div>
  );
}

function ResumeSidebar({
  properties,
  chartData,
  historyLoading,
  period,
  onChangePeriod,
  onClose,
}: {
  properties: AreaProperties;
  chartData: any[];
  historyLoading: boolean;
  period: "day" | "week" | "month";
  onChangePeriod: (period: "day" | "week" | "month") => void;
  onClose: () => void;
}) {
  const lastHumidity = chartData.length ? chartData[chartData.length - 1].humedadSuelo : null;
  const showAlert = typeof lastHumidity === "number" && lastHumidity < 20;
  const sizeValue = properties.superficie_ha ?? properties.general?.superficie_ha;

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

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Humedad del suelo</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Último dato</p>
          </div>
          <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm">
            {lastHumidity != null ? `${lastHumidity.toFixed(1)}%` : "N/A"}
          </div>
        </div>
        <div className="mt-4 h-40">
          {historyLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading history…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} unit="%" width={30} />
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="humedadSuelo" stroke="#3b82f6" fill="url(#humidityGradient)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

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
      </div>

      {showAlert && (
        <div className="rounded-3xl bg-red-50 p-4 text-sm text-slate-900">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-2xl bg-red-100 p-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Critical Soil Moisture</p>
              <p className="mt-1 text-slate-600">Última humedad de suelo debajo del 20%. Revisa el riego urgente.</p>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="flex w-full items-center justify-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Ver mas detalles
        <ArrowRight className="h-4 w-4" />
      </button>
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
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [history, setHistory] = useState<TelemetryData[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const lastSelectedPointRef = useRef<typeof selectedPoint>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/areas", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const raw = await response.json();
        const features = raw.map((item: any) => ({
          type: "Feature" as const,
          id: item.id,
          geometry: {
            type: "Point" as const,
            coordinates: [item.longitud, item.latitud] as [number, number],
          },
          properties: item,
        }));

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

  const sidebarPanelLeft = sidebarState === "collapsed" ? 47.2 : 255.2;

  const chartData = useMemo(() => (history ? prepareChartData(history) : []), [history]);

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
              console.log(feature)
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
                properties: apiFeature.properties ?? feature.properties,
                history: (apiFeature.properties as any)?.history ?? undefined,
              });
            } catch {
              // Keep current selection if the request fails
            }
          }}
        />

        {selectedPoint && (
          <MapPopup
            key={`${selectedPoint.coordinates[0]}-${selectedPoint.coordinates[1]}`}
            longitude={selectedPoint.coordinates[0]}
            latitude={selectedPoint.coordinates[1]}
            onClose={() => setSelectedPoint(null)}
            closeOnClick={false}
            focusAfterOpen={false}
            closeButton
          >
            <div className="space-y-1 p-1">
              <p className="text-sm font-medium">
                {selectedPoint.properties.name_area ?? "Area"}
              </p>
              <p className="text-sm">Cultivo: {selectedPoint.properties.cultivo ?? "N/A"}</p>
              <p className="text-sm">
                Superficie (ha): {selectedPoint.properties.general?.superficie_ha ?? "N/A"}
              </p>
              <p className="text-sm">
                Última actualización:{" "}
                {selectedPoint.properties.last_updated
                  ? new Date(selectedPoint.properties.last_updated).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </MapPopup>
        )}

        <MapControls />
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
                properties={panelPoint.properties}
                chartData={chartData}
                historyLoading={historyLoading}
                period={period}
                onChangePeriod={setPeriod}
                onClose={() => setSelectedPoint(null)}
              />
            );
          })()}
        </aside>
      )}
    </div>
  );
}