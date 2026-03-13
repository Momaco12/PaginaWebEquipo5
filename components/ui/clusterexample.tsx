"use client";

import { useEffect, useMemo, useState } from "react";
import { Map, MapClusterLayer, MapPopup, MapControls } from "@/components/ui/map";

interface AreaProperties {
  name?: string;
  cultivo?: string;
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

function averagePosition(points: [number, number][]): [number, number] | null {
  if (!points.length) return null;

  const totals = points.reduce(
    (acc, point) => ({ lng: acc.lng + point[0], lat: acc.lat + point[1] }),
    { lng: 0, lat: 0 }
  );

  return [totals.lng / points.length, totals.lat / points.length];
}

function collectCoordinatePairs(value: unknown): [number, number][] {
  if (!Array.isArray(value)) return [];

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    return [[value[0], value[1]]];
  }

  return value.flatMap((item) => collectCoordinatePairs(item));
}

function toClusterPoint(feature: AreaFeature): GeoJSON.Feature<GeoJSON.Point, AreaProperties> | null {
  const geometry = feature.geometry;
  if (!geometry) return null;

  let coordinates: [number, number] | null = null;

  if (geometry.type === "Point") {
    const pairs = collectCoordinatePairs(geometry.coordinates);
    coordinates = pairs[0] ?? null;
  }

  if (geometry.type === "Polygon") {
    const pairs = collectCoordinatePairs(geometry.coordinates);
    coordinates = averagePosition(pairs);
  }

  if (geometry.type === "MultiPolygon") {
    const pairs = collectCoordinatePairs(geometry.coordinates);
    coordinates = averagePosition(pairs);
  }

  if (!coordinates) return null;

  return {
    type: "Feature",
    id: feature.id,
    geometry: {
      type: "Point",
      coordinates,
    },
    properties: feature.properties ?? {},
  };
}

export function ClusterExample() {
  const [data, setData] = useState<GeoJSON.FeatureCollection<GeoJSON.Point, AreaProperties> | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{
    coordinates: [number, number];
    properties: AreaProperties;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await fetch("/api/earthquakes", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const geojson = (await response.json()) as GeoJSON.FeatureCollection<
          GeoJSON.Geometry,
          AreaProperties
        >;

        const features = geojson.features
          .map((feature) => toClusterPoint(feature))
          .filter(
            (
              feature
            ): feature is GeoJSON.Feature<GeoJSON.Point, AreaProperties> =>
              feature !== null
          );

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

    return averagePosition(coordinates) ?? [-103.59, 40.66];
  }, [data]);

  if (isLoading) {
    return <div className="h-[400px] w-full flex items-center justify-center">Loading map data...</div>;
  }

  return (
    <div className="h-[400px] w-full">
      <Map center={mapCenter} zoom={8} fadeDuration={0}>
        <MapClusterLayer<AreaProperties>
          data={data ?? { type: "FeatureCollection", features: [] }}
          clusterRadius={50}
          clusterMaxZoom={0}
          clusterColors={["#1d8cf8", "#6d5dfc", "#e23670"]}
          pointColor="#1d8cf8"
          onPointClick={(feature, coordinates) => {
            setSelectedPoint({
              coordinates,
              properties: feature.properties,
            });
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
                {selectedPoint.properties.name ?? "Area"}
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
    </div>
  );
}