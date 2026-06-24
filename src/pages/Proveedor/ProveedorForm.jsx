// src/ProveedorForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Save, Trash2, Building2, Phone, MapPin, StickyNote, ChevronDown } from 'lucide-react';

const ESTADO_INICIAL = {
  nombre: '',
  cif: '',
  email_facturacion: '',
  telefono: '',
  persona_contacto: '',
  direccion: '',
  ciudad: '',
  codigo_postal: '',
  provincia: '',
  pais: 'ES',
  web: '',
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
            cif: data.cif || '',
            email_facturacion: data.email_facturacion || '',
            telefono: data.telefono || '',
            persona_contacto: data.persona_contacto || '',
            direccion: data.direccion || '',
            ciudad: data.ciudad || '',
            codigo_postal: data.codigo_postal || '',
            provincia: data.provincia || '',
            pais: data.pais || 'ES',
            web: data.web || '',
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
      cif: limpiar(formData.cif),
      email_facturacion: limpiar(formData.email_facturacion),
      telefono: limpiar(formData.telefono),
      persona_contacto: limpiar(formData.persona_contacto),
      direccion: limpiar(formData.direccion),
      ciudad: limpiar(formData.ciudad),
      codigo_postal: limpiar(formData.codigo_postal),
      provincia: limpiar(formData.provincia),
      pais: formData.pais || 'ES',
      web: limpiar(formData.web),
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

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ===== Sección: Identificación ===== */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-sm font-semibold text-ink-soft uppercase tracking-wide mb-2">
              <Building2 className="h-4 w-4" />
              Identificación
            </legend>

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
          </fieldset>

          {/* ===== Más datos (opcional) ===== */}
          <details className="group">
            <summary className="flex items-center gap-2 text-sm font-semibold text-ink-soft cursor-pointer hover:text-ink transition-colors list-none [&::-webkit-details-marker]:hidden">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              Más datos (opcional)
            </summary>

            <div className="mt-4 space-y-6">
              {/* Identificación extra */}
              <fieldset className="space-y-4">
                <div>
                  <label className={labelClass}>CIF / NIF</label>
                  <input
                    type="text"
                    name="cif"
                    value={formData.cif}
                    onChange={handleChange}
                    maxLength={20}
                    className={inputClass}
                    placeholder="B12345678"
                  />
                </div>

                <div>
                  <label className={labelClass}>Sitio web</label>
                  <input
                    type="url"
                    name="web"
                    value={formData.web}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="https://proveedor.com"
                  />
                </div>
              </fieldset>

              {/* Contacto */}
              <fieldset className="space-y-4">
                <legend className="flex items-center gap-2 text-sm font-semibold text-ink-soft uppercase tracking-wide mb-2">
                  <Phone className="h-4 w-4" />
                  Contacto
                </legend>

                <div>
                  <label className={labelClass}>Persona de contacto</label>
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Teléfono</label>
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
                    <label className={labelClass}>Email factura.</label>
                    <input
                      type="email"
                      name="email_facturacion"
                      value={formData.email_facturacion}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="facturas@..."
                    />
                  </div>
                </div>
              </fieldset>

              {/* Dirección */}
              <fieldset className="space-y-4">
                <legend className="flex items-center gap-2 text-sm font-semibold text-ink-soft uppercase tracking-wide mb-2">
                  <MapPin className="h-4 w-4" />
                  Dirección
                </legend>

                <div>
                  <label className={labelClass}>Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    maxLength={120}
                    className={inputClass}
                    placeholder="Calle, número"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Ciudad</label>
                    <input
                      type="text"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleChange}
                      maxLength={60}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>C. Postal</label>
                    <input
                      type="text"
                      name="codigo_postal"
                      value={formData.codigo_postal}
                      onChange={handleChange}
                      maxLength={10}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Provincia</label>
                    <input
                      type="text"
                      name="provincia"
                      value={formData.provincia}
                      onChange={handleChange}
                      maxLength={60}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>País</label>
                    <select
                      name="pais"
                      value={formData.pais}
                      onChange={handleChange}
                      className={inputClass}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="ES">España</option>
                      <option value="PT">Portugal</option>
                      <option value="FR">Francia</option>
                      <option value="IT">Italia</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Notas */}
              <fieldset className="space-y-4">
                <legend className="flex items-center gap-2 text-sm font-semibold text-ink-soft uppercase tracking-wide mb-2">
                  <StickyNote className="h-4 w-4" />
                  Notas
                </legend>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                  maxLength={300}
                  className={`${inputClass} resize-none`}
                  placeholder="Ej: entrega los lunes, mínimo 50€, descuento por volumen..."
                />
              </fieldset>
            </div>
          </details>

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
