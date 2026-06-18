// src/Onboarding.jsx
import { useState } from 'react';
import { supabase } from './supabaseClient';
import { ChefHat, ArrowRight, Loader2 } from 'lucide-react';

const TIPOS_COCINA = [
  'Mediterránea', 'Española', 'Italiana', 'Asiática',
  'Mexicana', 'Americana', 'Fast casual', 'Fusión', 'Otra',
];

export default function Onboarding({ userId, onComplete }) {
  const [nombre, setNombre] = useState('');
  const [tipoCocina, setTipoCocina] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from('restaurantes')
      .insert([{
        owner_id: userId,
        nombre: nombre.trim(),
        tipo_cocina: tipoCocina || null,
        pais: 'ES',
        moneda: 'EUR',
      }])
      .select()
      .single();

    if (error) {
      setError('No se pudo crear el restaurante. Inténtalo de nuevo.');
      setSaving(false);
      return;
    }

    onComplete(data);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      {/* Fondo con el mismo gradiente del auth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at top, rgba(231,111,81,0.08), transparent 55%),
            radial-gradient(ellipse at bottom, rgba(96,108,56,0.07), transparent 55%)
          `
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="login-card">
          {/* Icono */}
          <div className="flex justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-terracotta shadow-[0_6px_16px_-6px_rgba(231,111,81,0.6)]">
              <ChefHat className="h-7 w-7 text-white" />
            </div>
          </div>

          <h2 style={{ marginBottom: '0.5rem' }}>Bienvenido a Costea</h2>
          <p className="text-center text-sm mb-6" style={{ color: 'var(--color-ink-soft)' }}>
            Cuéntanos un poco sobre tu restaurante para empezar.
          </p>

          {error && (
            <p className="error" style={{ marginBottom: '1rem' }}>{error}</p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="nombre"
                className="text-sm font-medium"
                style={{ color: 'var(--color-ink)' }}
              >
                Nombre del restaurante *
              </label>
              <input
                id="nombre"
                type="text"
                className="input-base"
                placeholder="Ej: Casa Pepe, El Rincón de María..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoFocus
                maxLength={80}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tipo"
                className="text-sm font-medium"
                style={{ color: 'var(--color-ink)' }}
              >
                Tipo de cocina
                <span className="ml-1 font-normal" style={{ color: 'var(--color-warm-gray)' }}>
                  (opcional)
                </span>
              </label>
              <select
                id="tipo"
                className="input-base"
                value={tipoCocina}
                onChange={(e) => setTipoCocina(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Selecciona...</option>
                {TIPOS_COCINA.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving || !nombre.trim()}
              className="btn-primary mt-2"
              style={{ borderRadius: '9999px' }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  Empezar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Pie */}
        <p className="text-center text-xs mt-4" style={{ color: 'var(--color-warm-gray)' }}>
          Puedes añadir más locales desde ajustes en cualquier momento.
        </p>
      </div>
    </div>
  );
}
