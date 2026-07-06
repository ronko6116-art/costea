import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Plus, BookOpen, Loader2, Edit3, Trash2, Check, X } from 'lucide-react';
import { formatearMoneda } from '../../functions/formatters';
import PickerList from '../../components/PickerList';

function RecetaCard({ receta, onRecetaChange }) {
  const { restauranteId } = useRestaurant();
  const [lineas, setLineas] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [loadingIng, setLoadingIng] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIng, setSelectedIng] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [mermaPct, setMermaPct] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);


  const [editandoLineaId, setEditandoLineaId] = useState(null);
  const [editCantidad, setEditCantidad] = useState('');
  const [editMerma, setEditMerma] = useState('');

  useEffect(() => {
    loadIng();
  }, [receta.id]);

  async function loadIng() {
    setLoadingIng(true);
    try {
      const { data: l } = await supabase
        .from('receta_lineas')
        .select(`id, cantidad, merma_pct, ingrediente:ingredientes(id, nombre, unidad_medida, precio_actual, proveedor_habitual_id, proveedor_habitual:proveedores(nombre))`)
        .eq('receta_id', receta.id);
      setLineas(l || []);

      let { data: ing } = await supabase
        .from('ingredientes')
        .select('id, nombre, unidad_medida, precio_actual, proveedor_habitual_id, proveedor_habitual:proveedores(nombre)')
        .eq('restaurante_id', receta.restaurante_id)
        .order('nombre');

      if (!ing?.length && restauranteId) {
        const { data: fb } = await supabase
          .from('ingredientes')
          .select('id, nombre, unidad_medida, precio_actual, proveedor_habitual_id, proveedor_habitual:proveedores(nombre)')
          .eq('restaurante_id', restauranteId)
          .order('nombre');
        if (fb?.length) ing = fb;
      }
      if (!ing?.length) {
        const { data: all } = await supabase
          .from('ingredientes')
          .select('id, nombre, unidad_medida, precio_actual, proveedor_habitual_id, proveedor_habitual:proveedores(nombre)')
          .order('nombre');
        if (all?.length) ing = all;
      }

      const idsEnReceta = (l || []).map(r => r.ingrediente.id);
      setDisponibles((ing || []).filter(i => !idsEnReceta.includes(i.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingIng(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!selectedIng || !cantidad) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('receta_lineas')
        .insert([{ receta_id: receta.id, ingrediente_id: selectedIng, cantidad: parseFloat(cantidad), merma_pct: parseFloat(mermaPct) || 0 }])
        .select(`id, cantidad, merma_pct, ingrediente:ingredientes(id, nombre, unidad_medida, precio_actual)`)
        .single();
      if (error) throw error;
      setLineas([...lineas, data]);
      setDisponibles(disponibles.filter(i => i.id !== selectedIng));
      setSelectedIng('');
      setCantidad('');
      setMermaPct('0');
      setShowForm(false);
      setError(null);
      onRecetaChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function empezarEditar(linea) {
    setEditandoLineaId(linea.id);
    setEditCantidad(String(linea.cantidad));
    setEditMerma(String(linea.merma_pct || 0));
  }

  async function handleUpdate(lineaId) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('receta_lineas')
        .update({ cantidad: parseFloat(editCantidad), merma_pct: parseFloat(editMerma) || 0 })
        .eq('id', lineaId);
      if (error) throw error;
      setLineas(lineas.map(l =>
        l.id === lineaId ? { ...l, cantidad: parseFloat(editCantidad), merma_pct: parseFloat(editMerma) || 0 } : l
      ));
      setEditandoLineaId(null);
      onRecetaChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function cancelarEditar() {
    setEditandoLineaId(null);
    setEditCantidad('');
    setEditMerma('');
  }

  async function handleRemove(lineaId) {
    if (!confirm('¿Eliminar este ingrediente?')) return;
    const removed = lineas.find(l => l.id === lineaId);
    try {
      await supabase.from('receta_lineas').delete().eq('id', lineaId);
      setLineas(lineas.filter(l => l.id !== lineaId));
      if (removed) {
        setDisponibles([...disponibles, { id: removed.ingrediente.id, nombre: removed.ingrediente.nombre, unidad_medida: removed.ingrediente.unidad_medida, precio_actual: removed.ingrediente.precio_actual, proveedor_habitual_id: removed.ingrediente.proveedor_habitual_id, proveedor_habitual: removed.ingrediente.proveedor_habitual }]);
      }
      onRecetaChange();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="bg-white/80 rounded-xl border border-warm-gray/10 shadow-sm overflow-hidden">
      <div className="p-4 bg-warm-gray/[0.03]">
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
        )}

        {loadingIng ? (
          <div className="flex items-center gap-2 text-sm text-warm-gray py-4"><Loader2 className="h-4 w-4 animate-spin" /> Cargando ingredientes...</div>
        ) : (
          <>
            {lineas.length === 0 ? (
              <p className="text-sm text-ink-soft py-2">Sin ingredientes todavía.</p>
            ) : (
              <div className="divide-y divide-warm-gray/10 mb-3">
                {lineas.map(l => (
                  <div key={l.id} className="py-2 flex justify-between items-start gap-2">
                    {editandoLineaId === l.id ? (
                      <div className="flex-1 space-y-2 p-3 -m-3 bg-terracotta/5 rounded-lg border border-terracotta/20">
                        <p className="text-sm font-semibold text-terracotta">{l.ingrediente.nombre}</p>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number" step="0.001" min="0"
                            value={editCantidad}
                            onChange={e => setEditCantidad(e.target.value)}
                            className="w-20 rounded-lg border border-terracotta/30 px-2 py-2 text-sm bg-white font-medium"
                          />
                          <span className="text-xs text-warm-gray font-medium">{l.ingrediente.unidad_medida === 'docena' ? 'uds' : l.ingrediente.unidad_medida}</span>
                          <select
                            value={editMerma}
                            onChange={e => setEditMerma(e.target.value)}
                            className="rounded-lg border border-terracotta/30 px-2 py-2 text-sm bg-white font-medium"
                          >
                            <option value="0">Sin merma</option>
                            <option value="20">Merma 20%</option>
                            <option value="40">Merma 40%</option>
                          </select>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => handleUpdate(l.id)} disabled={saving}
                            className="flex items-center gap-1 bg-olive text-white rounded-full px-3 py-1.5 text-xs font-semibold">
                            <Check className="h-3.5 w-3.5" /> Guardar
                          </button>
                          <button onClick={cancelarEditar}
                            className="flex items-center gap-1 border border-warm-gray/30 text-ink-soft rounded-full px-3 py-1.5 text-xs font-medium">
                            <X className="h-3.5 w-3.5" /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink">{l.ingrediente.nombre}</p>
                          <p className="text-xs text-warm-gray">
                            {l.cantidad} {l.ingrediente.unidad_medida === 'docena' ? 'uds' : l.ingrediente.unidad_medida}
                            {l.merma_pct > 0 && <span className="text-orange-500 ml-1">merma {l.merma_pct}%</span>}
                            <span className="ml-1">· {formatearMoneda(l.ingrediente.precio_actual)}/{l.ingrediente.unidad_medida === 'docena' ? 'doc' : l.ingrediente.unidad_medida}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => empezarEditar(l)} className="p-1.5 text-olive hover:bg-olive/10 rounded-full">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleRemove(l.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!showForm ? (
              <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-terracotta font-semibold text-sm">
                <Plus className="h-4 w-4" /> Añadir ingrediente
              </button>
            ) : (
              <form onSubmit={handleAdd} className="space-y-2 p-3 bg-cream rounded-lg border border-warm-gray/10">
                <PickerList
                  items={disponibles}
                  value={selectedIng}
                  onChange={setSelectedIng}
                  placeholder="Seleccionar ingrediente"
                  emptyMessage="No hay ingredientes disponibles"
                  renderItem={i => (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink truncate">{i.nombre}</span>
                      <span className="text-xs text-ink-soft whitespace-nowrap tabular-nums">
                        {formatearMoneda(i.precio_actual)}/{i.unidad_medida === 'docena' ? 'doc' : i.unidad_medida}
                      </span>
                    </div>
                  )}
                />
                <div className="flex gap-2">
                  <input type="number" step="0.001" min="0.001" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="Cantidad" className="flex-1 rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-white" required />
                  {[
                    { v: '0', l: 'Sin' },
                    { v: '20', l: '20%' },
                    { v: '40', l: '40%' },
                  ].map(o => (
                    <button key={o.v} type="button" onClick={() => setMermaPct(o.v)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border ${mermaPct === o.v ? 'bg-terracotta text-white border-terracotta' : 'bg-white text-ink-soft border-warm-gray/30'}`}>{o.l}</button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving || !selectedIng} className="flex-1 bg-terracotta text-white rounded-full py-2 text-sm font-semibold disabled:opacity-50">
                    {saving ? 'Añadiendo...' : 'Añadir'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setSelectedIng(''); setCantidad(''); setMermaPct('0'); }} className="flex-1 border border-warm-gray/30 text-ink-soft rounded-full py-2 text-sm font-medium">Cancelar</button>
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
  const location = useLocation();
  useAuth();
  const { restauranteId } = useRestaurant();
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNombre, setEditandoNombre] = useState('');
  const [editandoPorc, setEditandoPorc] = useState('1');
  const [saving, setSaving] = useState(false);
  const [platosCount, setPlatosCount] = useState({});
  const [editRecetaId, setEditRecetaId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!restauranteId) return;
    fetchRecetas();
  }, [restauranteId]);

  useEffect(() => {
    const recipeId = location.state?.expandRecipeId;
    if (recipeId) {
      setExpandedId(recipeId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
        for (const p of platos) counts[p.receta_id] = (counts[p.receta_id] || 0) + 1;
      }
      setPlatosCount(counts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!editandoNombre.trim()) return;
    setSaving(true);
    try {
      const data = { restaurante_id: restauranteId, nombre: editandoNombre.trim(), porciones_base: parseInt(editandoPorc) || 1 };
      if (editandoId) {
        await supabase.from('recetas_base').update(data).eq('id', editandoId);
      } else {
        const { data: nuevo } = await supabase.from('recetas_base').insert([data]).select('id').single();
        setEditRecetaId(nuevo?.id);
      }
      setShowForm(false);
      setEditandoId(null);
      setEditandoNombre('');
      setEditandoPorc('1');
      setError(null);
      fetchRecetas();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta receta base?')) return;
    try {
      await supabase.from('recetas_base').delete().eq('id', id);
      fetchRecetas();
    } catch (err) {
      setError(err.message);
    }
  }

  function abrirEditar(rb) {
    setEditandoId(rb.id);
    setEditandoNombre(rb.nombre);
    setEditandoPorc(String(rb.porciones_base));
    setShowForm(true);
  }

  function abrirNueva() {
    setEditandoId(null);
    setEditandoNombre('');
    setEditandoPorc('1');
    setShowForm(true);
  }

  return (
    <div className="min-h-screen bg-cream pb-4">
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-olive/10 text-ink transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg">Recetas</span>
          <button onClick={abrirNueva} className="flex items-center gap-1 bg-terracotta text-white rounded-full px-4 py-2 text-sm font-semibold">
            <Plus className="h-4 w-4" /> Nueva receta
          </button>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
          </div>
        )}

        {loading ? (
          [1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))
        ) : recetas.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <BookOpen className="h-12 w-12 text-warm-gray mx-auto mb-3" />
            <p className="text-ink-soft">No hay recetas aún.</p>
            <p className="text-sm text-warm-gray mt-1">Crea una para empezar a gestionar tus ingredientes.</p>
          </div>
        ) : (
          recetas.map(rb => {
            const isOpen = expandedId === rb.id;
            return (
            <div key={rb.id} className="space-y-1">
              <div className="bg-white rounded-xl border border-warm-gray/10 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(isOpen ? null : rb.id)}
                  className="w-full px-4 py-3 border-b border-warm-gray/10 flex items-center justify-between text-left bg-olive/5 hover:bg-olive/10 transition-colors border-l-4 border-l-olive"
                >
                  <div>
                    <h3 className="font-bold text-ink">{rb.nombre}</h3>
                    <p className="text-xs text-warm-gray">
                      para {rb.porciones_base}
                    </p>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => abrirEditar(rb)} className="p-1.5 rounded-full hover:bg-olive/10 text-olive transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(rb.id)} className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </button>
                {isOpen && <RecetaCard receta={rb} onRecetaChange={fetchRecetas} />}
              </div>
            </div>
            );
          })
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => { setShowForm(false); setEditandoId(null); }}>
          <div className="fixed inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-ink text-lg mb-4">{editandoId ? 'Editar receta' : 'Nueva receta'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Nombre</label>
                <input type="text" value={editandoNombre} onChange={e => setEditandoNombre(e.target.value)}
                  className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none"
                  placeholder="Ej: Paella valenciana" required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Porciones base</label>
                <input type="number" min="1" value={editandoPorc} onChange={e => setEditandoPorc(e.target.value)}
                  className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none" />
                <p className="text-xs text-warm-gray mt-1">Número de personas para las que está pensada esta receta.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || !editandoNombre.trim()}
                  className="flex-1 bg-terracotta text-white rounded-full py-3 font-semibold disabled:opacity-60">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin inline" /> Guardando...</> : editandoId ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditandoId(null); }}
                  className="flex-1 border border-warm-gray/30 text-ink-soft rounded-full py-3 font-medium">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
