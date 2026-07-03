import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearMonedaCompacto } from '../functions/formatters';
import { useRestaurant } from '../contexts/RestaurantContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-warm-gray/20 rounded-lg px-3 py-2 shadow-md text-sm">
        <p className="text-warm-gray text-xs">{label}</p>
        <p className="font-bold text-ink">{formatearMonedaCompacto(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function PrecioEvolucion({ ingredienteId, onClose }) {
  const { restauranteId } = useRestaurant();
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingrediente, setIngrediente] = useState(null);

  useEffect(() => {
    if (!restauranteId) return;
    const fetch = async () => {
      console.log('PrecioEvolucion: ingredienteId=', ingredienteId, 'restauranteId=', restauranteId);
      
      const { data: ing, error: errIng } = await supabase
        .from('ingredientes')
        .select('nombre, precio_actual, unidad_medida, restaurante_id')
        .eq('id', ingredienteId)
        .single();
      if (errIng) console.error('PrecioEvolucion: error ingrediente', errIng);
      if (ing) {
        setIngrediente(ing);
      }

      console.log('PrecioEvolucion: ingrediente restaurante_id=', ing?.restaurante_id, 'fallback restauranteId=', restauranteId);

      const rId = ing?.restaurante_id || restauranteId;
      const { data: hist, error: errHist } = await supabase
        .from('precios_historicos')
        .select('precio, fecha, creado_en')
        .eq('ingrediente_id', ingredienteId)
        .eq('restaurante_id', rId)
        .order('fecha', { ascending: true });
      if (errHist) console.error('PrecioEvolucion: error historico', errHist);

      console.log('PrecioEvolucion: hist query restaurante_id=', rId, 'rows=', hist?.length);

      if (hist && hist.length > 0) {
        const puntos = hist.map((h) => ({
          fecha: format(parseISO(h.fecha), 'dd MMM', { locale: es }),
          precio: h.precio,
          ts: h.creado_en,
        }));
        setDatos(puntos);
        setLoading(false);
        return;
      }

      // Fallback: intentar sin filtrar por restaurante (ingredientes viejos sin restaurante_id)
      if (rId) {
        console.log('PrecioEvolucion: fallback sin restaurante_id');
        let histAll, errAll;
        ({ data: histAll, error: errAll } = await supabase
          .from('precios_historicos')
          .select('precio, fecha, creado_en')
          .eq('ingrediente_id', ingredienteId)
          .order('fecha', { ascending: true }));
        if (errAll) console.error('PrecioEvolucion: error historico (fallback)', errAll);

        if (!histAll?.length) {
          // Fallback 3: columnas alternativas (precio_anterior como precio, creado_en como fecha)
          console.log('PrecioEvolucion: fallback con columnas alternativas');
          ({ data: histAll, error: errAll } = await supabase
            .from('precios_historicos')
            .select('precio_anterior, creado_en')
            .eq('ingrediente_id', ingredienteId)
            .order('creado_en', { ascending: true }));
          if (errAll) console.error('PrecioEvolucion: error columnas alternativas', errAll);

          if (histAll?.length) {
            const puntos = histAll.map((h) => ({
              fecha: format(parseISO(h.creado_en), 'dd MMM', { locale: es }),
              precio: h.precio_anterior,
              ts: h.creado_en,
            }));
            setDatos(puntos);
            setLoading(false);
            return;
          }
        }

        if (histAll?.length) {
          const puntos = histAll.map((h) => ({
            fecha: format(parseISO(h.fecha), 'dd MMM', { locale: es }),
            precio: h.precio,
            ts: h.creado_en,
          }));
          setDatos(puntos);
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
