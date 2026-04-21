'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NewTicketForm from '../components/NewTicketForm';
import AdminTicketTable from '../components/AdminTicketTable';

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
  
  // NUEVO ESTADO: Para guardar los tickets del Tenant
  const [myTickets, setMyTickets] = useState<any[]>([]); 
  
  const [error, setError] = useState('');
  
  // Estado para controlar si vemos el Dashboard o el Formulario
  const [showForm, setShowForm] = useState(false);

  const [showAdminTable, setShowAdminTable] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role');

    if (!token) {
      router.push('/login');
      return;
    }

    setUserRole(role);
    
    // Si es ADMIN pedimos métricas, si es TENANT pedimos sus tickets personales
    if (role === 'ADMIN') {
      fetchStats(token);
    } else {
      fetchMyTickets(token);
    }
  }, [router]);

  // Función para traer los datos del ADMIN
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

  // NUEVA FUNCIÓN: Para traer los tickets del usuario logueado (TENANT)
  const fetchMyTickets = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al cargar tus tickets');
      
      const json = await response.json();
      setMyTickets(json.data);
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

      {/* RENDERIZADO CONDICIONAL: Mostramos el formulario O el dashboard */}
      {showForm ? (
        <div className="my-8 animate-fade-in-down">
          <NewTicketForm 
            onCancel={() => setShowForm(false)} 
            onTicketCreated={() => {
              setShowForm(false);
              const token = localStorage.getItem('token');
              
              // Recargamos los datos correspondientes según el rol
              if (userRole === 'ADMIN' && token) fetchStats(token);
              if (userRole !== 'ADMIN' && token) fetchMyTickets(token);
              
              alert('¡Ticket creado y analizado por IA con éxito!'); 
            }} 
          />
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500">
              {error}
            </div>
          )}

          {/* VISTA PARA RESIDENTES (TENANTS) */}
          {userRole !== 'ADMIN' && (
            <div>
              <div className="mb-8 p-8 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-white">Bienvenido a tu portal</h2>
                  <p className="text-slate-400 max-w-2xl">
                    Gestiona los problemas de tu departamento. Nuestra IA analizará tus reportes y fotos para enviar la ayuda adecuada de inmediato.
                  </p>
                </div>
                <button 
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20 whitespace-nowrap"
                >
                  + Nuevo Reporte
                </button>
              </div>

              {/* LISTA DE TICKETS DEL USUARIO */}
              <h3 className="text-xl font-bold mb-4">Mis Reportes Recientes</h3>
              {myTickets.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-800 rounded-xl text-center text-slate-500">
                  Aún no has reportado ningún problema.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myTickets.map((ticket) => (
                    <div key={ticket.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500/50 transition-all flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold px-2 py-1 bg-slate-800 rounded text-slate-300">
                          {ticket.category}
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          ticket.priority === 'CRITICA' ? 'bg-red-500/20 text-red-500' : 
                          ticket.priority === 'ALTA' ? 'bg-orange-500/20 text-orange-500' : 
                          ticket.priority === 'MEDIA' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-green-500/20 text-green-500'
                        }`}>
                          Prioridad: {ticket.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">"{ticket.description}"</p>
                      
                      {/* Análisis de la IA */}
                      <div className="mt-auto p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-blue-400 font-semibold mb-1 flex items-center gap-1">
                          <span>🤖</span> Análisis de InnoProp AI:
                        </p>
                        <p className="text-sm text-slate-300">{ticket.aiSummary}</p>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                        <span>Estado: <strong className="text-white">{ticket.status}</strong></span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* VISTA EXCLUSIVA PARA ADMINS */}
          {userRole === 'ADMIN' && (
            <>
              {showAdminTable ? (
                <div className="my-8">
                  <AdminTicketTable 
                    token={localStorage.getItem('token') || ''} 
                    onBack={() => {
                      setShowAdminTable(false);
                      // Recargamos los stats por si algún ticket cambió de estado
                      const token = localStorage.getItem('token');
                      if (token) fetchStats(token);
                    }} 
                  />
                </div>
              ) : (
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
                       <button 
                         onClick={() => setShowAdminTable(true)} // <--- AQUÍ LE DAMOS VIDA AL BOTÓN
                         className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                       >
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
            </>
          )}
        </>
      )}
    </main>
  );
}