import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearMonedaCompacto } from '../functions/formatters';
import { useRestaurant } from '../contexts/RestaurantContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    const precio = d.payload?.precio ?? d.value;
    return (
      <div className="bg-white border border-warm-gray/20 rounded-lg px-3 py-2 shadow-md text-sm">
        <p className="text-warm-gray text-xs">{label}</p>
        <p className="font-bold text-ink">{formatearMonedaCompacto(precio)}</p>
      </div>
    );
  }
  return null;
};

function fechaKey(f) {
  return f instanceof Date ? f.toISOString().slice(0, 10) : String(f).slice(0, 10);
}

function deduplicarPorFecha(arr) {
  const map = new Map();
  for (const item of arr) {
    const key = `${fechaKey(item.fecha)}|${item.proveedor_id || ''}`;
    const existing = map.get(key);
    if (!existing || new Date(item.creado_en) > new Date(existing.creado_en)) {
      map.set(key, item);
    }
  }
  return [...map.values()].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

function mapearPuntos(arr) {
  const formatearFecha = (f) => {
    if (!f) return '';
    if (typeof f === 'string') return format(parseISO(f), 'dd MMM', { locale: es });
    return format(f, 'dd MMM', { locale: es });
  };
  return arr.map((h) => ({
    fecha: formatearFecha(h.fecha),
    precio: h.precio,
    ts: h.creado_en,
  }));
}

export default function PrecioEvolucion({ ingredienteId, onClose }) {
  const { restauranteId } = useRestaurant();
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingrediente, setIngrediente] = useState(null);

  useEffect(() => {
    if (!restauranteId) return;
    const fetch = async () => {
      const { data: ing, error: errIng } = await supabase
        .from('ingredientes')
        .select('nombre, precio_actual, unidad_medida, restaurante_id')
        .eq('id', ingredienteId)
        .single();
      if (errIng) console.error('PrecioEvolucion: error ingrediente', errIng);
      if (ing) setIngrediente(ing);

      const rId = ing?.restaurante_id || restauranteId;
      const { data: hist, error: errHist } = await supabase
        .from('precios_historicos')
        .select('precio, fecha, creado_en, proveedor_id')
        .eq('ingrediente_id', ingredienteId)
        .eq('restaurante_id', rId)
        .order('fecha', { ascending: true });
      if (errHist) console.error('PrecioEvolucion: error historico', errHist);

      if (hist && hist.length > 0) {
        setDatos(mapearPuntos(deduplicarPorFecha(hist)));
        setLoading(false);
        return;
      }

      if (rId) {
        let histAll, errAll;
        ({ data: histAll, error: errAll } = await supabase
          .from('precios_historicos')
          .select('precio, fecha, creado_en, proveedor_id')
          .eq('ingrediente_id', ingredienteId)
          .order('fecha', { ascending: true }));
        if (errAll) console.error('PrecioEvolucion: error historico (fallback)', errAll);

        if (!histAll?.length) {
          ({ data: histAll, error: errAll } = await supabase
            .from('precios_historicos')
            .select('precio_anterior, creado_en, proveedor_id')
            .eq('ingrediente_id', ingredienteId)
            .order('creado_en', { ascending: true }));
          if (errAll) console.error('PrecioEvolucion: error columnas alternativas', errAll);

          if (histAll?.length) {
            const deduped = deduplicarPorFecha(
              histAll.map((h) => ({ ...h, fecha: h.creado_en }))
            );
            setDatos(mapearPuntos(deduped));
            setLoading(false);
            return;
          }
        }

        if (histAll?.length) {
          setDatos(mapearPuntos(deduplicarPorFecha(histAll)));
          setLoading(false);
          return;
        }
      }

      setDatos([]);
      setLoading(false);
    };
    fetch();
  }, [ingredienteId, restauranteId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold text-ink">{ingrediente?.nombre || 'Cargando...'}</h4>
          {ingrediente && (
            <p className="text-xs text-warm-gray">
              Precio actual: {formatearMonedaCompacto(ingrediente.precio_actual)} / {ingrediente.unidad_medida}
            </p>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-full hover:bg-warm-gray/10 transition-colors">
            <svg className="h-5 w-5 text-warm-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
        </div>
      ) : datos.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-ink-soft text-sm">
          {ingrediente
            ? 'Aún no hay datos históricos. Los cambios de precio se guardarán automáticamente.'
            : 'Ingrediente no encontrado.'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={datos} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
            <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#8c8276' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#8c8276' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v.toFixed(2)}€`}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="precio"
              stroke="#c2512b"
              strokeWidth={2}
              dot={{ fill: '#c2512b', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: '#c2512b' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
