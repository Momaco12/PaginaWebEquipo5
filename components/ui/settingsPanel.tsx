"use client";
import React, { useState } from "react";
import { Mail, Lock, ArrowLeft, ChevronRight, CheckCircle, User } from "lucide-react";

interface SettingsPanelProps {
  onBack: () => void;
}

type View = "list" | "email" | "password";

export default function SettingsPanel({ onBack }: SettingsPanelProps) {
  const [view, setView] = useState<View>("list");
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setView("list");
    }, 2500);
  };

  // --- VISTA: CAMBIAR CORREO ---
  if (view === "email") {
    return (
      <div className="max-w-md animate-in fade-in duration-300">
        <button onClick={() => setView("list")} className="flex items-center gap-2 text-slate-500 text-sm mb-6 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} /> Cancelar
        </button>
        <h2 className="text-xl font-bold mb-2">Cambiar correo electrónico</h2>
        <p className="text-slate-500 text-sm mb-6">Ingresa tu nueva dirección institucional.</p>
        <input type="email" placeholder="nuevo.correo@agricola.mx" className="w-full p-3 rounded-lg border border-slate-200 mb-4 outline-blue-500" />
        <button onClick={handleSave} className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Guardar cambios</button>
        {success && <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm"><CheckCircle size={18} /> ¡Correo actualizado!</div>}
      </div>
    );
  }

  // --- VISTA: CAMBIAR CONTRASEÑA ---
  if (view === "password") {
    return (
      <div className="max-w-md animate-in fade-in duration-300">
        <button onClick={() => setView("list")} className="flex items-center gap-2 text-slate-500 text-sm mb-6 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} /> Cancelar
        </button>
        <h2 className="text-xl font-bold mb-2">Cambiar contraseña</h2>
        <p className="text-slate-500 text-sm mb-6">La nueva contraseña debe ser distinta a la anterior.</p>
        <input type="password" placeholder="Nueva contraseña" className="w-full p-3 rounded-lg border border-slate-200 mb-3 outline-purple-500" />
        <input type="password" placeholder="Confirmar contraseña" className="w-full p-3 rounded-lg border border-slate-200 mb-4 outline-purple-500" />
        <button onClick={handleSave} className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">Actualizar contraseña</button>
        {success && <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm"><CheckCircle size={18} /> ¡Contraseña cambiada con éxito!</div>}
      </div>
    );
  }

  // --- VISTA: LISTA PRINCIPAL (Basada en tu imagen) ---
  return (
    <div className="w-full max-w-2xl animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 text-sm mb-8 hover:text-slate-800 transition-colors">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="flex items-center gap-3 mb-6 text-blue-600">
        <User size={24} />
        <h2 className="text-xl font-bold text-slate-800">Cuenta</h2>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Opción Correo */}
        <div 
          onClick={() => setView("email")}
          className="flex items-center p-5 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50"
        >
          <div className="p-2 bg-blue-50 rounded-lg mr-4 text-blue-500">
            <Mail size={22} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-800">Cambiar correo electrónico</div>
            <div className="text-sm text-slate-400">juan.perez@agricola.mx</div>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </div>

        {/* Opción Contraseña */}
        <div 
          onClick={() => setView("password")}
          className="flex items-center p-5 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="p-2 bg-purple-50 rounded-lg mr-4 text-purple-500">
            <Lock size={22} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-800">Cambiar contraseña</div>
            <div className="text-sm text-slate-400">Última actualización hace 3 meses</div>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </div>
      </div>
    </div>
  );
}