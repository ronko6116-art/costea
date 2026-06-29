// src/IngredienteForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Save, Trash2, Plus, X } from 'lucide-react';

const CATEGORIAS = [
  'Carnes', 'Pescados', 'Frutas y Verduras', 'Frutas', 'Lácteos',
  'Despensa', 'Legumbres y cereales', 'Pastas', 'Congelados',
  'Bebidas', 'Especias', 'Pan', 'Aceites', 'Salsas', 'Conservas',
  'Dulces', 'Limpieza',
];

export default function IngredienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    unidad_medida: 'kg',
    precio_actual: '',
    categoria: '',
    proveedor_habitual_id: '',
    nuevoProveedorNombre: '',
  });
  const [proveedores, setProveedores] = useState([]);
  const [restauranteId, setRestauranteId] = useState(null);
  const [mostrarNuevoProveedor, setMostrarNuevoProveedor] = useState(false);
  const [preciosProveedor, setPreciosProveedor] = useState([]);
  const [nuevoPpProvId, setNuevoPpProvId] = useState('');
  const [nuevoPpPrecio, setNuevoPpPrecio] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      // Obtener restaurante
      const savedId = localStorage.getItem('restauranteId');
      let rId;
      if (savedId) {
        rId = savedId;
      } else {
        const { data: rData, error: rError } = await supabase
          .from('restaurantes')
          .select('id')
          .limit(1)
          .single();
        if (rError) {
          setError('No se encontró restaurante');
          return;
        }
        rId = rData.id;
      }
      setRestauranteId(rId);

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
            categoria: iData.categoria || '',
            proveedor_habitual_id: iData.proveedor_habitual_id || '',
            nuevoProveedorNombre: '',
          });

          // Cargar precios por proveedor de este ingrediente
          const { data: ppData } = await supabase
            .from('precios_proveedor')
            .select('id, precio, proveedor:proveedor_id(nombre)')
            .eq('ingrediente_id', id);
          if (ppData) setPreciosProveedor(ppData);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restauranteId) {
      setError('Restaurante no definido');
      return;
    }
    setSaving(true);
    setError(null);

    let proveedorId = formData.proveedor_habitual_id;

    // Si es un nuevo proveedor, crearlo primero
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

    const dataToSave = {
      restaurante_id: restauranteId,
      nombre: formData.nombre,
      unidad_medida: formData.unidad_medida,
      precio_actual: parseFloat(formData.precio_actual) || 0,
      categoria: formData.categoria || null,
      proveedor_habitual_id: proveedorId || null,
      updated_at: new Date().toISOString(),
    };

    try {
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
      navigate('/ingredientes', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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

  const handleAddPp = async () => {
    if (!nuevoPpProvId || !nuevoPpPrecio || !id) return;
    const precio = parseFloat(nuevoPpPrecio);
    if (isNaN(precio) || precio < 0) return;

    const { data, error } = await supabase
      .from('precios_proveedor')
      .upsert({
        ingrediente_id: id,
        proveedor_id: nuevoPpProvId,
        precio,
      }, { onConflict: 'ingrediente_id, proveedor_id' })
      .select('id, precio, proveedor:proveedor_id(nombre)')
      .single();

    if (error) {
      setError(error.message);
    } else {
      setPreciosProveedor(prev => {
        const idx = prev.findIndex(p => p.proveedor?.nombre === data.proveedor?.nombre);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = data;
          return copy;
        }
        return [...prev, data];
      });
      setNuevoPpProvId('');
      setNuevoPpPrecio('');
    }
  };

  const handleDeletePp = async (ppId) => {
    const { error } = await supabase
      .from('precios_proveedor')
      .delete()
      .eq('id', ppId);
    if (error) {
      setError(error.message);
    } else {
      setPreciosProveedor(prev => prev.filter(p => p.id !== ppId));
    }
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

          {/* Precios por proveedor */}
          {id && (
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Precios por proveedor
              </label>

              {preciosProveedor.length === 0 && (
                <p className="text-sm text-warm-gray mb-2">Sin precios registrados.</p>
              )}

              <div className="space-y-1.5 mb-3">
                {preciosProveedor.map(pp => (
                  <div key={pp.id} className="flex items-center justify-between bg-cream rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-ink truncate">
                        {pp.proveedor?.nombre}
                      </span>
                      <span className="text-sm font-semibold text-olive-dark">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(pp.precio)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePp(pp.id)}
                      className="p-1 rounded-full hover:bg-red-50 text-warm-gray hover:text-red-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <select
                  value={nuevoPpProvId}
                  onChange={(e) => setNuevoPpProvId(e.target.value)}
                  className="flex-1 rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                >
                  <option value="">Seleccionar proveedor...</option>
                  {proveedores
                    .filter(p => !preciosProveedor.some(pp => pp.proveedor?.nombre === p.nombre))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Precio"
                  value={nuevoPpPrecio}
                  onChange={(e) => setNuevoPpPrecio(e.target.value)}
                  className="w-24 rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                />
                <button
                  type="button"
                  onClick={handleAddPp}
                  disabled={!nuevoPpProvId || !nuevoPpPrecio}
                  className="p-2 rounded-full bg-olive text-white hover:bg-olive-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

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
      </main>
    </div>
  );
}