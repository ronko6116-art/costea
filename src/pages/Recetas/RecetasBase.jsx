import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Plus, BookOpen, Loader2, Edit3, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { formatearMoneda } from '../../functions/formatters';

function RecetaExpandida({ receta, onClose, onRecetaChange }) {
  const { restauranteId } = useRestaurant();
  const [lineas, setLineas] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [loadingIng, setLoadingIng] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIng, setSelectedIng] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [merma, setMerma] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!receta?.id) return;
    loadIngredientes();
  }, [receta?.id]);

  async function loadIngredientes() {
    setLoadingIng(true);
    try {
      const { data: lineasData } = await supabase
        .from('receta_lineas')
        .select(`
          id, cantidad, merma_pct,
          ingrediente:ingredientes(id, nombre, unidad_medida, precio_actual, proveedor_habitual_id)
        `)
        .eq('receta_id', receta.id);
      setLineas(lineasData || []);

      let { data: ingData } = await supabase
        .from('ingredientes')
        .select('id, nombre, unidad_medida, precio_actual, proveedor_habitual_id')
        .eq('restaurante_id', receta.restaurante_id)
        .order('nombre');

      if (!ingData?.length && restauranteId) {
        const { data: fb } = await supabase
          .from('ingredientes')
          .select('id, nombre, unidad_medida, precio_actual, proveedor_habitual_id')
          .eq('restaurante_id', restauranteId)
          .order('nombre');
        if (fb?.length) ingData = fb;
      }

      if (!ingData?.length) {
        const { data: all } = await supabase
          .from('ingredientes')
          .select('id, nombre, unidad_medida, precio_actual, proveedor_habitual_id')
          .order('nombre');
        if (all?.length) ingData = all;
      }

      const idsEnReceta = (lineasData || []).map(r => r.ingrediente.id);
      setDisponibles((ingData || []).filter(i => !idsEnReceta.includes(i.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingIng(false);
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedIng || !cantidad) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('receta_lineas')
        .insert([{ receta_id: receta.id, ingrediente_id: selectedIng, cantidad: parseFloat(cantidad), merma_pct: parseFloat(merma) || 0 }])
        .select(`id, cantidad, merma_pct, ingrediente:ingredientes(id, nombre, unidad_medida, precio_actual)`)
        .single();
      if (error) throw error;
      setLineas([...lineas, data]);
      setDisponibles(disponibles.filter(i => i.id !== selectedIng));
      setSelectedIng('');
      setCantidad('');
      setMerma('0');
      setShowForm(false);
      setError(null);
      onRecetaChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (lineaId) => {
    if (!confirm('¿Eliminar este ingrediente?')) return;
    const removed = lineas.find(l => l.id === lineaId);
    try {
      await supabase.from('receta_lineas').delete().eq('id', lineaId);
      setLineas(lineas.filter(l => l.id !== lineaId));
      if (removed) {
        setDisponibles([...disponibles, { id: removed.ingrediente.id, nombre: removed.ingrediente.nombre, unidad_medida: removed.ingrediente.unidad_medida }]);
      }
      onRecetaChange();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="border-t border-warm-gray/10 bg-cream/30">
      <div className="px-4 py-3">
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
        )}

        {loadingIng ? (
          <div className="flex items-center gap-2 text-sm text-warm-gray py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando ingredientes...
          </div>
        ) : (
          <>
            {/* Lista de ingredientes actuales */}
            {lineas.length === 0 ? (
              <p className="text-sm text-ink-soft py-2">Sin ingredientes.</p>
            ) : (
              <div className="divide-y divide-warm-gray/10 mb-3">
                {lineas.map(l => (
                  <div key={l.id} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-ink">{l.ingrediente.nombre}</p>
                      <p className="text-xs text-warm-gray">
                        {l.cantidad} {l.ingrediente.unidad_medida}
                        {l.merma_pct > 0 && <span className="text-orange-500 ml-1">merma {l.merma_pct}%</span>}
                      </p>
                    </div>
                    <button onClick={() => handleRemove(l.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botón añadir */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 text-terracotta font-semibold text-sm"
            >
              <Plus className="h-4 w-4" /> Añadir ingrediente
            </button>

            {/* Formulario inline */}
            {showForm && (
              <form onSubmit={handleAdd} className="mt-3 space-y-2 p-3 bg-white rounded-lg border border-warm-gray/10">
                <select
                  value={selectedIng}
                  onChange={e => setSelectedIng(e.target.value)}
                  className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-white"
                  required
                >
                  <option value="">Selecciona...</option>
                  {disponibles.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={cantidad}
                    onChange={e => setCantidad(e.target.value)}
                    placeholder="Cantidad"
                    className="flex-1 rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMerma(merma === '0' ? '20' : merma === '20' ? '40' : '0')}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                      merma === '0' ? 'border-warm-gray/30 text-ink-soft' :
                      merma === '20' ? 'bg-orange-100 border-orange-300 text-orange-700' :
                      'bg-red-100 border-red-300 text-red-700'
                    }`}
                  >
                    {merma === '0' ? 'Sin' : merma === '20' ? '20%' : '40%'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving || !selectedIng}
                    className="flex-1 bg-terracotta text-white rounded-full py-2 text-sm font-semibold disabled:opacity-50">
                    {saving ? 'Añadiendo...' : 'Añadir'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 border border-warm-gray/30 text-ink-soft rounded-full py-2 text-sm font-medium">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

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
  const [expandidaId, setExpandidaId] = useState(null);

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
  }

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
        await supabase.from('recetas_base').update(data).eq('id', editandoId);
      } else {
        await supabase.from('recetas_base').insert([data]);
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
      await supabase.from('recetas_base').delete().eq('id', id);
      if (expandidaId === id) setExpandidaId(null);
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
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-olive/10 text-ink transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg">Recetas base</span>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1 bg-terracotta text-white rounded-full px-4 py-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Nueva
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
            {recetas.map(rb => {
              const expanded = expandidaId === rb.id;
              return (
                <div key={rb.id} className="bg-white rounded-xl border border-warm-gray/10 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <button
                        onClick={() => setExpandidaId(expanded ? null : rb.id)}
                        className="flex-1 text-left"
                      >
                        <h3 className="font-bold text-ink">{rb.nombre}</h3>
                        <p className="text-sm text-warm-gray">
                          {rb.porciones_base} porc. base
                          {platosCount[rb.id] > 0 && ` · ${platosCount[rb.id]} plato${platosCount[rb.id] > 1 ? 's' : ''}`}
                        </p>
                      </button>
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => handleEdit(rb)} className="p-2 rounded-full hover:bg-olive/10 text-olive transition-colors">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(rb.id)} className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setExpandidaId(expanded ? null : rb.id)} className="p-2 rounded-full hover:bg-warm-gray/10 text-warm-gray transition-colors">
                          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {expanded && (
                    <RecetaExpandida
                      receta={rb}
                      onClose={() => setExpandidaId(null)}
                      onRecetaChange={fetchRecetas}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={resetForm}>
            <div className="fixed inset-0 bg-black/40" />
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-ink text-lg mb-4">{editandoId ? 'Editar receta base' : 'Nueva receta base'}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Nombre</label>
                  <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                    className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                    placeholder="Ej: Salsa boloñesa base" required autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Porciones base</label>
                  <input type="number" min="1" value={porcionesBase} onChange={e => setPorcionesBase(e.target.value)}
                    className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition" />
                  <p className="text-xs text-warm-gray mt-1">Número de personas para las que está pensada esta receta.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving || !nombre.trim()}
                    className="flex-1 bg-terracotta text-white rounded-full py-3 font-semibold disabled:opacity-60">
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin inline" /> Guardando...</> : editandoId ? 'Actualizar' : 'Crear'}
                  </button>
                  <button type="button" onClick={resetForm}
                    className="flex-1 border border-warm-gray/30 text-ink-soft rounded-full py-3 font-medium">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
