import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Plus, Trash2, AlertTriangle, Check } from 'lucide-react';

export default function RecetaManager() {
  const { id } = useParams(); // id del plato
  const navigate = useNavigate();
  const { session } = useAuth();
  const [plato, setPlato] = useState(null);
  const [receta, setReceta] = useState([]);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIngrediente, setSelectedIngrediente] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [merma, setMerma] = useState('0');
  const [saving, setSaving] = useState(false);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        // Obtener datos del plato
        const { data: platoData, error: platoError } = await supabase
          .from('platos')
          .select('*')
          .eq('id', id)
          .single();
        if (platoError) throw platoError;
        setPlato(platoData);

        // Obtener receta actual con ingredientes
        const { data: recetaData, error: recetaError } = await supabase
          .from('receta_lineas')
          .select(`
            id,
            cantidad,
            merma_pct,
            ingrediente:ingredientes (
              id,
              nombre,
              unidad_medida,
              precio_actual
            )
          `)
          .eq('plato_id', id);
        if (recetaError) throw recetaError;
        setReceta(recetaData || []);

        // Obtener todos los ingredientes del restaurante para el select
        const { data: ingredientesData, error: ingredientesError } = await supabase
          .from('ingredientes')
          .select('id, nombre, unidad_medida')
          .eq('restaurante_id', platoData.restaurante_id);
        if (ingredientesError) throw ingredientesError;

        // Filtrar los que ya están en la receta
        const idsEnReceta = recetaData.map(r => r.ingrediente.id);
        const disponibles = ingredientesData.filter(i => !idsEnReceta.includes(i.id));
        setIngredientesDisponibles(disponibles);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddIngrediente = async (e) => {
    e.preventDefault();
    if (!selectedIngrediente || !cantidad) {
      setError('Selecciona un ingrediente y una cantidad');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('receta_lineas')
        .insert([
          {
            plato_id: id,
            ingrediente_id: selectedIngrediente,
            cantidad: parseFloat(cantidad),
            merma_pct: parseFloat(merma) || 0,
          }
        ])
        .select(`
          id,
          cantidad,
          merma_pct,
          ingrediente:ingredientes (
            id,
            nombre,
            unidad_medida,
            precio_actual
          )
        `)
        .single();

      if (error) throw error;

      // Actualizar lista local
      setReceta([...receta, data]);
      // Quitar de disponibles
      const ingredienteRemovido = ingredientesDisponibles.find(i => i.id === selectedIngrediente);
      setIngredientesDisponibles(ingredientesDisponibles.filter(i => i.id !== selectedIngrediente));
      // Resetear formulario
      setSelectedIngrediente('');
      setCantidad('');
      setMerma('0');
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveIngrediente = async (lineaId) => {
    if (!confirm('¿Eliminar este ingrediente de la receta?')) return;

    try {
      const { error } = await supabase
        .from('receta_lineas')
        .delete()
        .eq('id', lineaId);

      if (error) throw error;

      // Actualizar lista local
      const lineaEliminada = receta.find(r => r.id === lineaId);
      setReceta(receta.filter(r => r.id !== lineaId));
      // Devolver a disponibles
      if (lineaEliminada) {
        setIngredientesDisponibles([
          ...ingredientesDisponibles,
          {
            id: lineaEliminada.ingrediente.id,
            nombre: lineaEliminada.ingrediente.nombre,
            unidad_medida: lineaEliminada.ingrediente.unidad_medida,
          }
        ]);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBack = () => {
    navigate(`/plato/${id}`);
  };

  const formatoMoneda = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto mb-4"></div>
          <p className="text-ink-soft">Cargando receta...</p>
        </div>
      </div>
    );
  }

  if (error && !receta.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-sm text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ink mb-2">Error</h2>
          <p className="text-ink-soft">{error}</p>
          <button
            onClick={handleBack}
            className="mt-6 w-full bg-terracotta text-white rounded-full py-3 font-semibold"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-olive/10 text-ink transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg truncate max-w-[60%]">
            {plato?.nombre || 'Receta'}
          </span>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {/* Lista de ingredientes actuales */}
        <div className="bg-white rounded-xl border border-warm-gray/10 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-warm-gray/10 flex justify-between items-center">
            <h3 className="font-semibold text-ink">Ingredientes ({receta.length})</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 text-terracotta font-semibold text-sm"
            >
              <Plus className="h-4 w-4" />
              Añadir
            </button>
          </div>

          {receta.length === 0 ? (
            <div className="px-5 py-8 text-center text-ink-soft">
              <p>Esta receta aún no tiene ingredientes.</p>
              <p className="text-sm">Añade el primero usando el botón "Añadir".</p>
            </div>
          ) : (
            <div className="divide-y divide-warm-gray/10">
              {receta.map((linea) => (
                <div key={linea.id} className="px-5 py-3 flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium text-ink">{linea.ingrediente.nombre}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-warm-gray">
                      <span>{linea.cantidad} {linea.ingrediente.unidad_medida}</span>
                      {linea.merma_pct > 0 && (
                        <span className="text-orange-500">merma {linea.merma_pct}%</span>
                      )}
                      <span>
                        {formatoMoneda.format(linea.ingrediente.precio_actual)} / {linea.ingrediente.unidad_medida}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveIngrediente(linea.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario para añadir ingrediente (condicional) */}
        {showForm && (
          <div className="mt-4 bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm">
            <h4 className="font-semibold text-ink mb-3">Añadir ingrediente</h4>
            {error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleAddIngrediente} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1">Ingrediente</label>
                <select
                  value={selectedIngrediente}
                  onChange={(e) => setSelectedIngrediente(e.target.value)}
                  className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none"
                  required
                >
                  <option value="">Selecciona...</option>
                  {ingredientesDisponibles.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre} ({i.unidad_medida})
                    </option>
                  ))}
                </select>
                {ingredientesDisponibles.length === 0 && (
                  <p className="text-xs text-warm-gray mt-1">
                    Todos los ingredientes ya están en la receta. Crea más ingredientes si lo necesitas.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none"
                  placeholder="ej. 0.25"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1">Merma (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={merma}
                  onChange={(e) => setMerma(e.target.value)}
                  className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none"
                  placeholder="ej. 15"
                />
                <p className="text-xs text-warm-gray mt-1">Porcentaje de desperdicio (opcional).</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving || ingredientesDisponibles.length === 0}
                  className="flex-1 bg-terracotta text-white rounded-full py-2 font-semibold disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Añadir'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-warm-gray/30 text-ink-soft rounded-full py-2 font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Nota informativa */}
        <div className="mt-4 text-xs text-warm-gray bg-white/50 p-3 rounded-xl border border-warm-gray/10">
          <p>Los cambios se guardan automáticamente al añadir o eliminar ingredientes. El coste del plato se actualiza en tiempo real en la vista de detalle.</p>
        </div>
      </main>
    </div>
  );
}