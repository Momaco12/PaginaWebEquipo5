"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const FIELD_CONFIG = [
  { key: "humedadSuelo",       label: "Humedad",       unit: "%",    color: "#3b82f6" },
  { key: "temperatura",        label: "Temperatura",   unit: "°C",   color: "#f97316" },
  { key: "radiacionSolar",     label: "Radiación",     unit: "W/m²", color: "#eab308" },
  { key: "evapotranspiracion", label: "Evapotransp.",  unit: "mm",   color: "#06b6d4" },
  { key: "consumoAgua",        label: "Cons. Agua",    unit: "L",    color: "#10b981" },
  { key: "conductividadSuelo", label: "Conductividad", unit: "dS/m", color: "#8b5cf6" },
] as const;

export type FieldKey = (typeof FIELD_CONFIG)[number]["key"];

export interface TelemetryPoint {
  time: string;
  humedadSuelo: number | null;
  temperatura: number | null;
  radiacionSolar: number | null;
  evapotranspiracion: number | null;
  consumoAgua: number | null;
  conductividadSuelo: number | null;
}

export function prepareChartData(
  telemetryArray: Array<{
    fechaHora: string;
    humedadSuelo?: number;
    temperatura?: number;
    radiacionSolar?: number;
    evapotranspiracion?: number;
    consumoAgua?: number;
    conductividadSuelo?: number;
  }>
): TelemetryPoint[] {
  return telemetryArray.map((item) => {
    const date = new Date(item.fechaHora);
    const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return {
      time: timeStr,
      humedadSuelo: item.humedadSuelo ?? null,
      temperatura: item.temperatura ?? null,
      radiacionSolar: item.radiacionSolar ?? null,
      evapotranspiracion: item.evapotranspiracion ?? null,
      consumoAgua: item.consumoAgua ?? null,
      conductividadSuelo: item.conductividadSuelo ?? null,
    };
  });
}

function CustomTooltip({
  active,
  payload,
  fieldKey,
  unit,
}: {
  active?: boolean;
  payload?: any[];
  fieldKey: FieldKey;
  unit: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0]?.payload;
  const value = entry?.[fieldKey];
  const field = FIELD_CONFIG.find((f) => f.key === fieldKey);

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-slate-900">{entry?.time ?? "Tiempo"}</p>
      <p className="mt-1 text-slate-600">
        {field?.label ?? fieldKey}:{" "}
        {value != null ? `${(value as number).toFixed(1)}${unit}` : "N/A"}
      </p>
    </div>
  );
}

export function TelemetryChart({
  chartData,
  historyLoading,
  chartHeight = 160,
}: {
  chartData: TelemetryPoint[];
  historyLoading: boolean;
  chartHeight?: number;
}) {
  const [selectedField, setSelectedField] = useState<FieldKey>("humedadSuelo");
  const field = FIELD_CONFIG.find((f) => f.key === selectedField)!;
  const gradientId = `gradient-${selectedField}`;
  const lastRaw = chartData.length ? chartData[chartData.length - 1][selectedField] : null;
  const lastValueStr =
    lastRaw != null ? `${(lastRaw as number).toFixed(1)}${field.unit}` : "N/A";

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FIELD_CONFIG.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setSelectedField(f.key)}
            className={
              "rounded-full px-2.5 py-1 text-[11px] font-semibold transition " +
              (selectedField === f.key
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 shadow-sm hover:bg-slate-100")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{field.label}</p>
        <div className="rounded-2xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm">
          {lastValueStr}
        </div>
      </div>

      <div style={{ height: chartHeight }}>
        {historyLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Cargando datos…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={field.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={field.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b" }}
                unit={field.unit}
                width={36}
              />
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip fieldKey={selectedField} unit={field.unit} />} />
              <Area
                type="monotone"
                dataKey={selectedField}
                stroke={field.color}
                fill={`url(#${gradientId})`}
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
