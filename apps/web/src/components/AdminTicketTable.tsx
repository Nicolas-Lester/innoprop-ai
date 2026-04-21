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
      
      // EL PARACAÍDAS: Evaluamos cómo viene la respuesta.
      // Si viene como { data: [...] }, usamos json.data
      // Si viene directamente como un Array [...], usamos json
      // Si algo falla y no es ninguna, ponemos un array vacío []
      const ticketArray = json.data || json || [];
      setTickets(ticketArray);

    } catch (err: any) {
      setError(err.message);
      setTickets([]); // Si hay error, vaciamos la tabla para que no explote
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
      
      // Actualizamos la tabla localmente sin tener que recargar toda la página
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-blue-500 animate-pulse p-8 text-center">Cargando base de datos...</div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl w-full animate-fade-in-up">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Incidencias</h2>
          <p className="text-slate-400 text-sm">Administra y actualiza el estado de los tickets de los residentes.</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-semibold">
          ← Volver al Resumen
        </button>
      </div>

      {error && <div className="text-red-500 mb-4 bg-red-500/10 p-3 rounded-lg">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Fecha</th>
              <th className="px-4 py-3">Categoría / Prioridad</th>
              <th className="px-4 py-3">Descripción y Análisis IA</th>
              <th className="px-4 py-3 rounded-tr-lg w-48">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tickets?.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-200">{ticket.category}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded w-max ${
                      ticket.priority === 'CRITICA' ? 'bg-red-500/20 text-red-500' : 
                      ticket.priority === 'ALTA' ? 'bg-orange-500/20 text-orange-500' : 
                      'bg-green-500/20 text-green-500'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 max-w-md">
                  <p className="text-slate-200 mb-1 truncate" title={ticket.description}>"{ticket.description}"</p>
                  <p className="text-xs text-blue-400 line-clamp-2">🤖 {ticket.aiSummary}</p>
                </td>
                <td className="px-4 py-4">
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                    className={`text-sm rounded-lg block w-full p-2 border font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                      ticket.status === 'OPEN' ? 'bg-slate-800 border-slate-600 text-white' :
                      ticket.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                      'bg-green-500/10 border-green-500/30 text-green-500'
                    }`}
                  >
                    <option value="OPEN" className="bg-slate-900 text-white">Abierto (OPEN)</option>
                    <option value="IN_PROGRESS" className="bg-slate-900 text-yellow-500">En Progreso</option>
                    <option value="RESOLVED" className="bg-slate-900 text-green-500">Resuelto</option>
                  </select>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No hay tickets registrados en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}