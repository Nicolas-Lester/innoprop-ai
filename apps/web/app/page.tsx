export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold text-blue-500">InnoProp AI Dashboard</h1>
      <p className="text-slate-400 mt-2">Conectando con el backend...</p>
      
      {/* Aquí irán nuestras Stats Cards pronto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400">Tickets Totales</p>
          <h2 className="text-3xl font-bold">--</h2>
        </div>
      </div>
    </main>
  );
}