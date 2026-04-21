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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Reportar Nuevo Problema</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
          ✕ Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Describe el problema con detalle *
          </label>
          <textarea
            required
            rows={4}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            placeholder="Ej: Hay una filtración de agua en el techo del baño principal que empezó ayer..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Zona de Subida de Imagen */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Adjuntar fotografía (Opcional, pero recomendado)
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
              className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors bg-slate-800/50"
            >
              <span className="text-4xl mb-3 block">📸</span>
              <p className="text-slate-400 text-sm">Haz clic para subir o arrastra una imagen aquí</p>
              <p className="text-slate-500 text-xs mt-1">Soporta JPG, PNG, WEBP (Max 5MB)</p>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-slate-700 group inline-block">
              <img src={preview} alt="Preview" className="h-48 object-cover" />
              <button
                type="button"
                onClick={() => { setImage(null); setPreview(null); }}
                className="absolute top-2 right-2 bg-red-600 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        {/* Botón de Enviar */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Gemini IA está analizando tu reporte...</span>
            </>
          ) : (
            'Enviar Reporte'
          )}
        </button>
      </form>
    </div>
  );
}