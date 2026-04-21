'use client'; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciales inválidas');
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_role', data.role || 'TENANT');
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh bg-grid flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/5 w-80 h-80 bg-blue-600/6 rounded-full blur-3xl pointer-events-none animate-float" />
      <div
        className="absolute bottom-1/4 right-1/5 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none animate-float"
        style={{ animationDelay: '1.5s' }}
      />
      <div
        className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-600/4 rounded-full blur-3xl pointer-events-none animate-float"
        style={{ animationDelay: '0.8s' }}
      />

      <div className="w-full max-w-md animate-scale-in relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-5 animate-glow-pulse-blue">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2 tracking-tight">InnoProp AI</h1>
          <p className="text-slate-500 text-sm">Ingresa para gestionar tus propiedades</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          {/* Feature pills */}
          <div className="flex items-center justify-center gap-3 mb-7 flex-wrap">
            {['IA Multimodal', 'Triage Automático', 'Tiempo Real'].map((feat) => (
              <span key={feat} className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/40 px-3 py-1 rounded-full">
                {feat}
              </span>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 input-glow transition-all duration-200 text-sm"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 input-glow transition-all duration-200 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3.5 bg-red-500/8 border border-red-500/25 rounded-xl text-red-400 text-sm text-center animate-fade-in flex items-center justify-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 px-4 flex items-center justify-center gap-2.5 text-sm mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Validando credenciales...
                </>
              ) : (
                <>
                  Entrar al Sistema
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Plataforma SaaS de Gestión Inmobiliaria con IA · InnoProp AI
        </p>
      </div>
    </div>
  );
}