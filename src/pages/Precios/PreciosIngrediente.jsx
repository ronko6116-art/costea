import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  ArrowLeft, Save, Search, ChevronRight,
  TrendingUp, TrendingDown, Minus, Check, X, Loader2
} from 'lucide-react';

export default function PreciosIngrediente() {
  const navigate = useNavigate();
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState('');
  const [preciosEditando, setPreciosEditando] = useState({});
  const [editados, setEditados] = useState(new Set());
  const [restauranteId, setRestauranteId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: rData } = await supabase
        .from('restaurantes')
        .select('id')
        .limit(1)
        .single();
      if (rData) setRestauranteId(rData.id);

      const { data } = await supabase
        .from('ingredientes')
        .select('*, proveedor:proveedores(nombre)')
        .order('nombre');
      if (data) setIngredientes(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handlePrecioChange = (id, valor) => {
    setPreciosEditando(prev => ({ ...prev, [id]: valor }));
  };

  const handleGuardar = async (id) => {
    const nuevoPrecio = parseFloat(preciosEditando[id]);
    if (isNaN(nuevoPrecio) || nuevoPrecio < 0) return;

    setSaving(id);
    const { error } = await supabase
      .from('ingredientes')
      .update({ precio_actual: nuevoPrecio, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setIngredientes(prev =>
        prev.map(i => i.id === id ? { ...i, precio_actual: nuevoPrecio } : i)
      );
      setEditados(prev => new Set(prev).add(id));
    }
    setSaving(null);
  };

  const formatearMoneda = (valor) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor || 0);

  const getVariacion = (ing) => {
    if (!ing.precio_anterior || ing.precio_anterior === 0) return null;
    const diff = ((ing.precio_actual - ing.precio_anterior) / ing.precio_anterior) * 100;
    return diff;
  };

  const filtered = ingredientes.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cream pb-8">
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-olive/10 text-ink transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg">Actualizar precios</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-warm-gray" />
          <input
            type="text"
            placeholder="Buscar ingrediente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-warm-gray/20 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
          />
        </div>

        <p className="text-xs text-warm-gray mb-3 px-1">
          Toca el precio para editarlo. Los márgenes se recalculan automáticamente.
        </p>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-ink-soft py-12">
            <p>{search ? 'No hay ingredientes que coincidan.' : 'Aún no hay ingredientes.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(ing => {
              const editando = preciosEditando[ing.id] !== undefined;
              const valorEditando = preciosEditando[ing.id];
              const variacion = getVariacion(ing);
              const guardando = saving === ing.id;

              return (
                <div
                  key={ing.id}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${
                    editados.has(ing.id) ? 'border-olive/40 bg-olive/[0.02]' : 'border-warm-gray/10'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink truncate">{ing.nombre}</p>
                        <div className="flex items-center gap-2 text-xs text-warm-gray mt-0.5">
                          <span>{ing.unidad_medida}</span>
                          {ing.proveedor && <span>· {ing.proveedor.nombre}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        {editando ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-warm-gray">€</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={valorEditando}
                              onChange={(e) => handlePrecioChange(ing.id, e.target.value)}
                              className="w-28 rounded-lg border border-terracotta/50 px-3 py-2 text-sm bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleGuardar(ing.id);
                                if (e.key === 'Escape') {
                                  setPreciosEditando(prev => {
                                    const copy = { ...prev };
                                    delete copy[ing.id];
                                    return copy;
                                  });
                                }
                              }}
                            />
                            <button
                              onClick={() => handleGuardar(ing.id)}
                              disabled={guardando}
                              className="p-2 rounded-full bg-olive text-white hover:bg-olive-dark transition-colors disabled:opacity-60"
                              aria-label="Guardar"
                            >
                              {guardando ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setPreciosEditando(prev => {
                                  const copy = { ...prev };
                                  delete copy[ing.id];
                                  return copy;
                                });
                              }}
                              className="p-2 rounded-full hover:bg-red-50 text-warm-gray hover:text-red-500 transition-colors"
                              aria-label="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPreciosEditando(prev => ({
                              ...prev,
                              [ing.id]: ing.precio_actual || ''
                            }))}
                            className="flex items-center gap-2 group"
                          >
                            <span className="text-lg font-bold text-ink">
                              {formatearMoneda(ing.precio_actual)}
                            </span>
                            <span className="text-xs text-warm-gray opacity-0 group-hover:opacity-100 transition-opacity">
                              Editar
                            </span>
                          </button>
                        )}
                      </div>

                      {variacion !== null && !editando && (
                        <div className={`flex items-center gap-1 text-xs font-semibold ${
                          variacion > 5 ? 'text-red-600' :
                          variacion < -5 ? 'text-olive-dark' :
                          'text-warm-gray'
                        }`}>
                          {variacion > 5 ? <TrendingUp className="h-3.5 w-3.5" /> :
                           variacion < -5 ? <TrendingDown className="h-3.5 w-3.5" /> :
                           <Minus className="h-3.5 w-3.5" />}
                          {variacion > 0 ? '+' : ''}{variacion.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {editados.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-warm-gray/20 p-4">
            <div className="max-w-lg mx-auto flex items-center justify-between">
              <span className="text-sm text-ink-soft">
                {editados.size} ingrediente{editados.size > 1 ? 's' : ''} actualizado{editados.size > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => {
                  setEditados(new Set());
                  setPreciosEditando({});
                }}
                className="text-sm font-semibold text-olive hover:underline"
              >
                Descartar avisos
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
