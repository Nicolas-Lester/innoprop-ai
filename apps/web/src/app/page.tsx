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

  // Estados para filtros y UI de Tenants
  const [activeFilter, setActiveFilter] = useState('ALL');
  // Estado para guardar qué tarjetas están expandidas (guardamos los IDs)
  const [expandedTickets, setExpandedTickets] = useState<string[]>([]);

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

  // --- LÓGICA DE UI PARA TENANTS ---

  // Función para abrir/cerrar detalles de una tarjeta
  const toggleTicketDetails = (ticketId: string) => {
    setExpandedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  // Función para filtrar los tickets antes de mostrarlos
  const getFilteredTickets = () => {
    if (activeFilter === 'ALL') return myTickets;
    if (activeFilter === 'OPEN' || activeFilter === 'RESOLVED') {
      return myTickets.filter(t => t.status === activeFilter);
    }
    return myTickets.filter(t => t.category === activeFilter);
  };

  const filteredTickets = getFilteredTickets();

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
            <div className="animate-fade-in-up">
              <div className="mb-8 p-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-white">Bienvenido a tu portal</h2>
                  <p className="text-slate-400 max-w-2xl">
                    Gestiona los problemas de tu departamento. Nuestra IA analizará tus reportes y fotos para enviar la ayuda adecuada de inmediato.
                  </p>
                </div>
                <button 
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-transform hover:scale-105 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                >
                  + Nuevo Reporte
                </button>
              </div>

              {/* CONTROLES DE FILTRADO */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold">Mis Reportes ({filteredTickets.length})</h3>
                
                {/* Botones de Filtro (Píldoras) */}
                {myTickets.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {['ALL', 'OPEN', 'RESOLVED', 'GASFITERIA', 'ESTRUCTURA', 'ELECTRICIDAD'].map((filter) => {
                      // Solo mostramos filtros de categoría si el usuario tiene tickets de esa categoría
                      if (['GASFITERIA', 'ESTRUCTURA', 'ELECTRICIDAD'].includes(filter) && !myTickets.some(t => t.category === filter)) return null;

                      return (
                        <button
                          key={filter}
                          onClick={() => setActiveFilter(filter)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            activeFilter === filter 
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20' 
                              : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {filter === 'ALL' ? 'Todos' : filter === 'OPEN' ? 'Pendientes' : filter === 'RESOLVED' ? 'Resueltos' : filter}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* LISTA DE TICKETS DEL USUARIO */}
              {myTickets.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-slate-800 rounded-2xl text-center flex flex-col items-center justify-center bg-slate-900/50">
                  <span className="text-4xl mb-4">🏠</span>
                  <p className="text-slate-400 font-medium">Todo está en orden.</p>
                  <p className="text-slate-500 text-sm mt-1">Aún no has reportado ningún problema.</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                 <div className="p-8 border border-slate-800 rounded-xl text-center text-slate-500 bg-slate-900/30">
                  No hay tickets que coincidan con este filtro.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTickets.map((ticket) => {
                    const isExpanded = expandedTickets.includes(ticket.id);

                    return (
                      <div key={ticket.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 transition-all flex flex-col shadow-md">
                        {/* Cabecera del Ticket */}
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-bold px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-slate-300">
                            {ticket.category}
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                            ticket.priority === 'CRITICA' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            ticket.priority === 'ALTA' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                            ticket.priority === 'MEDIA' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            'bg-green-500/10 text-green-500 border-green-500/20'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>

                        {/* Imagen Principal (Siempre visible si existe) */}
                        {ticket.imageUrl && (
                          <div className="mb-4 w-full h-36 relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950/50 group">
                            <img 
                              src={ticket.imageUrl} 
                              alt="Foto del problema" 
                              className="object-cover w-full h-full opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            />
                          </div>
                        )}

                        {/* Estado y Fecha */}
                        <div className="flex justify-between items-center text-xs text-slate-400 mb-4 pb-4 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${ticket.status === 'OPEN' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                            <strong className="text-slate-200">{ticket.status === 'OPEN' ? 'En Revisión' : ticket.status}</strong>
                          </div>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Sección Colapsable (Detalles e IA) */}
                        {isExpanded && (
                          <div className="mb-4 animate-fade-in-down">
                            <p className="text-sm text-slate-300 mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                              <span className="text-slate-500 block text-xs mb-1">Tu reporte:</span>
                              "{ticket.description}"
                            </p>
                            
                            <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                              <p className="text-xs text-blue-400 font-semibold mb-1 flex items-center gap-1.5">
                                <span className="text-base">🤖</span> Análisis IA:
                              </p>
                              <p className="text-sm text-slate-300 leading-relaxed">{ticket.aiSummary}</p>
                            </div>
                          </div>
                        )}

                        {/* Botón de Expandir/Contraer */}
                        <button 
                          onClick={() => toggleTicketDetails(ticket.id)}
                          className="mt-auto w-full py-2 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800/80 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                        >
                          {isExpanded ? (
                            <><span>Ocultar detalles</span> <span>↑</span></>
                          ) : (
                            <><span>Ver reporte completo y análisis IA</span> <span>↓</span></>
                          )}
                        </button>
                      </div>
                    );
                  })}
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
                         onClick={() => setShowAdminTable(true)}
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