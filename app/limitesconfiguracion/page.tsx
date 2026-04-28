"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, SlidersHorizontal } from "lucide-react";
import { FIELD_CONFIG, FieldKey } from "@/components/ui/telemetry-chart";

const STORAGE_KEY = "alert-limits";

type Limits = Record<FieldKey, { min: string; max: string }>;

function defaultLimits(): Limits {
  return Object.fromEntries(
    FIELD_CONFIG.map((f) => [f.key, { min: "", max: "" }])
  ) as Limits;
}

function loadLimits(): Limits {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLimits();
    return { ...defaultLimits(), ...JSON.parse(raw) };
  } catch {
    return defaultLimits();
  }
}

export default function LimitesConfiguracionPage() {
  const [limits, setLimits] = useState<Limits>(defaultLimits);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLimits(loadLimits());
  }, []);

  const handleChange = (key: FieldKey, side: "min" | "max", value: string) => {
    setLimits((prev) => ({
      ...prev,
      [key]: { ...prev[key], [side]: value },
    }));
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limits));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
          {FIELD_CONFIG.map((field, idx) => (
            <div
              key={field.key}
              className={
                "flex flex-col gap-3 p-5 sm:flex-row sm:items-center " +
                (idx < FIELD_CONFIG.length - 1 ? "border-b border-slate-50" : "")
              }
            >
              {/* Label */}
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

              {/* Inputs */}
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
          ))}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98]"
        >
          Guardar límites
        </button>

        {saved && (
          <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 animate-in fade-in duration-200">
            <CheckCircle size={16} />
            Límites guardados correctamente.
          </div>
        )}

      </div>
    </div>
  );
}
