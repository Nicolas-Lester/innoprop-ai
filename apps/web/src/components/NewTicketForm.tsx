// apps/web/src/components/NewTicketForm.tsx
'use client';

import { useState, useRef } from 'react';

interface NewTicketFormProps {
  onTicketCreated: () => void;
  onCancel: () => void;
}

export default function NewTicketForm({ onTicketCreated, onCancel }: NewTicketFormProps) {
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setError('Por favor, selecciona una imagen válida (JPG, PNG, WEBP).');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }

    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('description', description);
    if (image) {
      formData.append('image', image);
    }

    try {
      // Usamos el endpoint v2 (el que tiene soporte para imágenes y Gemini Flash)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ticket/analyze-v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // ¡NO pongas Content-Type aquí! El navegador lo configura automáticamente para FormData
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar el ticket');
      }

      // Si todo sale bien, avisamos al padre para que cierre el form y actualice datos
      onTicketCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-card rounded-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div
          className="px-8 py-6 border-b border-slate-800/60 flex justify-between items-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(139,92,246,0.06) 60%, rgba(15,23,42,0.92) 100%)' }}
        >
          <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Reportar Nuevo Problema</h2>
            </div>
            <p className="text-slate-500 text-xs ml-10">La IA analizará tu reporte y lo clasificará automáticamente</p>
          </div>
          <button
            onClick={onCancel}
            className="relative p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200 border border-slate-700/50 hover:border-slate-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Describe el problema con detalle *
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 input-glow transition-all duration-200 resize-none text-sm leading-relaxed"
              placeholder="Ej: Hay una filtración de agua en el techo del baño principal que empezó ayer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-slate-600 text-xs mt-1.5 text-right">{description.length} caracteres</p>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Adjuntar fotografía{' '}
              <span className="text-slate-600 normal-case font-normal">(Opcional, pero recomendado)</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
            />

            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700/60 hover:border-blue-500/50 rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 bg-slate-900/40 hover:bg-blue-500/4 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-2xl mx-auto mb-4 group-hover:border-blue-500/30 group-hover:bg-blue-500/8 transition-all duration-300">
                  📸
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Haz clic para subir o arrastra una imagen aquí</p>
                <p className="text-slate-600 text-xs">Soporta JPG, PNG, WEBP (Máx 5MB)</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 group inline-block w-full">
                <img src={preview} alt="Preview" className="w-full h-52 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700/50">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Imagen lista
                  </div>
                  <button
                    type="button"
                    onClick={() => { setImage(null); setPreview(null); }}
                    className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-all duration-200 backdrop-blur-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2.5 animate-fade-in">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-sm"
          >
            {loading ? (
              <>
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-bold">Gemini IA está analizando tu reporte...</span>
                  <span className="text-white/70 text-xs font-normal">Detectando categoría y prioridad</span>
                </div>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Enviar Reporte
              </>
            )}
          </button>

          {/* AI disclaimer */}
          <p className="text-center text-slate-600 text-xs flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Analizado por Gemini Vision AI · Clasificación automática en segundos
          </p>
        </form>
      </div>
    </div>
  );
}