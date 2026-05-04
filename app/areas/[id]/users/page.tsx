"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, UserPlus, UserMinus, Shield, Eye } from "lucide-react";
import { useUser } from "@/components/auth/UserContext";

interface AreaUser {
  id: string;
  nombreCompleto: string;
  email: string;
  rol: 'ADMINISTRADOR' | 'LECTOR';
  fechaAlta: string;
  estadoActivo: boolean;
}

interface Area {
  id: string;
  name?: string;
  cropType?: string;
}

export default function AreaUsersPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin, isLoading } = useUser();
  const areaId = params.id as string;

  const [area, setArea] = useState<Area | null>(null);
  const [users, setUsers] = useState<AreaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/areas');
      return;
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (!areaId || !isAdmin) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load area details
        const areaResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/areas/${areaId}`, {
          cache: "no-store"
        });
        if (!areaResponse.ok) throw new Error('Error loading area');
        const areaData = await areaResponse.json();
        setArea(areaData);

        // Load users for this area
        const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/area/${areaId}`, {
          cache: "no-store"
        });
        if (!usersResponse.ok) throw new Error('Error loading users');
        const usersData = await usersResponse.json();
        setUsers(Array.isArray(usersData) ? usersData : []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [areaId, isAdmin]);

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres remover este usuario del área?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/areas/${areaId}/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error removing user');

      // Remove user from local state
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing user');
    }
  };

  const handleAddUser = async () => {
    // This would typically open a modal or navigate to a user selection page
    // For now, we'll show a placeholder
    alert('Funcionalidad para agregar usuarios próximamente');
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Cargando…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Acceso denegado</h1>
          <p className="text-sm text-slate-500">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Cargando usuarios del área…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-slate-50/50 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">

        <Link
          href="/areas"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a áreas
        </Link>

        <div className="flex items-center gap-3 text-blue-600">
          <Users size={24} />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Usuarios del área</h1>
            <p className="text-sm text-slate-500">
              {area?.name ?? `Área ${areaId}`}
              {area?.cropType && ` — ${area.cropType}`}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {users.length} usuario{users.length !== 1 ? 's' : ''} asignado{users.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={handleAddUser}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <UserPlus size={16} />
            Agregar usuario
          </button>
        </div>

        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-sm font-semibold text-slate-900">No hay usuarios asignados</h3>
              <p className="mt-1 text-sm text-slate-500">
                Esta área no tiene usuarios asignados actualmente.
              </p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      {user.rol === 'ADMINISTRADOR' ? (
                        <Shield className="h-5 w-5 text-slate-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{user.nombreCompleto}</h3>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          user.rol === 'ADMINISTRADOR'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {user.rol === 'ADMINISTRADOR' ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                          {user.rol}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          user.estadoActivo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.estadoActivo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <UserMinus size={14} />
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}