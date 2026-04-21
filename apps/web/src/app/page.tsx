'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Definimos la interfaz para que TypeScript no se queje
interface StatsData {
  total: number;
  priorityDistribution: { label: string; value: number }[];
  categoryDistribution: { label: string; value: number }[];
  statusDistribution: { label: string; value: number }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role');

    if (!token) {
      router.push('/login');
      return;
    }

    setUserRole(role);
    
    // LA MAGIA: Solo pedimos stats si el usuario es explícitamente ADMIN
    if (role === 'ADMIN') {
      fetchStats(token);
    } else {
      // Si es TENANT o undefined, dejamos de cargar para que no se quede pegado buscando
      setLoading(false);
    }
  }, [router]);

  // Función para traer los datos del backend
  const fetchStats = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Error al cargar las estadísticas');

      const json = await response.json();
      setStats(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculamos cuántos tickets críticos hay buscando en el array (solo si stats existe)
  const criticalTickets = stats?.priorityDistribution?.find(p => p.label === 'CRITICA')?.value || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-blue-500 animate-pulse font-medium">Cargando datos del servidor...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      {/* Header General */}
      <div className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-500 tracking-tight">InnoProp AI</h1>
          <p className="text-slate-400 text-sm">Panel de Gestión Inmobiliaria</p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
            Rol: {userRole || 'Residente'}
          </span>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user_role');
              router.push('/login');
            }}
            className="px-4 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-sm font-bold transition-all border border-red-600/20"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {/* VISTA PARA RESIDENTES (TENANTS) */}
      {userRole !== 'ADMIN' && (
        <div className="mb-6 p-8 bg-slate-900 border border-slate-800 rounded-2xl">
          <h2 className="text-2xl font-bold mb-2 text-white">Bienvenido a tu portal</h2>
          <p className="text-slate-400 mb-6 max-w-2xl">
            Desde aquí podrás gestionar los problemas de tu departamento. Nuestra Inteligencia Artificial analizará tus reportes y fotos para enviar la ayuda adecuada de inmediato.
          </p>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20">
            + Reportar Nuevo Problema
          </button>
        </div>
      )}

      {/* VISTA EXCLUSIVA PARA ADMINS */}
      {userRole === 'ADMIN' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-slate-400 text-sm mb-1">Total Incidencias</p>
              <p className="text-4xl font-bold text-white">{stats?.total || 0}</p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-slate-400 text-sm mb-1">Atención Urgente (Críticas)</p>
              <p className="text-4xl font-bold text-red-500">{criticalTickets}</p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-center">
               <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                 + Administrar Tickets
               </button>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <h2 className="text-lg font-semibold mb-4 text-slate-300">Tickets por Categoría</h2>
              <div className="space-y-3">
                {stats?.categoryDistribution?.map((cat, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-400">{cat.label}</span>
                    <span className="font-bold text-white">{cat.value}</span>
                  </div>
                ))}
                {(!stats?.categoryDistribution || stats.categoryDistribution.length === 0) && (
                  <p className="text-slate-500 text-sm italic">No hay datos aún.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}