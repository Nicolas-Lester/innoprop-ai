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
      <div className="min-h-screen bg-mesh bg-grid flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/15" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border border-purple-500/20 border-b-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <div className="text-center">
            <p className="text-slate-300 text-sm font-medium">Cargando InnoProp AI</p>
            <p className="text-slate-600 text-xs mt-1">Conectando con el servidor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-mesh bg-grid text-white">
      {/* Fixed ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-purple-600/4 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/3 rounded-full blur-3xl" />
      </div>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text tracking-tight leading-none">InnoProp AI</h1>
              <p className="text-slate-600 text-xs">Panel de Gestión Inmobiliaria</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
              userRole === 'ADMIN'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${userRole === 'ADMIN' ? 'bg-blue-400' : 'bg-purple-400'}`} />
              Rol: {userRole || 'Residente'}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user_role');
                router.push('/login');
              }}
              className="px-4 py-1.5 bg-red-500/8 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all duration-200 border border-red-500/20 hover:border-red-500"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">

        {/* Show form or dashboard */}
        {showForm ? (
          <div className="animate-scale-in">
            <NewTicketForm
              onCancel={() => setShowForm(false)}
              onTicketCreated={() => {
                setShowForm(false);
                const token = localStorage.getItem('token');
                if (userRole === 'ADMIN' && token) fetchStats(token);
                if (userRole !== 'ADMIN' && token) fetchMyTickets(token);
                alert('¡Ticket creado y analizado por IA con éxito!');
              }}
            />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3 animate-fade-in-down">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                TENANT VIEW
            ══════════════════════════════════════════════════ */}
            {userRole !== 'ADMIN' && (
              <div className="space-y-7 animate-fade-in-up">

                {/* Welcome Banner */}
                <div
                  className="relative overflow-hidden rounded-2xl p-8 glass-card"
                  style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.14) 0%, rgba(139,92,246,0.08) 60%, rgba(15,23,42,0.92) 100%)' }}
                >
                  <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
                  {/* Decorative circle */}
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/8 rounded-full blur-2xl" />
                  <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">🏠</span>
                        <h2 className="text-2xl font-bold text-white">Bienvenido a tu portal</h2>
                      </div>
                      <p className="text-slate-400 max-w-lg text-sm leading-relaxed">
                        Gestiona los problemas de tu departamento. Nuestra IA analizará tus reportes y fotos para
                        enviar la ayuda adecuada de inmediato.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowForm(true)}
                      className="btn-primary px-6 py-3 flex items-center gap-2 whitespace-nowrap text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Nuevo Reporte
                    </button>
                  </div>
                </div>

                {/* Filters + count */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    Mis Reportes
                    <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono">
                      {filteredTickets.length}
                    </span>
                  </h3>

                  {myTickets.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {['ALL', 'OPEN', 'RESOLVED', 'GASFITERIA', 'ESTRUCTURA', 'ELECTRICIDAD'].map((filter) => {
                        if (['GASFITERIA', 'ESTRUCTURA', 'ELECTRICIDAD'].includes(filter) && !myTickets.some(t => t.category === filter)) return null;
                        return (
                          <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                              activeFilter === filter
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            {filter === 'ALL' ? 'Todos' : filter === 'OPEN' ? 'Pendientes' : filter === 'RESOLVED' ? 'Resueltos' : filter}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Ticket Grid */}
                {myTickets.length === 0 ? (
                  <div className="glass-card rounded-2xl p-16 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-3xl mb-4 animate-float">
                      🏠
                    </div>
                    <p className="text-slate-300 font-semibold mb-1">Todo está en orden</p>
                    <p className="text-slate-500 text-sm">Aún no has reportado ningún problema.</p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="glass-card rounded-xl p-8 text-center text-slate-500 text-sm">
                    No hay tickets que coincidan con este filtro.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTickets.map((ticket, idx) => {
                      const isExpanded = expandedTickets.includes(ticket.id);
                      const priorityClass =
                        ticket.priority === 'CRITICA' ? 'badge-critica' :
                        ticket.priority === 'ALTA' ? 'badge-alta' :
                        ticket.priority === 'MEDIA' ? 'badge-media' : 'badge-baja';
                      const statusDotClass =
                        ticket.status === 'OPEN' ? 'status-dot-open' :
                        ticket.status === 'IN_PROGRESS' ? 'status-dot-progress' : 'status-dot-resolved';

                      return (
                        <div
                          key={ticket.id}
                          className="glass-card rounded-2xl flex flex-col overflow-hidden animate-fade-in-up"
                          style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
                        >
                          {/* Image */}
                          {ticket.imageUrl && (
                            <div className="relative w-full h-40 overflow-hidden bg-slate-900/50 flex-shrink-0">
                              <img
                                src={ticket.imageUrl}
                                alt="Evidencia"
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                              {/* Priority badge overlay */}
                              <div className="absolute top-3 right-3">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${priorityClass}`}>
                                  {ticket.priority}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="p-5 flex flex-col flex-1">
                            {/* Badges (no image case) */}
                            {!ticket.imageUrl && (
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/50">
                                  {ticket.category}
                                </span>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${priorityClass}`}>
                                  {ticket.priority}
                                </span>
                              </div>
                            )}
                            {/* Category badge when image exists */}
                            {ticket.imageUrl && (
                              <div className="mb-3">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/50">
                                  {ticket.category}
                                </span>
                              </div>
                            )}

                            {/* Status + Date */}
                            <div className="flex justify-between items-center py-2.5 border-y border-slate-800/50 mb-3">
                              <div className="flex items-center gap-2">
                                <span className={statusDotClass} />
                                <span className="text-xs font-semibold text-slate-300">
                                  {ticket.status === 'OPEN' ? 'En Revisión' : ticket.status === 'IN_PROGRESS' ? 'En Progreso' : 'Resuelto'}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* Expanded detail */}
                            {isExpanded && (
                              <div className="mb-4 space-y-3 animate-fade-in-down">
                                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/60">
                                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Tu reporte</p>
                                  <p className="text-sm text-slate-300 leading-relaxed">"{ticket.description}"</p>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                                  <p className="text-xs text-blue-400 font-semibold mb-1.5 flex items-center gap-1.5">
                                    <span>🤖</span> Análisis IA
                                  </p>
                                  <p className="text-sm text-slate-300 leading-relaxed">{ticket.aiSummary}</p>
                                </div>
                              </div>
                            )}

                            {/* Toggle */}
                            <button
                              onClick={() => toggleTicketDetails(ticket.id)}
                              className="mt-auto w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800/70 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-700/50"
                            >
                              {isExpanded ? (
                                <><span>Ocultar detalles</span><span>↑</span></>
                              ) : (
                                <><span>Ver reporte completo y análisis IA</span><span>↓</span></>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                ADMIN VIEW
            ══════════════════════════════════════════════════ */}
            {userRole === 'ADMIN' && (
              <>
                {showAdminTable ? (
                  <div className="animate-fade-in-up">
                    <AdminTicketTable
                      token={localStorage.getItem('token') || ''}
                      onBack={() => {
                        setShowAdminTable(false);
                        const token = localStorage.getItem('token');
                        if (token) fetchStats(token);
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in-up">
                    {/* Stats cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                      {/* Total Incidencias */}
                      <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
                        <div className="flex items-start justify-between mb-5">
                          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-blue-400 bg-blue-500/8 border border-blue-500/15 px-2 py-1 rounded-lg">
                            Total
                          </span>
                        </div>
                        <p className="text-5xl font-bold text-white mb-1.5 tabular-nums">{stats?.total || 0}</p>
                        <p className="text-slate-400 text-sm font-medium">Incidencias registradas</p>
                      </div>

                      {/* Críticas */}
                      <div
                        className={`glass-card rounded-2xl p-6 animate-fade-in-up animate-delay-1 ${criticalTickets > 0 ? 'animate-glow-pulse-red' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-5">
                          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-red-400 bg-red-500/8 border border-red-500/15 px-2 py-1 rounded-lg">
                            Urgente
                          </span>
                        </div>
                        <p className={`text-5xl font-bold mb-1.5 tabular-nums ${criticalTickets > 0 ? 'text-red-400' : 'text-white'}`}>
                          {criticalTickets}
                        </p>
                        <p className="text-slate-400 text-sm font-medium">Atención Urgente (Críticas)</p>
                      </div>

                      {/* Administrar */}
                      <div className="glass-card rounded-2xl p-6 flex flex-col animate-fade-in-up animate-delay-2">
                        <div className="flex items-start justify-between mb-5">
                          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm mb-5 flex-1">
                          Centro de mando — gestiona y actualiza el estado de cada incidencia.
                        </p>
                        <button
                          onClick={() => setShowAdminTable(true)}
                          className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          + Administrar Tickets
                        </button>
                      </div>
                    </div>

                    {/* Distribution charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                      {/* Category */}
                      <div className="glass-card rounded-2xl p-6 animate-fade-in-up animate-delay-2">
                        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-400 to-cyan-400 inline-block" />
                          Tickets por Categoría
                        </h2>
                        <div className="space-y-4">
                          {stats?.categoryDistribution?.map((cat, i) => {
                            const total = stats.total || 1;
                            const pct = Math.round((cat.value / total) * 100);
                            const gradients = [
                              'linear-gradient(90deg, #3b82f6, #06b6d4)',
                              'linear-gradient(90deg, #8b5cf6, #ec4899)',
                              'linear-gradient(90deg, #f59e0b, #ef4444)',
                              'linear-gradient(90deg, #22c55e, #06b6d4)',
                            ];
                            return (
                              <div key={i}>
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-sm text-slate-300 font-medium">{cat.label}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{pct}%</span>
                                    <span className="text-sm font-bold text-white tabular-nums">{cat.value}</span>
                                  </div>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${pct}%`, background: gradients[i % gradients.length] }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          {(!stats?.categoryDistribution || stats.categoryDistribution.length === 0) && (
                            <p className="text-slate-500 text-sm italic">No hay datos aún.</p>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      {stats?.statusDistribution && stats.statusDistribution.length > 0 && (
                        <div className="glass-card rounded-2xl p-6 animate-fade-in-up animate-delay-3">
                          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-400 to-pink-400 inline-block" />
                            Estado de Tickets
                          </h2>
                          <div className="space-y-4">
                            {stats.statusDistribution.map((s, i) => {
                              const total = stats.total || 1;
                              const pct = Math.round((s.value / total) * 100);
                              const colors: Record<string, { bar: string; dot: string }> = {
                                OPEN: { bar: '#eab308', dot: 'rgba(234,179,8,0.6)' },
                                IN_PROGRESS: { bar: '#3b82f6', dot: 'rgba(59,130,246,0.6)' },
                                RESOLVED: { bar: '#22c55e', dot: 'rgba(34,197,94,0.6)' },
                              };
                              const c = colors[s.label] ?? { bar: '#64748b', dot: 'rgba(100,116,139,0.6)' };
                              return (
                                <div key={i}>
                                  <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ background: c.bar, boxShadow: `0 0 8px ${c.dot}` }}
                                      />
                                      <span className="text-sm text-slate-300 font-medium">
                                        {s.label === 'OPEN' ? 'Abierto' : s.label === 'IN_PROGRESS' ? 'En Progreso' : 'Resuelto'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-500">{pct}%</span>
                                      <span className="text-sm font-bold text-white tabular-nums">{s.value}</span>
                                    </div>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-1000"
                                      style={{ width: `${pct}%`, background: c.bar }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}