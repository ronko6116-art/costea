import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { CATEGORIAS } from '../../utils/categorias';
import { formatearMoneda } from '../../functions/formatters';

export default function RecetaManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isRecetaBaseMode = location.pathname.startsWith('/recetas/');
  useAuth();
  const { restauranteId } = useRestaurant();
  const [plato, setPlato] = useState(null);
  const [recetaBase, setRecetaBase] = useState(null);
  const [receta, setReceta] = useState([]);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedIngrediente, setSelectedIngrediente] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [merma, setMerma] = useState('0');
  const [saving, setSaving] = useState(false);
  const [creandoIngrediente, setCreandoIngrediente] = useState(false);
  const [nuevoIngNombre, setNuevoIngNombre] = useState('');
  const [nuevoIngUnidad, setNuevoIngUnidad] = useState('kg');
  const [nuevoIngCategoria, setNuevoIngCategoria] = useState('');
  const [nuevoIngPrecioCompra, setNuevoIngPrecioCompra] = useState('');

  // Cargar datos
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        let recetaId, restauranteBusqueda;

        if (isRecetaBaseMode) {
          const { data: rbData, error: rbError } = await supabase
            .from('recetas_base')
            .select('*')
            .eq('id', id)
            .single();
          if (rbError) throw rbError;
          setRecetaBase(rbData);
          recetaId = rbData.id;
          restauranteBusqueda = rbData.restaurante_id;
        } else {
          const { data: platoData, error: platoError } = await supabase
            .from('platos')
            .select('*, receta_base:receta_id(*)')
            .eq('id', id)
            .single();
          if (platoError) throw platoError;
          setPlato(platoData);
          if (platoData.receta_base) setRecetaBase(platoData.receta_base);
          recetaId = platoData.receta_id;
          restauranteBusqueda = platoData.restaurante_id;
        }
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
          .eq('receta_id', recetaId);
        if (recetaError) throw recetaError;
        setReceta(recetaData || []);

        // Obtener ingredientes del restaurante del plato    
        let { data: ingredientesData, error: ingredientesError } = await supabase
          .from('ingredientes')
          .select('id, nombre, unidad_medida, precio_actual, proveedor_habitual_id')
          .eq('restaurante_id', restauranteBusqueda);
        if (ingredientesError) throw ingredientesError;

        // Fallback 1: probar con el restaurante activo del usuario
        if (!ingredientesData?.length && restauranteId && restauranteId !== restauranteBusqueda) {
          console.warn('RecetaManager: plato.restaurante_id=%s no tiene ingredientes, fallback a restaurante activo=%s', restauranteBusqueda, restauranteId);
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('ingredientes')
            .select('id, nombre, unidad_medida, precio_actual, proveedor_habitual_id')
            .eq('restaurante_id', restauranteId);
          if (!fallbackError && fallbackData?.length) {
            ingredientesData = fallbackData;
          }
        }

        // Fallback 2: si sigue vacío, traer todos (como hace IngredienteList)
        if (!ingredientesData?.length) {
          console.warn('RecetaManager: sin ingredientes para restaurante_id=%s (plato) ni activo=%s, trayendo todos', restauranteBusqueda, restauranteId);
          const { data: allData, error: allError } = await supabase
            .from('ingredientes')
            .select('id, nombre, unidad_medida, precio_actual, proveedor_habitual_id')
            .order('nombre');
          if (!allError && allData?.length) {
            ingredientesData = allData;
          }
        }

        // Obtener precios por proveedor (el más reciente por ingrediente)
        const { data: preciosData } = await supabase
          .from('precios_proveedor')
          .select('ingrediente_id, precio, updated_at, proveedor:proveedor_id(nombre)')
          .order('updated_at', { ascending: false });

        // Mapa: por cada ingrediente, el precio más reciente (sin importar proveedor)
        const precioRecienteMap = {};
        if (preciosData) {
          for (const pp of preciosData) {
            if (!precioRecienteMap[pp.ingrediente_id]) {
              precioRecienteMap[pp.ingrediente_id] = pp;
            }
          }
        }

        // Obtener nombres de proveedores para el fallback
        const { data: proveedoresData } = await supabase
          .from('proveedores')
          .select('id, nombre');
        const proveedoresMap = {};
        if (proveedoresData) {
          for (const p of proveedoresData) proveedoresMap[p.id] = p.nombre;
        }

        // Construir precioReciente por ingrediente con fallback a precio_actual
        function getPrecioInfo(ing) {
          const pp = precioRecienteMap[ing.id];
          if (pp) return pp;
          if (ing.precio_actual > 0) {
            const nomProveedor = proveedoresMap[ing.proveedor_habitual_id] || null;
            return {
              precio: ing.precio_actual,
              proveedor: nomProveedor ? { nombre: nomProveedor } : null,
              desdeTabla: true,
            };
          }
          return null;
        }

        // Mapa: por nombre normalizado, el ingrediente con datos más recientes
        const nombreMap = {};
        for (const ing of ingredientesData || []) {
          const key = ing.nombre.toLowerCase().trim();
          const existente = nombreMap[key];
          const precioInfo = getPrecioInfo(ing);
          if (!existente) {
            nombreMap[key] = { ...ing, precioReciente: precioInfo };
          } else {
            // Si el nuevo tiene precio y el existente no, reemplazar
            if (precioInfo && !existente.precioReciente) {
              nombreMap[key] = { ...ing, precioReciente: precioInfo };
            }
            // Si ambos tienen, quedarse con el de updated_at más reciente
            if (precioInfo && existente.precioReciente) {
              const nuevoUpdated = precioInfo.updated_at || '';
              const existenteUpdated = existente.precioReciente.updated_at || '';
              if (nuevoUpdated > existenteUpdated) {
                nombreMap[key] = { ...ing, precioReciente: precioInfo };
              }
            }
          }
        }

        const ingredientesDedup = Object.values(nombreMap);

        // Filtrar los que ya están en la receta
        const idsEnReceta = recetaData.map(r => r.ingrediente.id);
        const disponibles = ingredientesDedup.filter(i => !idsEnReceta.includes(i.id));
        setIngredientesDisponibles(disponibles);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isRecetaBaseMode, restauranteId]);

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
            receta_id: recetaBase?.id || plato?.receta_id,
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
            precioReciente: null,
          }
        ]);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCrearIngrediente = async () => {
    if (!nuevoIngNombre.trim()) return;
    setSaving(true);
    try {
      const restauranteActual = plato?.restaurante_id || recetaBase?.restaurante_id;
      if (!restauranteActual) throw new Error('Restaurante no identificado');

      const { data: nuevoIng, error } = await supabase
        .from('ingredientes')
        .insert([{
          restaurante_id: restauranteActual,
          nombre: nuevoIngNombre.trim(),
          unidad_medida: nuevoIngUnidad,
          precio_actual: parseFloat(nuevoIngPrecioCompra) || 0,
          categoria: nuevoIngCategoria || null,
        }])
        .select('id, nombre, unidad_medida, precio_actual')
        .single();
      if (error) throw error;

      // Añadir a disponibles y seleccionarlo automáticamente
      setIngredientesDisponibles(prev => [...prev, { ...nuevoIng, precioReciente: { precio: nuevoIng.precio_actual } }]);
      setSelectedIngrediente(nuevoIng.id);
      setCreandoIngrediente(false);
      setNuevoIngNombre('');
      setNuevoIngUnidad('kg');
      setNuevoIngCategoria('');
      setNuevoIngPrecioCompra('');
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isRecetaBaseMode) {
      navigate('/recetas');
    } else {
      navigate(`/plato/${id}`);
    }
  };

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
            {recetaBase?.nombre || plato?.nombre || 'Receta'}
          </span>
          {recetaBase && (
            <span className="text-xs text-warm-gray">
              Base: {recetaBase.porciones_base} porc.
            </span>
          )}
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
                        {formatearMoneda(linea.ingrediente.precio_actual)} / {linea.ingrediente.unidad_medida}
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

                {creandoIngrediente ? (
                  /* Formulario de creación rápida */
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={nuevoIngNombre}
                      onChange={(e) => setNuevoIngNombre(e.target.value)}
                      placeholder="Nombre del ingrediente"
                      className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none"
                      autoFocus
                      required
                    />
                    <select
                      value={nuevoIngUnidad}
                      onChange={(e) => setNuevoIngUnidad(e.target.value)}
                      className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="ml">ml</option>
                      <option value="unidad">unidad</option>
                      <option value="docena">docena</option>
                    </select>
                    <select
                      value={nuevoIngCategoria}
                      onChange={(e) => setNuevoIngCategoria(e.target.value)}
                      className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none"
                    >
                      <option value="">Sin categoría</option>
                      {CATEGORIAS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={nuevoIngPrecioCompra}
                      onChange={(e) => setNuevoIngPrecioCompra(e.target.value)}
                      placeholder="Precio de compra (€)"
                      className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCrearIngrediente}
                        disabled={saving || !nuevoIngNombre.trim()}
                        className="flex-1 bg-olive text-white rounded-full py-2 text-sm font-semibold disabled:opacity-50"
                      >
                        {saving ? (
                          <><Loader2 className="h-4 w-4 animate-spin inline" /> Creando...</>
                        ) : 'Crear y seleccionar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreandoIngrediente(false)}
                        className="flex-1 border border-warm-gray/30 text-ink-soft rounded-full py-2 text-sm font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Select con ingredientes disponibles + opción de crear nuevo */
                  <>
                    <select
                      value={selectedIngrediente}
                      onChange={(e) => {
                        if (e.target.value === '__nuevo__') {
                          setCreandoIngrediente(true);
                          setSelectedIngrediente('');
                        } else {
                          setSelectedIngrediente(e.target.value);
                        }
                      }}
                      className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none"
                      required
                    >
                      <option value="">Selecciona...</option>
                      {ingredientesDisponibles.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.precioReciente
                            ? `${i.nombre} - ${formatearMoneda(i.precioReciente.precio)}/${i.unidad_medida} - ${i.precioReciente.proveedor?.nombre || '?'}`
                            : `${i.nombre} - sin precio`
                          }
                        </option>
                      ))}
                      <option value="__nuevo__" className="text-terracotta font-semibold">+ Crear nuevo ingrediente...</option>
                    </select>
                    {ingredientesDisponibles.length === 0 && (
                      <p className="text-xs text-warm-gray mt-1">No hay ingredientes disponibles. Crea uno nuevo desde el selector.</p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1">Cantidad</label>
                  <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none"
                  placeholder="ej. 0.125"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1">Merma</label>
                <div className="flex gap-2">
                  {[
                    { value: '0', label: 'Sin merma' },
                    { value: '20', label: 'Media: Verduras/Carnes/Legumbres 20%' },
                    { value: '40', label: 'Alta: Pescados/Mariscos 40%' },
                  ].map((opcion) => (
                    <button
                      key={opcion.value}
                      type="button"
                      onClick={() => setMerma(opcion.value)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        merma === opcion.value
                          ? 'bg-terracotta text-white border-terracotta'
                          : 'bg-cream text-ink-soft border-warm-gray/30 hover:border-terracotta/50'
                      }`}
                    >
                      {opcion.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving || !selectedIngrediente}
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
        <div className="mt-4 text-xs text-warm-gray bg-white/50 p-3 rounded-xl border border-warm-gray/10 space-y-1">
          <p>Los cambios se guardan automáticamente al añadir o eliminar ingredientes.</p>
          {!isRecetaBaseMode && plato?.factor_porcion && (
            <p>El plato aplica un factor de {plato.factor_porcion}x sobre esta receta base. El coste final se ajusta automáticamente.</p>
          )}
        </div>
      </main>
    </div>
  );
}