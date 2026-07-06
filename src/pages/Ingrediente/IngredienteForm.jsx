// src/IngredienteForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { CATEGORIAS } from '../../utils/categorias';

export default function IngredienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  useAuth();
  const { restauranteId } = useRestaurant();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    unidad_medida: 'kg',
    precio_actual: '',
    fecha_compra: new Date().toISOString().slice(0, 10),
    categoria: '',
    proveedor_habitual_id: '',
    nuevoProveedorNombre: '',
  });
  const [proveedores, setProveedores] = useState([]);
  const [mostrarNuevoProveedor, setMostrarNuevoProveedor] = useState(false);
  const [fechaOriginal, setFechaOriginal] = useState(null);
  const [showTipoCompra, setShowTipoCompra] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!restauranteId) return;

      // Obtener todos los proveedores (sin filtrar por restaurante)
      const { data: pData, error: pError } = await supabase
        .from('proveedores')
        .select('id, nombre')
        .order('nombre');
      if (!pError) setProveedores(pData);

      // Si es edición, cargar ingrediente
      if (id) {
        setLoading(true);
        const { data: iData, error: iError } = await supabase
          .from('ingredientes')
          .select('*')
          .eq('id', id)
          .single();
        if (iError) {
          setError(iError.message);
        } else {
          setFormData({
            nombre: iData.nombre || '',
            unidad_medida: iData.unidad_medida || 'kg',
            precio_actual: iData.precio_actual || '',
            fecha_compra: iData.fecha_compra || new Date().toISOString().slice(0, 10),
            categoria: iData.categoria || '',
            proveedor_habitual_id: iData.proveedor_habitual_id || '',
            nuevoProveedorNombre: '',
          });
          setFechaOriginal(iData.fecha_compra || null);

        }
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  function handleSubmit(e) {
    e.preventDefault();
    if (!restauranteId) {
      setError('Restaurante no definido');
      return;
    }
    if (id && fechaOriginal && formData.fecha_compra !== fechaOriginal) {
      setShowTipoCompra(true);
      return;
    }
    doSave();
  }

  function cerrarModal() {
    setShowTipoCompra(false);
    setError(null);
  }

  async function doSave(tipo) {
    setSaving(true);
    setError(null);
    setShowTipoCompra(false);

    try {
      let proveedorId = formData.proveedor_habitual_id;

      if (formData.proveedor_habitual_id === '__nuevo__' && formData.nuevoProveedorNombre?.trim()) {
        const { data: newProv, error: provError } = await supabase
          .from('proveedores')
          .insert([{ restaurante_id: restauranteId, nombre: formData.nuevoProveedorNombre.trim() }])
          .select()
          .single();
        if (provError) throw provError;
        proveedorId = newProv.id;
        setProveedores(prev => [...prev, { id: newProv.id, nombre: newProv.nombre }]);
      }

      const precioNum = parseFloat(formData.precio_actual) || 0;

      if (id && tipo === 'pasada') {
        const { data: ingActual } = await supabase
          .from('ingredientes')
          .select('precio_actual, restaurante_id, proveedor_habitual_id')
          .eq('id', id)
          .single();

        await supabase
          .from('precios_historicos')
          .insert({
            ingrediente_id: id,
            precio: precioNum,
            fecha: formData.fecha_compra,
            precio_anterior: ingActual?.precio_actual || 0,
            precio_nuevo: precioNum,
            restaurante_id: ingActual?.restaurante_id || restauranteId,
            proveedor_id: ingActual?.proveedor_habitual_id || null,
            creado_en: new Date().toISOString(),
          });

        navigate('/ingredientes', { replace: true });
        return;
      }

      const dataToSave = {
        restaurante_id: restauranteId,
        nombre: formData.nombre,
        unidad_medida: formData.unidad_medida,
        precio_actual: precioNum,
        fecha_compra: formData.fecha_compra || new Date().toISOString().slice(0, 10),
        categoria: formData.categoria || null,
        proveedor_habitual_id: proveedorId || null,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (id) {
        result = await supabase
          .from('ingredientes')
          .update(dataToSave)
          .eq('id', id);
      } else {
        dataToSave.created_at = new Date().toISOString();
        result = await supabase
          .from('ingredientes')
          .insert([dataToSave]);
      }
      if (result.error) throw result.error;

      if (id) {
        const { data: lastRecord } = await supabase
          .from('precios_historicos')
          .select('id')
          .eq('ingrediente_id', id)
          .order('creado_en', { ascending: false })
          .limit(1);
        if (lastRecord?.length) {
          await supabase
            .from('precios_historicos')
            .update({ fecha: formData.fecha_compra })
            .eq('id', lastRecord[0].id);
        }
      }

      navigate('/ingredientes', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const handleDelete = async () => {
    if (!id || !window.confirm('¿Eliminar este ingrediente?')) return;
    setSaving(true);
    const { error } = await supabase
      .from('ingredientes')
      .delete()
      .eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      navigate('/ingredientes', { replace: true });
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center p-8">Cargando...</div>;

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
          <span className="font-bold text-ink text-lg">
            {id ? 'Editar ingrediente' : 'Nuevo ingrediente'}
          </span>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Nombre *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Unidad de medida *
            </label>
            <select
              name="unidad_medida"
              value={formData.unidad_medida}
              onChange={handleChange}
              className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="l">l</option>
              <option value="ml">ml</option>
              <option value="unidad">unidad</option>
              <option value="docena">docena</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Precio actual (€) *
            </label>
            <input
              type="number"
              name="precio_actual"
              value={formData.precio_actual}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Fecha de compra
            </label>
            <input
              type="date"
              name="fecha_compra"
              value={formData.fecha_compra}
              onChange={handleChange}
              className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Categoría
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
            >
              <option value="">Sin categoría</option>
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Proveedor habitual
            </label>
            {mostrarNuevoProveedor ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.nuevoProveedorNombre}
                  onChange={e => setFormData(prev => ({ ...prev, nuevoProveedorNombre: e.target.value, proveedor_habitual_id: '__nuevo__' }))}
                  className="flex-1 rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                  placeholder="Nombre del nuevo proveedor..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setMostrarNuevoProveedor(false); setFormData(prev => ({ ...prev, proveedor_habitual_id: '', nuevoProveedorNombre: '' })); }}
                  className="text-sm text-warm-gray hover:text-ink px-2"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <select
                name="proveedor_habitual_id"
                value={formData.proveedor_habitual_id}
                onChange={(e) => {
                  if (e.target.value === '__nuevo__') {
                    setMostrarNuevoProveedor(true);
                    setFormData(prev => ({ ...prev, proveedor_habitual_id: '__nuevo__' }));
                  } else {
                    setFormData(prev => ({ ...prev, proveedor_habitual_id: e.target.value }));
                  }
                }}
                className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
              >
                <option value="">Ninguno</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
                <option value="__nuevo__">+ Crear nuevo...</option>
              </select>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-terracotta text-white rounded-full py-3 font-semibold disabled:opacity-60"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Guardando...' : id ? 'Actualizar' : 'Crear'}
            </button>
            {id && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-red-500 text-white rounded-full px-5 py-3 font-semibold disabled:opacity-60"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>

        {showTipoCompra && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={cerrarModal}>
            <div className="fixed inset-0 bg-black/40" />
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-ink text-lg mb-2">¿Qué tipo de compra es?</h3>
              <p className="text-sm text-ink-soft mb-4">
                Ha cambiado la fecha de compra. ¿Es el precio actual del ingrediente o una compra pasada que solo debe registrarse en el histórico?
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => doSave('actual')}
                  className="w-full text-left bg-olive text-white rounded-xl px-4 py-3 font-semibold hover:bg-olive-dark transition-colors"
                >
                  <span className="block">Compra actual</span>
                  <span className="block text-xs opacity-80 mt-0.5">Actualiza el precio del ingrediente en las recetas</span>
                </button>
                <button
                  type="button"
                  onClick={() => doSave('pasada')}
                  className="w-full text-left border border-warm-gray/30 text-ink rounded-xl px-4 py-3 font-semibold hover:bg-warm-gray/5 transition-colors"
                >
                  <span className="block">Compra pasada</span>
                  <span className="block text-xs text-warm-gray mt-0.5">Solo afecta a gráficos e histórico, no a las recetas</span>
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="w-full text-center text-sm text-warm-gray hover:text-ink py-2 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}