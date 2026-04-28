"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, SlidersHorizontal } from "lucide-react";
import { FIELD_CONFIG, FieldKey } from "@/components/ui/telemetry-chart";

interface Area {
  id: string;
  name_area?: string;
  tipo_cultivo?: string;
}

interface LimitConfiguration {
  id: string;
  areaId: string;
  campo: string;
  min: number | null;
  max: number | null;
}

type Limits = Record<FieldKey, { min: string; max: string }>;

function defaultLimits(): Limits {
  return Object.fromEntries(
    FIELD_CONFIG.map((f) => [f.key, { min: "", max: "" }])
  ) as Limits;
}

export default function LimitesConfiguracionPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [limits, setLimits] = useState<Limits>(defaultLimits);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/areas`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((raw: any[]) => {
        setAreas(
          raw.map((item) => ({
            id: String(item.id),
            name_area: item.name_area,
            tipo_cultivo: item.tipo_cultivo,
          }))
        );
      });
  }, []);

  useEffect(() => {
    if (!selectedAreaId) {
      setLimits(defaultLimits());
      return;
    }

    setLoading(true);
    setError(null);

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/limit/config/area/${selectedAreaId}`,
      { cache: "no-store" }
    )
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((configs: LimitConfiguration[]) => {
        const newLimits = defaultLimits();
        configs.forEach((config) => {
          const key = config.campo as FieldKey;
          if (key in newLimits) {
            newLimits[key] = {
              min: config.min != null ? String(config.min) : "",
              max: config.max != null ? String(config.max) : "",
            };
          }
        });
        setLimits(newLimits);
      })
      .finally(() => setLoading(false));
  }, [selectedAreaId]);

  const handleChange = (key: FieldKey, side: "min" | "max", value: string) => {
    setLimits((prev) => ({
      ...prev,
      [key]: { ...prev[key], [side]: value },
    }));
  };

  const handleSave = async () => {
    if (!selectedAreaId) return;

    setSaving(true);
    setError(null);

    const fieldsToSave = FIELD_CONFIG.filter(
      (f) => limits[f.key].min !== "" || limits[f.key].max !== ""
    );

    try {
      await Promise.all(
        fieldsToSave.map((field) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/limit/config`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              areaId: selectedAreaId,
              campo: field.key,
              min: limits[field.key].min !== "" ? parseFloat(limits[field.key].min) : null,
              max: limits[field.key].max !== "" ? parseFloat(limits[field.key].max) : null,
            }),
          }).then((r) => {
            if (!r.ok) throw new Error(`Failed to save ${field.key}`);
            return r.json();
          })
        )
      );

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Error al guardar los límites. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-slate-50/50 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">

        <Link
          href="/alertas"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a alertas
        </Link>

        <div className="flex items-center gap-3 text-blue-600">
          <SlidersHorizontal size={24} />
          <h1 className="text-xl font-bold text-slate-800">Configuración de límites</h1>
        </div>
        <p className="text-sm text-slate-500 -mt-4">
          Define los valores mínimos y máximos aceptables para cada parámetro. Las alertas se generan cuando un valor sale de estos rangos.
        </p>

        <div className="space-y-1.5">
          <label className="block text-xs text-slate-400 uppercase tracking-wide">Área</label>
          <select
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Selecciona un área...</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name_area ?? area.id}
                {area.tipo_cultivo ? ` — ${area.tipo_cultivo}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div
          className={
            "bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500" +
            (!selectedAreaId ? " opacity-50 pointer-events-none" : "")
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-400">
              Cargando configuración...
            </div>
          ) : (
            FIELD_CONFIG.map((field, idx) => (
              <div
                key={field.key}
                className={
                  "flex flex-col gap-3 p-5 sm:flex-row sm:items-center " +
                  (idx < FIELD_CONFIG.length - 1 ? "border-b border-slate-50" : "")
                }
              >
                <div className="flex items-center gap-3 sm:w-44 shrink-0">
                  <span
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold"
                    style={{ backgroundColor: field.color }}
                  >
                    {field.unit}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{field.label}</p>
                    <p className="text-xs text-slate-400">{field.unit}</p>
                  </div>
                </div>

                <div className="flex flex-1 gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Mínimo</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={limits[field.key].min}
                        onChange={(e) => handleChange(field.key, "min", e.target.value)}
                        placeholder="—"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Máximo</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={limits[field.key].max}
                        onChange={(e) => handleChange(field.key, "max", e.target.value)}
                        placeholder="—"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!selectedAreaId || saving}
          className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar límites"}
        </button>

        {saved && (
          <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 animate-in fade-in duration-200">
            <CheckCircle size={16} />
            Límites guardados correctamente.
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 animate-in fade-in duration-200">
            {error}
          </div>
        )}

      </div>
    </div>
  );
}
