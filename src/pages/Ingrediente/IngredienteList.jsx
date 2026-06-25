// src/IngredienteList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Plus, Edit, Trash2, Search, DollarSign } from 'lucide-react';

export default function IngredienteList() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchIngredientes = async () => {
      const { data, error } = await supabase
        .from('ingredientes')
        .select('*, proveedor:proveedores(nombre)')
        .order('nombre');
      if (error) {
        setError(error.message);
      } else {
        setIngredientes(data);
      }
      setLoading(false);
    };
    fetchIngredientes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este ingrediente? Se perderán las recetas asociadas.')) return;
    const { error } = await supabase
      .from('ingredientes')
      .delete()
      .eq('id', id);
    if (error) {
      alert(error.message);
    } else {
      setIngredientes(prev => prev.filter(i => i.id !== id));
    }
  };

  const filtered = ingredientes.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase())
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
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-olive/10 text-ink transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg">Ingredientes</span>
          <button
            onClick={() => navigate('/ingredientes/nuevo')}
            className="p-2 rounded-full bg-terracotta text-white hover:bg-terracotta-dark transition-colors"
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
            placeholder="Buscar ingrediente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-warm-gray/20 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
          />
        </div>

        <div className="mb-4 flex items-center gap-2 bg-olive/[0.06] border border-olive/15 rounded-xl px-4 py-2.5 text-sm text-ink-soft">
          <DollarSign className="h-4 w-4 text-olive shrink-0" />
          <span>Actualiza precios rápido desde </span>
          <button onClick={() => navigate('/precios')} className="font-semibold text-olive hover:underline shrink-0">
            Precios
          </button>
        </div>

        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        {loading ? (
          <div className="text-center text-ink-soft">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-ink-soft py-8">
            <p>No hay ingredientes</p>
            <button
              onClick={() => navigate('/ingredientes/nuevo')}
              className="mt-4 bg-terracotta text-white px-6 py-2 rounded-full text-sm"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((ing) => (
              <div key={ing.id} className="bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{ing.nombre}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-warm-gray">
                    <span>{ing.unidad_medida}</span>
                    {ing.proveedor && <span>· {ing.proveedor.nombre}</span>}
                    {ing.categoria && <span>· {ing.categoria}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigate(`/ingredientes/editar/${ing.id}`)}
                    className="p-2 rounded-full hover:bg-olive/10 text-ink-soft transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ing.id)}
                    className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}