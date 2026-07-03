// src/ParteCocina.jsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Save, Loader2, Check, ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { formatearMoneda } from '../functions/formatters';

export default function ParteCocina({ restauranteId }) {
  const [platos, setPlatos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [ventasExistentes, setVentasExistentes] = useState({});

  const hoy = new Date().toISOString().split('T')[0];
  const esHoy = fecha === hoy;

  const cambiarFecha = (dias) => {
    const d = new Date(fecha);
    d.setDate(d.getDate() + dias);
    setFecha(d.toISOString().split('T')[0]);
    setSaved(false);
  };

  const fetchVentas = useCallback(async () => {
    if (!restauranteId) return;
    setLoading(true);
    const { data: platosData } = await supabase
      .from('platos')
      .select('id, nombre, precio_venta')
      .eq('restaurante_id', restauranteId)
      .eq('activo', true)
      .order('nombre');
    if (platosData) setPlatos(platosData);

    const { data: ventasData } = await supabase
      .from('ventas_diarias')
      .select('plato_id, cantidad')
      .eq('restaurante_id', restauranteId)
      .eq('fecha', fecha);
    const mapa = {};
    if (ventasData) {
      ventasData.forEach(v => { mapa[v.plato_id] = v.cantidad; });
    }
    setVentasExistentes(mapa);
    setCantidades(mapa);
    setLoading(false);
  }, [restauranteId, fecha]);

  useEffect(() => { fetchVentas(); }, [fetchVentas]);

  const handleChange = (platoId, valor) => {
    const num = parseInt(valor, 10);
    setCantidades(prev => ({ ...prev, [platoId]: isNaN(num) ? 0 : Math.max(0, num) }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const inserts = Object.entries(cantidades)
      .filter(([, cant]) => cant > 0)
      .map(([platoId, cantidad]) => ({
        plato_id: platoId,
        fecha,
        cantidad,
        restaurante_id: restauranteId,
      }));

    const updates = Object.entries(cantidades)
      .filter(([, cant]) => cant === 0 && ventasExistentes[platoId] !== undefined)
      .map(([platoId]) => ({
        plato_id: platoId,
        fecha,
        cantidad: 0,
        restaurante_id: restauranteId,
      }));

    // Upsert: insert or update existing rows
    const todos = [...inserts, ...updates];
    if (todos.length > 0) {
      const { error } = await supabase
        .from('ventas_diarias')
        .upsert(todos, { onConflict: 'plato_id, fecha, restaurante_id' });
      if (error) {
        console.error('Error guardando parte:', error);
        alert('Error al guardar: ' + error.message);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    }
    setSaving(false);
  };

  const totalVendidos = Object.values(cantidades).reduce((a, b) => a + b, 0);
  const totalIngresos = platos.reduce((sum, p) => sum + (cantidades[p.id] || 0) * (p.precio_venta || 0), 0);

  return (
    <div>
      {/* Selector de fecha */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-warm-gray/20 px-4 py-3 shadow-sm mb-4">
        <button onClick={() => cambiarFecha(-1)} className="p-1 rounded-full hover:bg-cream text-warm-gray">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <span className="font-semibold text-ink">
            {new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {esHoy && <span className="text-xs text-terracotta block font-medium">Hoy</span>}
        </div>
        <button
          onClick={() => cambiarFecha(1)}
          disabled={esHoy}
          className={`p-1 rounded-full hover:bg-cream transition-colors ${esHoy ? 'text-warm-gray/30' : 'text-warm-gray'}`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
        </div>
      ) : platos.length === 0 ? (
        <div className="bg-white rounded-xl border border-warm-gray/10 p-8 text-center shadow-sm">
          <UtensilsCrossed className="h-10 w-10 text-warm-gray/40 mx-auto mb-3" />
          <p className="text-warm-gray text-sm">No hay platos activos. Crea algún plato primero.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {platos.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-warm-gray/10 px-4 py-3 flex items-center justify-between shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm truncate">{p.nombre}</p>
                <p className="text-xs text-warm-gray">{formatearMoneda(p.precio_venta)} /ud</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() => handleChange(p.id, (cantidades[p.id] || 0) - 1)}
                  className="w-8 h-8 rounded-full bg-warm-gray/10 text-ink font-bold hover:bg-warm-gray/20 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={cantidades[p.id] || 0}
                  onChange={e => handleChange(p.id, e.target.value)}
                  className="w-14 text-center rounded-lg border border-warm-gray/30 py-1.5 text-sm font-semibold bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => handleChange(p.id, (cantidades[p.id] || 0) + 1)}
                  className="w-8 h-8 rounded-full bg-terracotta/10 text-terracotta font-bold hover:bg-terracotta/20 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumen y botón guardar */}
      {!loading && platos.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-warm-gray">Total platos vendidos</span>
            <span className="font-bold text-ink">{totalVendidos}</span>
          </div>
          <div className="flex items-center justify-between mb-4 text-sm">
            <span className="text-warm-gray">Ingresos estimados</span>
            <span className="font-bold text-ink">{formatearMoneda(totalIngresos)}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-terracotta text-white rounded-full py-3 font-semibold hover:bg-terracotta-dark transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : saved ? (
              <Check className="h-5 w-5" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar parte'}
          </button>
        </div>
      )}
    </div>
  );
}
