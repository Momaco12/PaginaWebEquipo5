"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Map, MapClusterLayer, MapPopup, MapControls } from "@/components/ui/map";
import { useSidebar } from "@/components/ui/sidebar";

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

type AreaFeature = GeoJSON.Feature<GeoJSON.Geometry, AreaProperties>;

function buildSparklinePath(values: number[], width = 140, height = 40) {
  if (!values.length) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const path = values
    .map((value, idx) => {
      const x = idx * step;
      const y = height - ((value - min) / span) * height;
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return path;
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
  const [history, setHistory] = useState<Array<Record<string, any>> | null>(null);
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

  const metricDefs = [
    { key: "humedad_suelo", label: "Humedad suelo", unit: "%" },
    { key: "temperatura", label: "Temperatura", unit: "°C" },
    { key: "radiacion_solar", label: "Radiación solar", unit: "W/m²" },
    { key: "evapotranspiracion", label: "Evapotranspiración", unit: "mm" },
    { key: "consumo_agua", label: "Consumo de agua", unit: "m³" },
    { key: "conductividad_suelo", label: "Conductividad suelo", unit: "dS/m" },
  ];

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

    fetch(`/api/v1/area_riego/${id}/history?period=${period}`, {
      signal: abortController.signal,
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("History fetch failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
        } else if (Array.isArray(data?.history)) {
          setHistory(data.history);
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
              const id = feature.id;
              if (id == null) return;

              const response = await fetch(`/api/v1/area_riego/${id}`, { cache: "no-store" });
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
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold">
                      {panelPoint.properties.name_area ?? "Area"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {panelPoint.coordinates[0].toFixed(4)}, {panelPoint.coordinates[1].toFixed(4)}
                    </p>
                  </div>
                  <button
                    className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80"
                    onClick={() => setSelectedPoint(null)}
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Period</p>
                    <div className="flex gap-2">
                      {(["day", "week", "month"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={
                            "rounded-md px-2 py-1 text-xs font-medium transition " +
                            (period === p
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/20 text-muted-foreground hover:bg-muted/40")
                          }
                          onClick={() => setPeriod(p)}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Historic (by {period})</p>
                    {historyLoading ? (
                      <p className="text-xs text-muted-foreground">Loading history…</p>
                    ) : !history || history.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No history available.</p>
                    ) : (
                      <div className="space-y-3">
                        {metricDefs.map((metric) => {
                          const values = history
                            .map((entry) => Number(entry[metric.key]))
                            .filter((n) => !Number.isNaN(n));
                          const latest = values[values.length - 1];
                          const path = buildSparklinePath(values);

                          return (
                            <div key={metric.key} className="flex items-center justify-between gap-2">
                              <div className="min-w-[110px]">
                                <p className="text-xs font-medium">{metric.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {latest ?? "N/A"} {metric.unit}
                                </p>
                              </div>
                              <svg width={140} height={40} className="flex-shrink-0">
                                <path
                                  d={path}
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  fill="none"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Static info</p>
                    <p>
                      Cultivo: {panelPoint.properties.tipo_cultivo ?? panelPoint.properties.cultivo ?? "N/A"}
                    </p>
                    <p>Tipo de tierra: {panelPoint.properties.tipo_tierra ?? "N/A"}</p>
                    <p>
                      Superficie: {panelPoint.properties.superficie_ha ?? panelPoint.properties.general?.superficie_ha ?? "N/A"} ha
                    </p>
                    <p>Capacidad de campo: {panelPoint.properties.capacidad_campo ?? "N/A"}</p>
                    <p>Punto de marchitez: {panelPoint.properties.punto_marchitez ?? "N/A"}</p>
                    <p>Lat: {panelPoint.properties.latitud ?? panelPoint.coordinates[1]}</p>
                    <p>Lng: {panelPoint.properties.longitud ?? panelPoint.coordinates[0]}</p>
                  </div>
                </div>
              </>
            );
          })()}
        </aside>
      )}
    </div>
  );
}