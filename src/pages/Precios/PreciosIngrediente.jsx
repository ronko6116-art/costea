import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  ArrowLeft, Search, ChevronDown,
  Check, X, Loader2
} from 'lucide-react';

const ORDEN_CATEGORIAS = [
  'Carnes',
  'Pescados',
  'Frutas y Verduras',
  'Frutas',
  'Lácteos',
  'Despensa',
  'Legumbres y cereales',
  'Pastas',
  'Congelados',
  'Bebidas',
  'Especias',
  'Pan',
  'Aceites',
  'Salsas',
  'Conservas',
  'Dulces',
  'Limpieza',
];

export default function PreciosIngrediente() {
  const navigate = useNavigate();
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState('');
  const [preciosEditando, setPreciosEditando] = useState({});
  const [editados, setEditados] = useState(new Set());
  const [categoriasAbiertas, setCategoriasAbiertas] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('ingredientes')
        .select('*, proveedor:proveedores(nombre)')
        .order('nombre');
      if (data) setIngredientes(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const agrupados = useMemo(() => {
    const mapa = {};
    for (const ing of ingredientes) {
      if (search && !ing.nombre.toLowerCase().includes(search.toLowerCase())) continue;
      const cat = ing.categoria && ORDEN_CATEGORIAS.includes(ing.categoria)
        ? ing.categoria
        : (ing.categoria || 'Sin categoría');
      if (!mapa[cat]) mapa[cat] = [];
      mapa[cat].push(ing);
    }
    return mapa;
  }, [ingredientes, search]);

  const categoriasOrdenadas = useMemo(() => {
    const ordenadas = ORDEN_CATEGORIAS.filter(c => agrupados[c]);
    const resto = Object.keys(agrupados).filter(c => !ORDEN_CATEGORIAS.includes(c) && c !== 'Sin categoría').sort();
    if (agrupados['Sin categoría']) resto.push('Sin categoría');
    return [...ordenadas, ...resto];
  }, [agrupados]);

  useEffect(() => {
    if (categoriasOrdenadas.length > 0 && !search) {
      setCategoriasAbiertas(prev => {
        if (Object.keys(prev).length === 0) {
          return { [categoriasOrdenadas[0]]: true };
        }
        return prev;
      });
    }
    if (search) {
      const todasAbiertas = {};
      categoriasOrdenadas.forEach(c => { todasAbiertas[c] = true; });
      setCategoriasAbiertas(todasAbiertas);
    }
  }, [categoriasOrdenadas.length, search]);

  const toggleCategoria = (cat) => {
    setCategoriasAbiertas(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

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
      setPreciosEditando(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
    setSaving(null);
  };

  const formatearMoneda = (valor) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor || 0);

  const formatearPrecioUnitario = (ing) => {
    const precio = formatearMoneda(ing.precio_actual);
    if (ing.unidad_medida === 'kg' || ing.unidad_medida === 'g' ||
        ing.unidad_medida === 'l' || ing.unidad_medida === 'ml' ||
        ing.unidad_medida === 'unidad' || ing.unidad_medida === 'docena') {
      return `${precio} / ${ing.unidad_medida}`;
    }
    return precio;
  };

  const ingredienteCount = useMemo(
    () => Object.values(agrupados).reduce((sum, arr) => sum + arr.length, 0),
    [agrupados]
  );

  return (
    <div className="min-h-screen bg-cream">
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
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : ingredienteCount === 0 ? (
          <div className="text-center text-ink-soft py-12">
            <p>{search ? 'No hay ingredientes que coincidan.' : 'Aún no hay ingredientes.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categoriasOrdenadas.map(cat => {
              const items = agrupados[cat] || [];
              const abierta = categoriasAbiertas[cat];
              return (
                <div key={cat} className="bg-white rounded-xl border border-warm-gray/10 overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleCategoria(cat)}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-warm-gray/[0.07] hover:bg-warm-gray/[0.12] transition-colors border-b border-warm-gray/10"
                  >
                    <span className="font-semibold text-ink text-sm">
                      {cat}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-warm-gray">{items.length}</span>
                      <ChevronDown className={`h-4 w-4 text-warm-gray transition-transform ${abierta ? 'rotate-180' : ''}`} />
                    </span>
                  </button>

                  {abierta && (
                    <div className="divide-y divide-warm-gray/5">
                      {items.map(ing => {
                        const editando = preciosEditando[ing.id] !== undefined;
                        const valorEditando = preciosEditando[ing.id];
                        const guardando = saving === ing.id;

                        return (
                          <div
                            key={ing.id}
                            className={`px-4 py-3 transition-colors ${
                              editados.has(ing.id) ? 'bg-olive/[0.02]' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-ink">{ing.nombre}</p>
                                {ing.proveedor && (
                                  <p className="text-xs text-warm-gray mt-0.5">{ing.proveedor.nombre}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {editando ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={valorEditando}
                                      onChange={(e) => handlePrecioChange(ing.id, e.target.value)}
                                      className="w-24 rounded-lg border border-terracotta/50 px-2 py-1.5 text-sm bg-white text-right focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
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
                                      className="p-1.5 rounded-full bg-olive text-white hover:bg-olive-dark transition-colors disabled:opacity-60"
                                    >
                                      {guardando ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5" />
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
                                      className="p-1.5 rounded-full hover:bg-red-50 text-warm-gray hover:text-red-500 transition-colors"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setPreciosEditando(prev => ({
                                      ...prev,
                                      [ing.id]: ing.precio_actual || ''
                                    }))}
                                    className="text-right hover:bg-warm-gray/10 rounded-lg px-2 py-1 -mr-2 transition-colors"
                                  >
                                    <span className="font-bold text-ink">
                                      {formatearPrecioUnitario(ing)}
                                    </span>
                                    <span className="block text-[10px] text-terracotta">
                                      Editar
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {editados.size > 0 && (
          <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-warm-gray/20 p-4 z-30">
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
