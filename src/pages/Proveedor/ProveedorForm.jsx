// src/ProveedorForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Save, Trash2, Phone, Mail, User, StickyNote } from 'lucide-react';

const ESTADO_INICIAL = {
  nombre: '',
  persona_contacto: '',
  telefono: '',
  email_facturacion: '',
  notas: '',
};

export default function ProveedorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [restauranteId, setRestauranteId] = useState(null);
  const [formData, setFormData] = useState(ESTADO_INICIAL);

  useEffect(() => {
    const fetchData = async () => {
      const { data: rData, error: rError } = await supabase
        .from('restaurantes')
        .select('id')
        .limit(1)
        .single();
      if (rError) {
        setError('No se encontró ningún restaurante.');
        return;
      }
      setRestauranteId(rData.id);

      if (id) {
        setLoading(true);
        const { data, error } = await supabase
          .from('proveedores')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          setError(error.message);
        } else {
          setFormData({
            nombre: data.nombre || '',
            persona_contacto: data.persona_contacto || '',
            telefono: data.telefono || '',
            email_facturacion: data.email_facturacion || '',
            notas: data.notas || '',
          });
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
      setError('Restaurante no definido.');
      return;
    }
    setSaving(true);
    setError(null);

    const limpiar = (v) => (v && v.trim() ? v.trim() : null);

    const dataToSave = {
      restaurante_id: restauranteId,
      nombre: formData.nombre.trim(),
      persona_contacto: limpiar(formData.persona_contacto),
      telefono: limpiar(formData.telefono),
      email_facturacion: limpiar(formData.email_facturacion),
      notas: limpiar(formData.notas),
    };

    try {
      let result;
      if (id) {
        result = await supabase
          .from('proveedores')
          .update(dataToSave)
          .eq('id', id);
      } else {
        result = await supabase
          .from('proveedores')
          .insert([dataToSave]);
      }
      if (result.error) throw result.error;
      navigate('/proveedores');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('¿Eliminar este proveedor?')) return;
    setSaving(true);
    const { error } = await supabase
      .from('proveedores')
      .delete()
      .eq('id', id);
    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      navigate('/proveedores');
    }
  };

  if (loading) return <div className="text-center p-8">Cargando...</div>;

  const inputClass =
    'w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition';
  const labelClass = 'block text-sm font-medium text-ink mb-1';

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
            {id ? 'Editar proveedor' : 'Nuevo proveedor'}
          </span>
          <div className="w-10" />
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
            <label className={labelClass}>Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              maxLength={80}
              className={inputClass}
              placeholder="Ej: Mercados García, Pescados Martínez..."
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-ink mb-1">
              <User className="h-4 w-4 text-warm-gray" />
              Persona de contacto
            </label>
            <input
              type="text"
              name="persona_contacto"
              value={formData.persona_contacto}
              onChange={handleChange}
              maxLength={80}
              className={inputClass}
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-ink mb-1">
              <Phone className="h-4 w-4 text-warm-gray" />
              Teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              maxLength={20}
              className={inputClass}
              placeholder="600 123 456"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-ink mb-1">
              <Mail className="h-4 w-4 text-warm-gray" />
              Email
            </label>
            <input
              type="email"
              name="email_facturacion"
              value={formData.email_facturacion}
              onChange={handleChange}
              className={inputClass}
              placeholder="email@proveedor.com"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-ink mb-1">
              <StickyNote className="h-4 w-4 text-warm-gray" />
              Notas
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={3}
              maxLength={300}
              className={`${inputClass} resize-none`}
              placeholder="Ej: entrega los lunes, mínimo 50€, descuento por volumen..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !formData.nombre.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-terracotta text-white rounded-full py-3 font-semibold disabled:opacity-60 transition-colors hover:bg-terracotta-dark"
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
                aria-label="Eliminar proveedor"
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
