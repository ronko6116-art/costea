import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

const FACTORES = [
  { value: '0.25', label: 'Tapa (0.25x)' },
  { value: '0.5', label: 'Media ración (0.5x)' },
  { value: '1', label: 'Ración (1x)' },
  { value: '2', label: 'Doble ración (2x)' },
];

export default function PlatoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  useAuth();
  const { restauranteId } = useRestaurant();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [recetasBase, setRecetasBase] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    precio_venta: '',
    margen_objetivo: '70',
    factor_porcion: '1',
    receta_id: '',
    activo: true,
  });

  useEffect(() => {
    if (!restauranteId) return;
    const fetchRecetas = async () => {
      const { data } = await supabase
        .from('recetas_base')
        .select('id, nombre, porciones_base')
        .eq('restaurante_id', restauranteId)
        .order('nombre');
      if (data) setRecetasBase(data);
    };
    fetchRecetas();
  }, [restauranteId]);

  useEffect(() => {
    if (id) {
      const fetchPlato = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('platos')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          setError(error.message);
        } else {
          setFormData({
            nombre: data.nombre || '',
            categoria: data.categoria || '',
            precio_venta: data.precio_venta || '',
            margen_objetivo: data.margen_objetivo || '70',
            factor_porcion: String(data.factor_porcion || '1'),
            receta_id: data.receta_id || '',
            activo: data.activo !== undefined ? data.activo : true,
          });
        }
        setLoading(false);
      };
      fetchPlato();
    }
  }, [id]);

  const handleRecetaChange = (recetaId) => {
    const receta = recetasBase.find(r => r.id === recetaId);
    setFormData(prev => ({
      ...prev,
      receta_id: recetaId,
      nombre: receta?.nombre || '',
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restauranteId) {
      setError('No se pudo determinar el restaurante');
      return;
    }
    if (!formData.receta_id) {
      setError('Selecciona una receta base');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const dataToSave = {
        restaurante_id: restauranteId,
        nombre: formData.nombre,
        categoria: formData.categoria || null,
        precio_venta: parseFloat(formData.precio_venta),
        margen_objetivo: parseFloat(formData.margen_objetivo) || 70,
        factor_porcion: parseFloat(formData.factor_porcion) || 1,
        receta_id: formData.receta_id,
        activo: formData.activo,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (id) {
        result = await supabase
          .from('platos')
          .update(dataToSave)
          .eq('id', id);
      } else {
        dataToSave.created_at = new Date().toISOString();
        result = await supabase
          .from('platos')
          .insert([dataToSave]);
      }
      if (result.error) throw result.error;
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('¿Estás seguro de eliminar este plato?')) return;
    setSaving(true);
    const { error } = await supabase
      .from('platos')
      .delete()
      .eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard', { replace: true });
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
            aria-label="Volver"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg">
            {id ? 'Editar plato' : 'Nuevo plato'}
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
              Receta base *
            </label>
            <select
              name="receta_id"
              value={formData.receta_id}
              onChange={e => handleRecetaChange(e.target.value)}
              required
              className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
            >
              <option value="">Selecciona una receta...</option>
              {recetasBase.map(rb => (
                <option key={rb.id} value={rb.id}>
                  {rb.nombre} ({rb.porciones_base} porc.)
                </option>
              ))}
            </select>
            {recetasBase.length === 0 && (
              <p className="text-xs text-warm-gray mt-1">
                No hay recetas. Crea una desde la sección Recetas primero.
              </p>
            )}
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
              <option value="">Seleccionar</option>
              <option value="entrantes">Entrantes</option>
              <option value="principales">Principales</option>
              <option value="postres">Postres</option>
              <option value="bebidas">Bebidas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Cantidad / Ración
            </label>
            <select
              name="factor_porcion"
              value={formData.factor_porcion}
              onChange={handleChange}
              className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
            >
              {FACTORES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Margen objetivo (%)
            </label>
            <input
              type="number"
              name="margen_objetivo"
              value={formData.margen_objetivo}
              onChange={handleChange}
              step="0.5"
              min="0"
              max="100"
              className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
              placeholder="70"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Precio de venta (€) *
            </label>
            <input
              type="number"
              name="precio_venta"
              value={formData.precio_venta}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
              placeholder="Ej: 18.50"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              id="activo"
              className="w-5 h-5 rounded border-warm-gray/30 text-terracotta focus:ring-terracotta"
            />
            <label htmlFor="activo" className="text-sm font-medium text-ink">
              Plato activo (visible en carta)
            </label>
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
      </main>
    </div>
  );
}
