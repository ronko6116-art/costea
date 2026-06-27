import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Plus, Edit, Trash2, Search, Mail, Phone, StickyNote, ChevronDown, Package } from 'lucide-react';

export default function ProveedorList() {
  const navigate = useNavigate();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [expandido, setExpandido] = useState(null);
  const [productos, setProductos] = useState({});

  useEffect(() => {
    const fetchProveedores = async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre');
      if (error) {
        setError(error.message);
      } else {
        setProveedores(data);
      }
      setLoading(false);
    };
    fetchProveedores();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este proveedor? Los ingredientes asociados perderán su proveedor habitual.')) return;
    const { error } = await supabase
      .from('proveedores')
      .delete()
      .eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      setProveedores(prev => prev.filter(p => p.id !== id));
      setProductos(prev => { const next = { ...prev }; delete next[id]; return next; });
    }
  };

  const toggleExpandido = async (proveedorId) => {
    if (expandido === proveedorId) {
      setExpandido(null);
      return;
    }
    setExpandido(proveedorId);

    if (!productos[proveedorId]) {
      const { data } = await supabase
        .from('ingredientes')
        .select('id, nombre, unidad_medida, precio_actual, categoria')
        .eq('proveedor_habitual_id', proveedorId)
        .order('nombre');
      setProductos(prev => ({ ...prev, [proveedorId]: data || [] }));
    }
  };

  const filtered = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const formatoMoneda = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  });

  return (
    <div className="min-h-screen bg-cream pb-8">
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="p-2 -ml-2 rounded-full hover:bg-olive/10 text-ink transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg">Proveedores</span>
          <button
            onClick={() => navigate('/proveedores/nuevo')}
            className="p-2 rounded-full bg-terracotta text-white hover:bg-terracotta-dark transition-colors"
            aria-label="Nuevo proveedor"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-warm-gray" />
          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-warm-gray/20 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
          />
        </div>

        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        {loading ? (
          <div className="text-center text-ink-soft py-8">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-ink-soft py-8">
            <p className="mb-1">
              {search ? 'No hay proveedores que coincidan.' : 'Aún no hay proveedores.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/proveedores/nuevo')}
                className="mt-4 bg-terracotta text-white px-6 py-2 rounded-full text-sm font-semibold"
              >
                Crear el primero
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => {
              const estaExpandido = expandido === p.id;
              const prodCount = productos[p.id]?.length || 0;
              return (
                <div key={p.id}>
                  <div
                    className={`bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm flex items-start justify-between gap-3 cursor-pointer transition-colors hover:bg-warm-gray/[0.03] ${
                      estaExpandido ? 'rounded-b-none border-b-0' : ''
                    }`}
                    onClick={() => toggleExpandido(p.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink truncate">{p.nombre}</p>
                        <ChevronDown className={`h-4 w-4 text-warm-gray shrink-0 transition-transform ${estaExpandido ? 'rotate-180' : ''}`} />
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        {p.telefono && (
                          <span className="flex items-center gap-1.5 text-xs text-warm-gray">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {p.telefono}
                          </span>
                        )}
                        {p.email_facturacion && (
                          <span className="flex items-center gap-1.5 text-xs text-warm-gray">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            {p.email_facturacion}
                          </span>
                        )}
                        {p.notas && (
                          <span className="flex items-center gap-1.5 text-xs text-warm-gray truncate">
                            <StickyNote className="h-3.5 w-3.5 shrink-0" />
                            {p.notas}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/proveedores/editar/${p.id}`)}
                        className="p-2 rounded-full hover:bg-olive/10 text-ink-soft transition-colors"
                        aria-label="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Accordion: productos de este proveedor */}
                  {estaExpandido && (
                    <div className="bg-warm-gray/[0.04] border border-warm-gray/10 border-t-0 rounded-b-xl overflow-hidden">
                      {!productos[p.id] ? (
                        <div className="px-5 py-4 text-center text-sm text-warm-gray">
                          Cargando productos...
                        </div>
                      ) : prodCount === 0 ? (
                        <div className="px-5 py-4 text-center text-sm text-warm-gray">
                          No hay productos de este proveedor
                        </div>
                      ) : (
                        <div className="divide-y divide-warm-gray/10">
                          {productos[p.id].map(ing => (
                            <div key={ing.id} className="flex items-center justify-between px-5 py-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <Package className="h-4 w-4 text-warm-gray shrink-0" />
                                <span className="text-sm font-medium text-ink truncate">{ing.nombre}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {ing.categoria && (
                                  <span className="text-[11px] text-warm-gray bg-white rounded px-1.5 py-0.5">{ing.categoria}</span>
                                )}
                                <span className="text-sm font-semibold text-ink">{formatoMoneda.format(ing.precio_actual)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
