import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react';
import { formatearMonedaCompacto } from '../functions/formatters';
import { deduplicarPorFecha, fechaKey } from '../helpers/precios';

export default function AlertasPrecio({ restauranteId }) {
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!restauranteId) return;

    const fetchData = async () => {
      const hace30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: hist, error } = await supabase
        .from('precios_historicos')
        .select(`
          ingrediente_id,
          precio,
          fecha,
          creado_en,
          proveedor_id,
          ingrediente:ingrediente_id (nombre, unidad_medida)
        `)
        .eq('restaurante_id', restauranteId)
        .gte('fecha', hace30dias)
        .order('fecha', { ascending: true });
      if (error) console.error('AlertasPrecio: error', error);

      if (!hist || hist.length === 0) {
        setLoading(false);
        return;
      }

      const deduped = deduplicarPorFecha(hist, (h) => `${h.ingrediente_id}|${fechaKey(h.fecha)}|${h.proveedor_id || ''}`);

      const porIngrediente = {};
      deduped.forEach((h) => {
        const id = h.ingrediente_id;
        if (!porIngrediente[id]) {
          porIngrediente[id] = {
            id,
            nombre: h.ingrediente?.nombre || 'Desconocido',
            unidad: h.ingrediente?.unidad_medida || 'u',
            precios: [],
          };
        }
        porIngrediente[id].precios.push(h.precio);
      });

      const resultado = Object.values(porIngrediente).map((ing) => {
        const precios = ing.precios;
        const suma = precios.reduce((a, b) => a + b, 0);
        const media = suma / precios.length;
        const ultimo = precios[precios.length - 1];
        const dif = ultimo - media;
        return { ...ing, media, ultimo, dif };
      });

      resultado.sort((a, b) => Math.abs(b.dif) - Math.abs(a.dif));
      setIngredientes(resultado);
      setLoading(false);
    };

    fetchData();
  }, [restauranteId]);

  if (loading || ingredientes.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-warm-gray/10 shadow-sm mb-6">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between px-5 py-3"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-terracotta" />
          <h3 className="font-bold text-ink text-sm">Evolución de precios (últimos 30 días)</h3>
        </div>
        <ChevronDown className={`h-5 w-5 text-warm-gray transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <div className="px-5 pb-3 space-y-2">
          {ingredientes.map((ing) => {
            const flecha = ing.dif > 0.01
              ? <TrendingUp className="h-4 w-4 text-red-500" />
              : ing.dif < -0.01
              ? <TrendingDown className="h-4 w-4 text-olive-dark" />
              : <Minus className="h-4 w-4 text-warm-gray" />;

            return (
              <div key={ing.id} className="flex items-center justify-between py-1.5 border-b border-warm-gray/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink text-sm truncate">{ing.nombre}</p>
                  <p className="text-xs text-warm-gray">
                    Media: {formatearMonedaCompacto(ing.media)} / {ing.unidad}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 ml-3 shrink-0">
                  {flecha}
                  <span className="text-sm font-semibold text-ink">
                    {formatearMonedaCompacto(ing.ultimo)}
                  </span>
                  <span className="text-[10px] text-warm-gray">/ {ing.unidad}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
