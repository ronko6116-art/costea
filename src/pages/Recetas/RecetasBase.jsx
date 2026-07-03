import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Plus, BookOpen, Loader2, Edit3, Trash2, ChevronRight } from 'lucide-react';

export default function RecetasBase() {
  const navigate = useNavigate();
  useAuth();
  const { restauranteId } = useRestaurant();
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [porcionesBase, setPorcionesBase] = useState('1');
  const [saving, setSaving] = useState(false);
  const [platosCount, setPlatosCount] = useState({});

  useEffect(() => {
    if (!restauranteId) return;
    fetchRecetas();
  }, [restauranteId]);

  async function fetchRecetas() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recetas_base')
        .select('*')
        .eq('restaurante_id', restauranteId)
        .order('nombre');
      if (error) throw error;
      setRecetas(data || []);

      // Contar platos por receta
      const { data: platos } = await supabase
        .from('platos')
        .select('receta_id')
        .eq('restaurante_id', restauranteId);
      const counts = {};
      if (platos) {
        for (const p of platos) {
          counts[p.receta_id] = (counts[p.receta_id] || 0) + 1;
        }
      }
      setPlatosCount(counts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      const data = {
        restaurante_id: restauranteId,
        nombre: nombre.trim(),
        porciones_base: parseInt(porcionesBase) || 1,
      };

      if (editandoId) {
        const { error } = await supabase
          .from('recetas_base')
          .update(data)
          .eq('id', editandoId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recetas_base')
          .insert([data]);
        if (error) throw error;
      }

      resetForm();
      fetchRecetas();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta receta base? Los platos que la usan se quedarán sin receta asociada.')) return;
    try {
      const { error } = await supabase
        .from('recetas_base')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchRecetas();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (rb) => {
    setEditandoId(rb.id);
    setNombre(rb.nombre);
    setPorcionesBase(String(rb.porciones_base));
    setShowForm(true);
  };

  const resetForm = () => {
    setEditandoId(null);
    setNombre('');
    setPorcionesBase('1');
    setShowForm(false);
    setError(null);
  };

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
          <span className="font-bold text-ink text-lg">Recetas base</span>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1 bg-terracotta text-white rounded-full px-4 py-2 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Nueva
          </button>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recetas.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <BookOpen className="h-12 w-12 text-warm-gray mx-auto mb-3" />
            <p className="text-ink-soft">No hay recetas base aún.</p>
            <p className="text-sm text-warm-gray mt-1">Crea una para empezar a organizar tus platos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recetas.map(rb => (
              <div key={rb.id} className="bg-white rounded-xl border border-warm-gray/10 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-ink">{rb.nombre}</h3>
                      <p className="text-sm text-warm-gray">
                        {rb.porciones_base} porc. base
                        {platosCount[rb.id] > 0 && ` · ${platosCount[rb.id]} plato${platosCount[rb.id] > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(rb)}
                        className="p-2 rounded-full hover:bg-olive/10 text-olive transition-colors"
                        aria-label="Editar"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rb.id)}
                        className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/recetas/${rb.id}/ingredientes`)}
                    className="mt-2 w-full flex items-center justify-between bg-cream rounded-lg px-3 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
                  >
                    <span>Gestionar ingredientes</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de creación/edición */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={resetForm}>
            <div className="fixed inset-0 bg-black/40" />
            <div
              className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl animate-slide-up"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-bold text-ink text-lg mb-4">
                {editandoId ? 'Editar receta base' : 'Nueva receta base'}
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Nombre</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                    placeholder="Ej: Salsa boloñesa base"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Porciones base</label>
                  <input
                    type="number"
                    min="1"
                    value={porcionesBase}
                    onChange={e => setPorcionesBase(e.target.value)}
                    className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                  />
                  <p className="text-xs text-warm-gray mt-1">
                    Número de personas para las que está pensada esta receta.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving || !nombre.trim()}
                    className="flex-1 bg-terracotta text-white rounded-full py-3 font-semibold disabled:opacity-60"
                  >
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin inline" /> Guardando...</> : editandoId ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 border border-warm-gray/30 text-ink-soft rounded-full py-3 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
