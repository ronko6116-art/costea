import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function formatoCompacto(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(value);
}

export default function AlertasPrecio({ restauranteId }) {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restauranteId) return;

    const fetchAlertas = async () => {
      const hace30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('precios_historicos')
        .select(`
          ingrediente_id,
          precio_anterior,
          precio_nuevo,
          creado_en,
          ingrediente:ingrediente_id (nombre, unidad_medida)
        `)
        .gte('creado_en', hace30dias)
        .order('creado_en', { ascending: false });
      if (error) console.error('AlertasPrecio: error', error);

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      const porIngrediente = {};
      data.forEach((h) => {
        const id = h.ingrediente_id;
        if (!porIngrediente[id]) {
          porIngrediente[id] = {
            id,
            nombre: h.ingrediente?.nombre || 'Desconocido',
            unidad: h.ingrediente?.unidad_medida || 'u',
            cambios: [],
          };
        }
        if (porIngrediente[id].cambios.length < 3) {
          porIngrediente[id].cambios.push({
            anterior: h.precio_anterior,
            nuevo: h.precio_nuevo,
            fecha: h.creado_en,
          });
        }
      });

      const conVariacion = Object.values(porIngrediente).map((ing) => {
        const primerPrecio = ing.cambios[ing.cambios.length - 1]?.anterior ?? ing.cambios[0]?.nuevo;
        const ultimoPrecio = ing.cambios[0]?.nuevo ?? primerPrecio;
        const variacion = ultimoPrecio - primerPrecio;
        const variacionPct = primerPrecio > 0 ? ((variacion / primerPrecio) * 100) : 0;
        return { ...ing, primerPrecio, ultimoPrecio, variacion, variacionPct };
      });

      conVariacion.sort((a, b) => Math.abs(b.variacionPct) - Math.abs(a.variacionPct));

      setAlertas(conVariacion.slice(0, 8));
      setLoading(false);
    };

    fetchAlertas();
  }, [restauranteId]);

  if (loading) return null;

  if (alertas.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5 text-terracotta" />
        <h3 className="font-bold text-ink text-sm">Evolución de precios (últimos 30 días)</h3>
      </div>

      <div className="space-y-2">
        {alertas.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-warm-gray/5 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink text-sm truncate">{a.nombre}</p>
              <p className="text-xs text-warm-gray">
                {formatoCompacto(a.primerPrecio)} → {formatoCompacto(a.ultimoPrecio)} / {a.unidad}
              </p>
            </div>
            <div className="flex items-center gap-1.5 ml-3 shrink-0">
              {a.variacionPct > 1 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : a.variacionPct < -1 ? (
                <TrendingDown className="h-4 w-4 text-olive-dark" />
              ) : (
                <Minus className="h-4 w-4 text-warm-gray" />
              )}
              <span
                className={`text-sm font-semibold ${
                  a.variacionPct > 1 ? 'text-red-500'
                    : a.variacionPct < -1 ? 'text-olive-dark'
                    : 'text-warm-gray'
                }`}
              >
                {a.variacionPct > 0 ? '+' : ''}{a.variacionPct.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
