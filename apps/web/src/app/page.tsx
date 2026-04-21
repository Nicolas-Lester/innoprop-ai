'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificamos si hay un token. Si no, mandamos al login.
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return <div className="p-8 text-white">Cargando dashboard...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-500">InnoProp AI Dashboard</h1>
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            router.push('/login');
          }}
          className="px-4 py-2 bg-red-600 rounded-lg text-sm font-bold"
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400 text-sm">Estado del Sistema</p>
          <p className="text-2xl font-bold text-green-500">Conectado</p>
        </div>
      </div>
      
      <p className="mt-8 text-slate-500">Próximo paso: Traer las analíticas de la API.</p>
    </main>
  );
}