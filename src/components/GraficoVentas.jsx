// src/GraficoVentas.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { formatearMoneda, formatearMonedaCompacto } from '../functions/formatters';
import { TrendingUp, Calendar } from 'lucide-react';

export default function GraficoVentas({ restauranteId }) {
  const [periodo, setPeriodo] = useState('semana'); // semana | mes
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restauranteId) return;
    setLoading(true);

    const hoy = new Date();
    let desde;
    if (periodo === 'semana') {
      desde = new Date(hoy);
      desde.setDate(desde.getDate() - 7);
    } else {
      desde = new Date(hoy);
      desde.setMonth(desde.getMonth() - 1);
    }

    const fetchData = async () => {
      const [ventasData, platosData] = await Promise.all([
        supabase
          .from('ventas_diarias')
          .select('fecha, cantidad, plato_id')
          .eq('restaurante_id', restauranteId)
          .gte('fecha', desde.toISOString().split('T')[0])
          .lte('fecha', hoy.toISOString().split('T')[0])
          .order('fecha', { ascending: true }),
        supabase
          .from('platos')
          .select('id, nombre, precio_venta')
          .eq('restaurante_id', restauranteId),
      ]);

      if (platosData.data && ventasData.data) {
        const platoMap = {};
        platosData.data.forEach(p => { platoMap[p.id] = p; });

        const conDetalle = ventasData.data.map(v => ({
          ...v,
          platoNombre: platoMap[v.plato_id]?.nombre || '?',
          precioVenta: platoMap[v.plato_id]?.precio_venta || 0,
          ingreso: (v.cantidad || 0) * (platoMap[v.plato_id]?.precio_venta || 0),
        }));
        setVentas(conDetalle);
      }
      setLoading(false);
    };

    fetchData();
  }, [restauranteId, periodo]);

  // Agrupar por día
  const ventasPorDia = useMemo(() => {
    const mapa = {};
    ventas.forEach(v => {
      if (!mapa[v.fecha]) mapa[v.fecha] = { fecha: v.fecha, total: 0, platos: 0 };
      mapa[v.fecha].total += v.ingreso;
      mapa[v.fecha].platos += v.cantidad;
    });
    return Object.values(mapa).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [ventas]);

  // Agrupar por plato (top)
  const topPlatos = useMemo(() => {
    const mapa = {};
    ventas.forEach(v => {
      if (!mapa[v.plato_id]) mapa[v.plato_id] = { nombre: v.platoNombre, cantidad: 0, ingreso: 0 };
      mapa[v.plato_id].cantidad += v.cantidad;
      mapa[v.plato_id].ingreso += v.ingreso;
    });
    return Object.values(mapa).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
  }, [ventas]);

  const resumen = useMemo(() => {
    const totalPlatos = ventas.reduce((s, v) => s + v.cantidad, 0);
    const totalIngresos = ventas.reduce((s, v) => s + v.ingreso, 0);
    return { totalPlatos, totalIngresos };
  }, [ventas]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
      </div>
    );
  }

  if (ventas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-warm-gray/10 p-8 text-center shadow-sm">
        <TrendingUp className="h-10 w-10 text-warm-gray/40 mx-auto mb-3" />
        <p className="text-warm-gray text-sm">
          Aún no hay ventas registradas.
        </p>
        <p className="text-xs text-warm-gray/60 mt-1">
          Usa la sección "Parte de cocina" para registrar las ventas del día.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de período */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriodo('semana')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${periodo === 'semana' ? 'bg-terracotta text-white' : 'bg-white text-warm-gray border border-warm-gray/20'}`}
        >
          Última semana
        </button>
        <button
          onClick={() => setPeriodo('mes')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${periodo === 'mes' ? 'bg-terracotta text-white' : 'bg-white text-warm-gray border border-warm-gray/20'}`}
        >
          Último mes
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm">
          <p className="text-xs text-warm-gray">Platos vendidos</p>
          <p className="text-2xl font-bold text-ink mt-1">{resumen.totalPlatos}</p>
        </div>
        <div className="bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm">
          <p className="text-xs text-warm-gray">Ingresos</p>
          <p className="text-2xl font-bold text-ink mt-1">{formatearMonedaCompacto(resumen.totalIngresos)}</p>
        </div>
      </div>

      {/* Ingresos por día */}
      <div className="bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm">
        <h4 className="font-semibold text-ink text-sm mb-3">Ingresos diarios</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ventasPorDia} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 10, fill: '#8c8276' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => new Date(v + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#8c8276' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v.toFixed(0)}€`}
            />
            <Tooltip
              formatter={(value) => [formatearMoneda(value), 'Ingresos']}
              labelFormatter={(label) => new Date(label + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            />
            <Bar dataKey="total" fill="#c2512b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Platos más vendidos */}
      <div className="bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm">
        <h4 className="font-semibold text-ink text-sm mb-3">Platos más vendidos</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topPlatos} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#8c8276' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="nombre"
              tick={{ fontSize: 11, fill: '#8c8276' }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip formatter={(value) => [value, 'Cantidad']} />
            <Bar dataKey="cantidad" fill="#5a7a5c" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
