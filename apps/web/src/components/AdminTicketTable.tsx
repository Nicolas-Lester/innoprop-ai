'use client';

import { useState, useEffect } from 'react';

interface Ticket {
  id: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  aiSummary: string;
  createdAt: string;
  imageUrl?: string | null; // <--- Agregamos imageUrl a la interfaz
}

interface AdminTicketTableProps {
  token: string;
  onBack: () => void;
}

export default function AdminTicketTable({ token, onBack }: AdminTicketTableProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al cargar la lista de tickets');
      
      const json = await response.json();
      const ticketArray = json.data || json || [];
      setTickets(ticketArray);
    } catch (err: any) {
      setError(err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Error al actualizar el estado');
      
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/15" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
        </div>
        <p className="text-slate-400 text-sm animate-pulse">Cargando base de datos...</p>
      </div>
    </div>
  );

  return (
    <div className="glass-card rounded-2xl overflow-hidden w-full animate-fade-in-up">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800/60 flex justify-between items-center"
        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.07) 0%, rgba(15,23,42,0.9) 100%)' }}>
        <div>
          <h2 className="text-xl font-bold text-white">Gestión de Incidencias</h2>
          <p className="text-slate-500 text-sm mt-0.5">Administra y actualiza el estado de los tickets de los residentes.</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all duration-200 text-xs font-semibold border border-slate-700/50 hover:border-slate-600 flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Resumen
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800/60" style={{ background: 'rgba(15,23,42,0.5)' }}>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría / Prioridad</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Evidencia y Análisis IA</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-48">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {tickets?.map((ticket, idx) => {
              const priorityClass =
                ticket.priority === 'CRITICA' ? 'badge-critica' :
                ticket.priority === 'ALTA' ? 'badge-alta' :
                ticket.priority === 'MEDIA' ? 'badge-media' : 'badge-baja';

              return (
                <tr
                  key={ticket.id}
                  className="transition-colors duration-150 hover:bg-slate-800/20 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.04}s`, animationFillMode: 'both' }}
                >
                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-slate-300 text-sm font-medium">
                      {new Date(ticket.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-slate-600 text-xs mt-0.5">
                      {new Date(ticket.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>

                  {/* Category / Priority */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <span className="font-bold text-slate-200 text-sm">{ticket.category}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg w-fit ${priorityClass}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </td>

                  {/* Evidence + AI */}
                  <td className="px-6 py-4 max-w-sm">
                    <div className="flex gap-4 items-start">
                      {ticket.imageUrl && (
                        <div
                          className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700/50 bg-slate-800 cursor-pointer group relative"
                          onClick={() => window.open(ticket.imageUrl || '', '_blank')}
                        >
                          <img
                            src={ticket.imageUrl}
                            alt="Evidencia"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/15 transition-colors duration-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-sm mb-1.5 truncate font-medium" title={ticket.description}>
                          "{ticket.description}"
                        </p>
                        <p className="text-xs text-blue-400 leading-relaxed line-clamp-2 flex items-start gap-1.5">
                          <span className="flex-shrink-0 mt-px">🤖</span>
                          {ticket.aiSummary}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Status Select */}
                  <td className="px-6 py-4">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      className={`text-xs rounded-xl block w-full p-2.5 border font-bold outline-none transition-all duration-200 cursor-pointer ${
                        ticket.status === 'OPEN'
                          ? 'bg-slate-800/60 border-slate-600/50 text-slate-200 focus:border-slate-500'
                          : ticket.status === 'IN_PROGRESS'
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 focus:border-yellow-500/50'
                          : 'bg-green-500/10 border-green-500/30 text-green-400 focus:border-green-500/50'
                      }`}
                      style={{ focusRingColor: 'transparent' }}
                    >
                      <option value="OPEN" className="bg-slate-900 text-white font-normal">Abierto (OPEN)</option>
                      <option value="IN_PROGRESS" className="bg-slate-900 text-yellow-400 font-normal">En Progreso</option>
                      <option value="RESOLVED" className="bg-slate-900 text-green-400 font-normal">Resuelto</option>
                    </select>
                  </td>
                </tr>
              );
            })}

            {tickets?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <svg className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">No hay tickets registrados en el sistema.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}