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

// ── Category visual helpers ──────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { gradient: string; iconColor: string }> = {
  GASFITERIA: {
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.30) 0%, rgba(14,165,233,0.14) 55%, rgba(10,15,30,0.97) 100%)',
    iconColor: '#22d3ee',
  },
  ESTRUCTURA: {
    gradient: 'linear-gradient(135deg, rgba(249,115,22,0.30) 0%, rgba(234,88,12,0.14) 55%, rgba(10,15,30,0.97) 100%)',
    iconColor: '#fb923c',
  },
  ELECTRICIDAD: {
    gradient: 'linear-gradient(135deg, rgba(234,179,8,0.30) 0%, rgba(202,138,4,0.14) 55%, rgba(10,15,30,0.97) 100%)',
    iconColor: '#facc15',
  },
  PLOMERIA: {
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.30) 0%, rgba(37,99,235,0.14) 55%, rgba(10,15,30,0.97) 100%)',
    iconColor: '#60a5fa',
  },
};
const DEFAULT_CATEGORY_STYLE = {
  gradient: 'linear-gradient(135deg, rgba(139,92,246,0.28) 0%, rgba(109,40,217,0.12) 55%, rgba(10,15,30,0.97) 100%)',
  iconColor: '#a78bfa',
};

function CategoryIcon({ category, color }: { category: string; color: string }) {
  if (category === 'GASFITERIA' || category === 'PLOMERIA') {
    return (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2c-1.5 0-3 .8-4 2-1.5 1.8-1.5 4.2 0 6L9 12v6h6v-6l1-2c1.5-1.8 1.5-4.2 0-6-1-1.2-2.5-2-4-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6M9 21h6" />
      </svg>
    );
  }
  if (category === 'ESTRUCTURA') {
    return (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  }
  if (category === 'ELECTRICIDAD') {
    return (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  // default wrench
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string; glow: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 54;
  const cx = 76, cy = 76;
  const circ = 2 * Math.PI * r;
  let running = 0;
  const segs = data.map(d => {
    const len = (d.value / total) * circ;
    const seg = { ...d, len, start: running };
    running += len;
    return seg;
  });

  return (
    <svg width="152" height="152" viewBox="0 0 152 152" style={{ flexShrink: 0 }}>
      <g transform="rotate(-90 76 76)">
        {segs.map((seg, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={22}
            strokeDasharray={`${seg.len} ${circ}`}
            strokeDashoffset={-seg.start}
            style={{ filter: `drop-shadow(0 0 6px ${seg.glow})` }}
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={40} fill="#080d1a" />
      <text x={cx} y={cy - 7} textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="system-ui,sans-serif">{total}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="#475569" fontSize="9" letterSpacing="1" fontFamily="system-ui,sans-serif">TICKETS</text>
    </svg>
  );
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
                          {/* Image or Category Hero Placeholder */}
                          {ticket.imageUrl ? (
                            <div className="relative w-full h-40 overflow-hidden bg-slate-900/50 flex-shrink-0">
                              <img
                                src={ticket.imageUrl}
                                alt="Evidencia"
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                              <div className="absolute top-3 right-3">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${priorityClass}`}>
                                  {ticket.priority}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="relative w-full h-40 flex-shrink-0 flex items-center justify-center overflow-hidden"
                              style={{ background: (CATEGORY_STYLES[ticket.category] ?? DEFAULT_CATEGORY_STYLE).gradient }}
                            >
                              <div className="absolute inset-0 bg-grid opacity-25 pointer-events-none" />
                              <div
                                className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full opacity-20"
                                style={{
                                  background: (CATEGORY_STYLES[ticket.category] ?? DEFAULT_CATEGORY_STYLE).iconColor,
                                  filter: 'blur(36px)',
                                }}
                              />
                              <div className="relative z-10 flex flex-col items-center gap-2.5">
                                <div className="w-14 h-14 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                                  <CategoryIcon
                                    category={ticket.category}
                                    color={(CATEGORY_STYLES[ticket.category] ?? DEFAULT_CATEGORY_STYLE).iconColor}
                                  />
                                </div>
                                <span className="text-xs font-medium text-white/45 tracking-wide">Sin evidencia fotográfica</span>
                              </div>
                              <div className="absolute top-3 right-3">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${priorityClass}`}>
                                  {ticket.priority}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="p-5 flex flex-col flex-1">
                            {/* Category badge */}
                            <div className="mb-3">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/50">
                                {ticket.category}
                              </span>
                            </div>

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

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                      {/* ── Bar Chart: Category Distribution ── */}
                      <div className="glass-card rounded-2xl p-6 animate-fade-in-up animate-delay-2">
                        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-400 to-cyan-400 inline-block" />
                          Tickets por Categoría
                        </h2>
                        {stats?.categoryDistribution && stats.categoryDistribution.length > 0 ? (() => {
                          const cats = stats.categoryDistribution;
                          const maxVal = Math.max(...cats.map(c => c.value), 1);
                          const barW = 52;
                          const gapW = 20;
                          const chartH = 105;
                          const padL = 8;
                          const padB = 36;
                          const padT = 30;
                          const svgW = padL + cats.length * (barW + gapW) + gapW;
                          const svgH = chartH + padB + padT;
                          const palettes: [string, string][] = [
                            ['#3b82f6', '#06b6d4'],
                            ['#8b5cf6', '#ec4899'],
                            ['#f59e0b', '#ef4444'],
                            ['#22c55e', '#06b6d4'],
                            ['#f97316', '#a855f7'],
                          ];
                          return (
                            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ overflow: 'visible' }}>
                              <defs>
                                {cats.map((_, i) => (
                                  <linearGradient key={i} id={`bgrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={palettes[i % palettes.length]![0]} />
                                    <stop offset="100%" stopColor={palettes[i % palettes.length]![1]} stopOpacity="0.5" />
                                  </linearGradient>
                                ))}
                              </defs>
                              {/* horizontal grid lines */}
                              {[0, 50, 100].map(pct => {
                                const y = padT + chartH * (1 - pct / 100);
                                return <line key={pct} x1={padL} y1={y} x2={svgW} y2={y} stroke="#1e293b" strokeWidth="1" />;
                              })}
                              {/* bars */}
                              {cats.map((cat, i) => {
                                const barH = Math.max((cat.value / maxVal) * chartH, 4);
                                const x = padL + gapW + i * (barW + gapW);
                                const y = padT + chartH - barH;
                                const pct = Math.round((cat.value / (stats.total || 1)) * 100);
                                return (
                                  <g key={i}>
                                    {/* glow shadow */}
                                    <rect x={x + 6} y={y + 6} width={barW - 12} height={barH}
                                      rx="4" fill={palettes[i % palettes.length]![0]} opacity="0.18"
                                      style={{ filter: 'blur(8px)' }} />
                                    {/* bar */}
                                    <rect x={x} y={y} width={barW} height={barH} rx="7" fill={`url(#bgrad-${i})`} />
                                    {/* percentage */}
                                    <text x={x + barW / 2} y={y - 16} textAnchor="middle"
                                      fill={palettes[i % palettes.length]![0]} fontSize="9" fontFamily="system-ui,sans-serif">
                                      {pct}%
                                    </text>
                                    {/* value */}
                                    <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                                      fill="white" fontSize="14" fontWeight="bold" fontFamily="system-ui,sans-serif">
                                      {cat.value}
                                    </text>
                                    {/* label */}
                                    <text x={x + barW / 2} y={svgH - 5} textAnchor="middle"
                                      fill="#94a3b8" fontSize="9" fontFamily="system-ui,sans-serif">
                                      {cat.label.length > 9 ? cat.label.slice(0, 9) : cat.label}
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          );
                        })() : (
                          <p className="text-slate-500 text-sm italic">No hay datos aún.</p>
                        )}
                      </div>

                      {/* ── Donut Chart: Status Distribution ── */}
                      {stats?.statusDistribution && stats.statusDistribution.length > 0 && (
                        <div className="glass-card rounded-2xl p-6 animate-fade-in-up animate-delay-3">
                          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-400 to-pink-400 inline-block" />
                            Estado de Tickets
                          </h2>
                          {(() => {
                            const STATUS_META: Record<string, { color: string; glow: string; label: string }> = {
                              OPEN:        { color: '#eab308', glow: 'rgba(234,179,8,0.55)',  label: 'Abierto'     },
                              IN_PROGRESS: { color: '#3b82f6', glow: 'rgba(59,130,246,0.55)', label: 'En Progreso' },
                              RESOLVED:    { color: '#22c55e', glow: 'rgba(34,197,94,0.55)',  label: 'Resuelto'    },
                            };
                            const donutData = stats.statusDistribution.map(s => ({
                              ...s,
                              color: STATUS_META[s.label]?.color ?? '#64748b',
                              glow:  STATUS_META[s.label]?.glow  ?? 'rgba(100,116,139,0.4)',
                              displayLabel: STATUS_META[s.label]?.label ?? s.label,
                            }));
                            const tot = stats.total || 1;
                            return (
                              <div className="flex items-center gap-5">
                                <DonutChart data={donutData} />
                                <div className="flex-1 space-y-3">
                                  {donutData.map((d, i) => (
                                    <div key={i}>
                                      <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ background: d.color, boxShadow: `0 0 8px ${d.glow}` }}
                                          />
                                          <span className="text-sm text-slate-300">{d.displayLabel}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-slate-500">{Math.round((d.value / tot) * 100)}%</span>
                                          <span className="text-sm font-bold tabular-nums" style={{ color: d.color }}>{d.value}</span>
                                        </div>
                                      </div>
                                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full"
                                          style={{
                                            width: `${Math.round((d.value / tot) * 100)}%`,
                                            background: d.color,
                                            boxShadow: `0 0 6px ${d.glow}`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
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