// src/ComparativaProveedores.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Store, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatearMonedaCompacto } from '../functions/formatters';

export default function ComparativaProveedores({ restauranteId }) {
  const [ingredientes, setIngredientes] = useState([]);
  const [ingredienteSel, setIngredienteSel] = useState(null);
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (!restauranteId) return;
    supabase
      .from('ingredientes')
      .select('id, nombre, unidad_medida')
      .eq('restaurante_id', restauranteId)
      .order('nombre')
      .then(({ data }) => { if (data) setIngredientes(data); });
  }, [restauranteId]);

  useEffect(() => {
    if (!ingredienteSel) { setDatos([]); return; }
    setLoading(true);
    supabase
      .from('precios_proveedor')
      .select('precio, updated_at, proveedor:proveedor_id(id, nombre)')
      .eq('ingrediente_id', ingredienteSel)
      .order('precio', { ascending: true })
      .then(({ data }) => {
        if (data) setDatos(data);
        setLoading(false);
      });
  }, [ingredienteSel]);

  const ingredientesFiltrados = busqueda
    ? ingredientes.filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : ingredientes;

  return (
    <div>
      {/* Selector de ingrediente */}
      <div className="relative mb-4">
        {ingredienteSel ? (
          <div className="bg-white rounded-xl border border-warm-gray/20 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-ink">{ingredientes.find(i => i.id === ingredienteSel)?.nombre}</p>
              </div>
              <button
                onClick={() => { setIngredienteSel(null); setDatos([]); }}
                className="text-sm text-terracotta font-medium hover:underline"
              >
                Cambiar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setBuscadorAbierto(!buscadorAbierto)}
              className="w-full flex items-center justify-between bg-white rounded-xl border border-warm-gray/20 px-4 py-3 shadow-sm"
            >
              <span className="text-warm-gray">Selecciona un ingrediente</span>
              <Search className="h-5 w-5 text-warm-gray" />
            </button>
            {buscadorAbierto && (
              <div className="mt-2 bg-white rounded-xl border border-warm-gray/20 shadow-lg overflow-hidden">
                <div className="p-2 border-b border-warm-gray/10">
                  <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar ingrediente..."
                    className="w-full px-3 py-2 rounded-lg bg-cream text-sm outline-none focus:ring-2 focus:ring-terracotta/20"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {ingredientesFiltrados.length === 0 ? (
                    <p className="text-center text-sm text-warm-gray py-6">Sin resultados</p>
                  ) : (
                    ingredientesFiltrados.map(ing => (
                      <button
                        key={ing.id}
                        onClick={() => { setIngredienteSel(ing.id); setBuscadorAbierto(false); setBusqueda(''); }}
                        className="w-full text-left px-4 py-3 hover:bg-cream transition-colors border-b border-warm-gray/5 last:border-0"
                      >
                        <span className="font-medium text-ink text-sm">{ing.nombre}</span>
                        <span className="text-xs text-warm-gray ml-2">/{ing.unidad_medida}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resultados */}
      {ingredienteSel && (
        <>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
            </div>
          ) : datos.length === 0 ? (
            <div className="bg-white rounded-xl border border-warm-gray/10 p-8 text-center shadow-sm">
              <Store className="h-10 w-10 text-warm-gray/40 mx-auto mb-3" />
              <p className="text-warm-gray text-sm">
                No hay precios de proveedores para este ingrediente.
              </p>
              <p className="text-xs text-warm-gray/60 mt-1">
                Asigna proveedores desde la ficha del ingrediente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Gráfico de barras */}
              <div className="bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm">
                <h4 className="font-semibold text-ink text-sm mb-3">Comparativa de precios</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={datos} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                    <XAxis
                      dataKey="proveedor.nombre"
                      tick={{ fontSize: 11, fill: '#8c8276' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#8c8276' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v.toFixed(2)}€`}
                    />
                    <Tooltip
                      formatter={(value) => [formatearMonedaCompacto(value), 'Precio']}
                      labelFormatter={(label) => `Proveedor: ${label}`}
                    />
                    <Bar dataKey="precio" fill="#c2512b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-xl border border-warm-gray/10 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-warm-gray/5 border-b border-warm-gray/10">
                  <h4 className="font-semibold text-ink text-sm">Detalle por proveedor</h4>
                </div>
                <div className="divide-y divide-warm-gray/5">
                  {datos.map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-warm-gray" />
                        <span className="font-medium text-ink text-sm">{d.proveedor?.nombre || '?'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-ink">{formatearMonedaCompacto(d.precio)}</span>
                        <span className="text-xs text-warm-gray ml-2">
                          {d.updated_at ? new Date(d.updated_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
