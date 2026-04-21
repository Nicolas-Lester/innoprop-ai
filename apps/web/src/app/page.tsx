'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // 1. Verificamos si existe el token en el cliente
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role');

    if (!token) {
      // Si no hay token, lo devolvemos al login de inmediato
      router.push('/login');
    } else {
      setUserRole(role);
      setLoading(false);
    }
  }, [router]);

  // Pantalla de transición mientras verificamos la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-blue-500 animate-pulse font-medium">
          Verificando sesión...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      {/* Header del Dashboard */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-blue-500 tracking-tight">
            InnoProp AI
          </h1>
          <p className="text-slate-400 text-sm">Panel de Gestión Inmobiliaria</p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
            Rol: {userRole || 'Usuario'}
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

      {/* Grid de Estadísticas (Placeholder por ahora) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-colors">
          <p className="text-slate-400 text-sm mb-1">Estado del Servidor</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <p className="text-xl font-bold text-white">Online</p>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm mb-1">Total Incidencias</p>
          <p className="text-3xl font-bold">--</p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm mb-1">Prioridad Crítica</p>
          <p className="text-3xl font-bold text-red-500">--</p>
        </div>
      </div>
      
      <div className="mt-12 p-8 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center">
        <div className="bg-blue-500/10 p-4 rounded-full mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Listo para conectar datos</h2>
        <p className="text-slate-400 max-w-sm">
          El backend ya tiene el endpoint de <code className="text-blue-400">/admin/stats</code>. 
          Solo falta crear el fetch para pintar las gráficas aquí.
        </p>
      </div>
    </main>
  );
}