import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { 
  ArrowLeft, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Info,
  Plus,
  X,
  Check,
  Loader2,
  Edit3,
  Trash2
} from 'lucide-react';

export default function PlatoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [plato, setPlato] = useState(null);
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inline editing state for plato fields
  const [editandoPrecioVenta, setEditandoPrecioVenta] = useState(false);
  const [tempPrecioVenta, setTempPrecioVenta] = useState('');
  const [editandoMargenObj, setEditandoMargenObj] = useState(false);
  const [tempMargenObj, setTempMargenObj] = useState('');

  // Modal state
  const [ingredienteEditando, setIngredienteEditando] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);
  const [mostrarNuevoProveedor, setMostrarNuevoProveedor] = useState(false);
  const [savingIngrediente, setSavingIngrediente] = useState(false);
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    unidad_medida: 'kg',
    precio_actual: '',
    categoria: '',
    proveedor_habitual_id: '',
    nuevoProveedorNombre: '',
    cantidad: '',
    merma: '0',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !session) {
        setError('No hay sesión o ID de plato');
        setLoading(false);
        return;
      }

      try {
        const { data: platoData, error: platoError } = await supabase
          .from('vista_coste_platos')
          .select('*')
          .eq('plato_id', id)
          .single();

        if (platoError) throw platoError;
        setPlato(platoData);

        const { data: recetaData, error: recetaError } = await supabase
          .from('receta_lineas')
          .select(`
            id,
            cantidad,
            merma_pct,
            ingrediente:ingrediente_id (
              id,
              nombre,
              unidad_medida,
              precio_actual,
              categoria,
              proveedor_habitual_id
            )
          `)
          .eq('plato_id', id);

        if (recetaError) throw recetaError;

        if (!recetaData || recetaData.length === 0) {
          setIngredientes([]);
        } else {
          let costeTotal = 0;
          const lineasConCoste = recetaData.map(linea => {
            const ingrediente = linea.ingrediente;
            if (!ingrediente) return null;
            const precioUnitario = ingrediente.precio_actual || 0;
            const cantidadConMerma = linea.cantidad * (1 + (linea.merma_pct || 0) / 100);
            const costeLinea = precioUnitario * cantidadConMerma;
            costeTotal += costeLinea;
            return {
              ...linea,
              ingrediente,
              cantidadConMerma,
              costeLinea,
              precioUnitario,
            };
          }).filter(Boolean);
          setIngredientes(lineasConCoste);
        }

        // Fetch all suppliers and categories (global, not per restaurant)
        const { data: provData } = await supabase
          .from('proveedores')
          .select('id, nombre')
          .order('nombre');
        if (provData) setProveedores(provData);

        const { data: catData } = await supabase
          .from('ingredientes')
          .select('categoria')
          .not('categoria', 'is', null)
          .order('categoria');
        if (catData) {
          const unicas = [...new Set(catData.map(c => c.categoria).filter(Boolean))];
          setCategorias(unicas);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message || 'Error al cargar los datos del plato');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, session]);

  const abrirModal = (linea) => {
    setEditFormData({
      nombre: linea.ingrediente.nombre || '',
      unidad_medida: linea.ingrediente.unidad_medida || 'kg',
      precio_actual: linea.ingrediente.precio_actual || '',
      categoria: linea.ingrediente.categoria || '',
      proveedor_habitual_id: linea.ingrediente.proveedor_habitual_id || '',
      nuevoProveedorNombre: '',
      cantidad: linea.cantidad || '',
      merma: linea.merma_pct || '0',
    });
    setMostrarNuevaCategoria(false);
    setMostrarNuevoProveedor(false);
    setIngredienteEditando(linea);
  };

  const cerrarModal = () => {
    setIngredienteEditando(null);
    setMostrarNuevaCategoria(false);
    setMostrarNuevoProveedor(false);
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGuardarIngrediente = async () => {
    const linea = ingredienteEditando;
    if (!linea) return;

    setSavingIngrediente(true);

    const now = new Date().toISOString();

    let proveedorId = editFormData.proveedor_habitual_id;

    // Si es un nuevo proveedor, crearlo primero
    if (editFormData.proveedor_habitual_id === '__nuevo__' && editFormData.nuevoProveedorNombre?.trim()) {
      const { data: newProv, error: provError } = await supabase
        .from('proveedores')
        .insert([{ restaurante_id: plato.restaurante_id, nombre: editFormData.nuevoProveedorNombre.trim() }])
        .select()
        .single();
      if (provError) {
        alert('Error al crear proveedor: ' + provError.message);
        setSavingIngrediente(false);
        return;
      }
      proveedorId = newProv.id;
      setProveedores(prev => [...prev, { id: newProv.id, nombre: newProv.nombre }]);
    }

    const { error: ingError } = await supabase
      .from('ingredientes')
      .update({
        nombre: editFormData.nombre,
        unidad_medida: editFormData.unidad_medida,
        precio_actual: parseFloat(editFormData.precio_actual) || 0,
        categoria: editFormData.categoria || null,
        proveedor_habitual_id: proveedorId || null,
        updated_at: now,
      })
      .eq('id', linea.ingrediente.id);

    if (ingError) {
      alert('Error al guardar ingrediente: ' + ingError.message);
      setSavingIngrediente(false);
      return;
    }

    const { error: recError } = await supabase
      .from('receta_lineas')
      .update({
        cantidad: parseFloat(editFormData.cantidad) || 0,
        merma_pct: parseFloat(editFormData.merma) || 0,
      })
      .eq('id', linea.id);

    if (recError) {
      alert('Error al guardar receta: ' + recError.message);
      setSavingIngrediente(false);
      return;
    }

    // Update local state
    const precioUnitario = parseFloat(editFormData.precio_actual) || 0;
    const cantidad = parseFloat(editFormData.cantidad) || 0;
    const merma = parseFloat(editFormData.merma) || 0;
    const cantidadConMerma = cantidad * (1 + merma / 100);
    const costeLinea = precioUnitario * cantidadConMerma;

    let nuevoCoste = 0;
    const ingredientesActualizados = ingredientes.map(item => {
      if (item.id === linea.id) {
        const actualizado = {
          ...item,
          cantidad,
          merma_pct: merma,
          cantidadConMerma,
          costeLinea,
          precioUnitario,
          ingrediente: {
            ...item.ingrediente,
            nombre: editFormData.nombre,
            unidad_medida: editFormData.unidad_medida,
            precio_actual: precioUnitario,
            categoria: editFormData.categoria || null,
            proveedor_habitual_id: proveedorId || null,
          },
        };
        nuevoCoste += costeLinea;
        return actualizado;
      }
      nuevoCoste += item.costeLinea;
      return item;
    });

    const nuevoMargen = plato.precio_venta > 0
      ? parseFloat(((plato.precio_venta - nuevoCoste) / plato.precio_venta * 100).toFixed(2))
      : 0;

    setIngredientes(ingredientesActualizados);
    setPlato(prev => ({
      ...prev,
      coste_total: nuevoCoste,
      margen_pct: nuevoMargen,
    }));

    cerrarModal();
    setSavingIngrediente(false);
  };

  const handleGuardarPlatoField = async (field, value) => {
    const now = new Date().toISOString();
    const dbUpdates = { updated_at: now };
    const localUpdates = { updated_at: now };

    if (field === 'precio_venta') {
      const nuevoPrecio = parseFloat(value) || 0;
      dbUpdates.precio_venta = nuevoPrecio;
      localUpdates.precio_venta = nuevoPrecio;
      localUpdates.margen_pct = plato.coste_total > 0 && nuevoPrecio > 0
        ? parseFloat(((nuevoPrecio - plato.coste_total) / nuevoPrecio * 100).toFixed(2))
        : 0;
    }
    if (field === 'margen_objetivo') {
      dbUpdates.margen_objetivo = parseFloat(value) || 0;
      localUpdates.margen_objetivo = parseFloat(value) || 0;
    }

    const { error } = await supabase
      .from('platos')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      alert('Error al guardar: ' + error.message);
      return;
    }

    const newPlato = { ...plato, ...localUpdates };
    setPlato(newPlato);

    setEditandoPrecioVenta(false);
    setEditandoMargenObj(false);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este plato? Esta acción no se puede deshacer.')) return;
    const { error } = await supabase
      .from('platos')
      .delete()
      .eq('id', id);
    if (error) {
      alert('Error al eliminar: ' + error.message);
      return;
    }
    navigate('/dashboard', { replace: true });
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
          <p className="text-ink-soft">Cargando el plato...</p>
        </div>
      </div>
    );
  }

  if (error || !plato) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-sm text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ink mb-2">Error al cargar</h2>
          <p className="text-ink-soft">{error || 'No se encontró el plato'}</p>
          <button
            onClick={handleBack}
            className="mt-6 w-full bg-terracotta text-white rounded-full py-3 font-semibold"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  const margenBajo = plato.margen_pct < 50;
  const margenCritico = plato.margen_pct < 35;
  const diferenciaMargen = plato.margen_pct - (plato.margen_objetivo || 70);
  const precioMinimo = plato.margen_objetivo > 0 && plato.margen_objetivo < 100
    ? plato.coste_total / (1 - plato.margen_objetivo / 100)
    : 0;
  const ingredientesSinPrecio = ingredientes.filter(l => !l.precioUnitario);

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
            {plato.plato_nombre}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
              aria-label="Eliminar plato"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate(`/plato/${plato.plato_id}/receta`)}
              className="bg-olive text-white rounded-full px-4 py-2 text-sm font-semibold"
            >
              <Plus className="h-4 w-4 inline mr-1" />
              Receta
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {/* Resumen del plato */}
        <div className="bg-white rounded-xl border border-warm-gray/10 p-5 shadow-sm mb-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-ink">{plato.plato_nombre}</h2>
              {plato.categoria && (
                <span className="text-sm text-warm-gray uppercase tracking-wide">
                  {plato.categoria}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {plato.margen_pct < 50 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  Alerta
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4">
            <div className="sm:col-span-1">
              <p className="text-xs text-warm-gray">Precio venta</p>
              {!editandoPrecioVenta ? (
                <button
                  onClick={() => { setTempPrecioVenta(plato.precio_venta); setEditandoPrecioVenta(true); }}
                  className="font-bold text-ink text-lg inline-flex items-center gap-1.5 bg-warm-gray/5 rounded-lg px-2 py-1 active:bg-warm-gray/10 transition-colors"
                >
                  {formatoMoneda.format(plato.precio_venta)}
                  <Edit3 className="h-3.5 w-3.5 text-warm-gray" />
                </button>
              ) : (
                <p className="font-bold text-ink text-lg opacity-60">
                  {formatoMoneda.format(plato.precio_venta)}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-warm-gray">Coste actual</p>
              <p className="font-bold text-ink text-lg">
                {formatoMoneda.format(plato.coste_total)}
              </p>
            </div>
            <div>
              <p className="text-xs text-warm-gray">Margen</p>
              <div className="flex items-center gap-1">
                <span
                  className={`font-bold text-xl ${
                    margenCritico
                      ? 'text-red-600'
                      : margenBajo
                      ? 'text-orange-500'
                      : 'text-olive-dark'
                  }`}
                >
                  {plato.margen_pct}%
                </span>
                {margenBajo ? (
                  <TrendingDown className={`h-5 w-5 ${margenCritico ? 'text-red-600' : 'text-orange-500'}`} />
                ) : (
                  <TrendingUp className="h-5 w-5 text-olive-dark" />
                )}
              </div>
            </div>
          </div>

          {editandoPrecioVenta && (
            <div className="mt-3 pt-3 border-t border-warm-gray/10">
              <p className="text-xs font-semibold text-warm-gray uppercase tracking-wide mb-2">
                Editar precio de venta
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 border border-warm-gray/10 shadow-sm">
                  <span className="text-sm text-warm-gray shrink-0">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tempPrecioVenta}
                    onChange={e => setTempPrecioVenta(e.target.value)}
                    className="w-24 rounded-lg border border-terracotta/50 px-3 py-2 text-sm bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleGuardarPlatoField('precio_venta', tempPrecioVenta);
                      if (e.key === 'Escape') setEditandoPrecioVenta(false);
                    }}
                  />
                  <button
                    onClick={() => handleGuardarPlatoField('precio_venta', tempPrecioVenta)}
                    className="p-2 rounded-full bg-olive text-white shrink-0"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditandoPrecioVenta(false)}
                    className="p-2 rounded-full bg-white border border-warm-gray/20 text-warm-gray shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {precioMinimo > 0 && (
                  <div className={`flex items-center gap-1.5 text-xs ${
                    parseFloat(tempPrecioVenta) < precioMinimo ? 'text-orange-600' : 'text-warm-gray'
                  }`}>
                    <span>Mín. sugerido {formatoMoneda.format(precioMinimo)}</span>
                    {parseFloat(tempPrecioVenta) < precioMinimo && (
                      <button
                        onClick={() => setTempPrecioVenta(precioMinimo.toFixed(2))}
                        className="font-semibold text-olive hover:underline"
                      >
                        Usar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {plato.margen_objetivo && (
            <div className="mt-3 pt-3 border-t border-warm-gray/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Margen objetivo</span>
                {editandoMargenObj ? (
                  <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 border border-warm-gray/10 shadow-sm">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={tempMargenObj}
                      onChange={e => setTempMargenObj(e.target.value)}
                      className="w-16 rounded-lg border border-terracotta/50 px-2 py-2 text-sm bg-white text-right focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleGuardarPlatoField('margen_objetivo', tempMargenObj);
                        if (e.key === 'Escape') setEditandoMargenObj(false);
                      }}
                    />
                    <span className="text-sm text-warm-gray shrink-0">%</span>
                    <button
                      onClick={() => handleGuardarPlatoField('margen_objetivo', tempMargenObj)}
                      className="p-2 rounded-full bg-olive text-white shrink-0"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditandoMargenObj(false)}
                      className="p-2 rounded-full bg-white border border-warm-gray/20 text-warm-gray shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setTempMargenObj(plato.margen_objetivo); setEditandoMargenObj(true); }}
                    className="font-medium text-ink inline-flex items-center gap-1 bg-warm-gray/5 rounded-lg px-2 py-1 active:bg-warm-gray/10 transition-colors"
                  >
                    {plato.margen_objetivo}%
                    <Edit3 className="h-3 w-3 text-warm-gray" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-ink-soft">Diferencia</span>
                <span className={`font-semibold ${diferenciaMargen >= 0 ? 'text-olive-dark' : 'text-red-600'}`}>
                  {diferenciaMargen >= 0 ? '+' : ''}{diferenciaMargen.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Warning si hay ingredientes sin precio */}
        {ingredientesSinPrecio.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {ingredientesSinPrecio.length} ingrediente{ingredientesSinPrecio.length > 1 ? 's' : ''} sin precio
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                El coste y margen mostrados no son reales.{' '}
                Actualiza los precios desde <button onClick={() => navigate('/precios')} className="underline font-medium">Actualizar precios</button> o procesando facturas.
              </p>
              <ul className="mt-2 space-y-0.5">
                {ingredientesSinPrecio.map(l => (
                  <li key={l.id} className="text-xs text-amber-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {l.ingrediente?.nombre}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Desglose de ingredientes */}
        <div className="bg-white rounded-xl border border-warm-gray/10 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-warm-gray/10 flex justify-between items-center">
            <h3 className="font-semibold text-ink">Ingredientes y costes</h3>
            <span className="text-sm text-warm-gray">{ingredientes.length} items</span>
          </div>

          {ingredientes.length === 0 ? (
            <div className="px-5 py-8 text-center text-ink-soft">
              <p>Esta receta aún no tiene ingredientes.</p>
              <button
                onClick={() => navigate(`/plato/${plato.plato_id}/receta`)}
                className="mt-2 text-terracotta font-semibold"
              >
                Gestionar receta
              </button>
            </div>
          ) : (
            <div className="divide-y divide-warm-gray/10">
              {ingredientes.map((linea) => (
                <div
                  key={linea.id}
                  className="px-5 py-3 cursor-pointer hover:bg-cream/50 transition-colors group"
                  onClick={() => abrirModal(linea)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {!linea.precioUnitario && (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                        <p className="font-medium text-ink">
                          {linea.ingrediente?.nombre || 'Ingrediente desconocido'}
                        </p>
                        <Edit3 className="h-3 w-3 text-warm-gray opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-warm-gray mt-0.5">
                        <span>
                          {linea.cantidad} {linea.ingrediente?.unidad_medida || 'u'}
                        </span>
                        {linea.merma_pct > 0 && (
                          <span className="text-orange-500">
                            merma {linea.merma_pct}%
                          </span>
                        )}
                        <span>
                          {formatoMoneda.format(linea.precioUnitario)} / {linea.ingrediente?.unidad_medida || 'u'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="font-semibold text-ink">
                        {formatoMoneda.format(linea.costeLinea)}
                      </p>
                      <p className="text-xs text-warm-gray">
                        {plato.coste_total > 0 ? ((linea.costeLinea / plato.coste_total) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-4 bg-cream/50 border-t border-warm-gray/10 flex justify-between items-center">
            <span className="font-semibold text-ink">Coste total</span>
            <span className="font-bold text-ink text-lg">
              {formatoMoneda.format(plato.coste_total)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-warm-gray bg-white/50 p-3 rounded-xl border border-warm-gray/10">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Toca cualquier ingrediente para editarlo. El coste y margen se recalculan automáticamente.
          </p>
        </div>
      </main>

      {/* Modal de edición de ingrediente */}
      {ingredienteEditando && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={cerrarModal}
        >
          <div className="fixed inset-0 bg-black/40 transition-opacity" />
          <div
            className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl p-5 sm:p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-ink text-lg">Editar ingrediente</h3>
              <button
                onClick={cerrarModal}
                className="p-2 -mr-2 rounded-full hover:bg-warm-gray/10 transition-colors"
              >
                <X className="h-5 w-5 text-warm-gray" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Nombre</label>
                <input
                  type="text"
                  value={editFormData.nombre}
                  onChange={e => handleEditChange('nombre', e.target.value)}
                  className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                />
              </div>

              {/* Unidad de medida */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Unidad de medida</label>
                <select
                  value={editFormData.unidad_medida}
                  onChange={e => handleEditChange('unidad_medida', e.target.value)}
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

              {/* Precio actual */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Precio actual (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.precio_actual}
                  onChange={e => handleEditChange('precio_actual', e.target.value)}
                  className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Categoría</label>
                {mostrarNuevaCategoria ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editFormData.categoria}
                      onChange={e => handleEditChange('categoria', e.target.value)}
                      className="flex-1 rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                      placeholder="Nueva categoría..."
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setMostrarNuevaCategoria(false); setEditFormData(prev => ({ ...prev, categoria: '' })); }}
                      className="text-sm text-warm-gray hover:text-ink px-2"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <select
                    value={editFormData.categoria}
                    onChange={e => {
                      if (e.target.value === '__nueva__') {
                        setMostrarNuevaCategoria(true);
                        setEditFormData(prev => ({ ...prev, categoria: '' }));
                      } else {
                        handleEditChange('categoria', e.target.value);
                      }
                    }}
                    className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__nueva__">+ Crear nueva...</option>
                  </select>
                )}
              </div>

              {/* Proveedor */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Proveedor</label>
                {mostrarNuevoProveedor ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editFormData.nuevoProveedorNombre}
                      onChange={e => handleEditChange('nuevoProveedorNombre', e.target.value)}
                      className="flex-1 rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                      placeholder="Nombre del nuevo proveedor..."
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setMostrarNuevoProveedor(false); setEditFormData(prev => ({ ...prev, proveedor_habitual_id: '', nuevoProveedorNombre: '' })); }}
                      className="text-sm text-warm-gray hover:text-ink px-2"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <select
                    value={editFormData.proveedor_habitual_id}
                    onChange={e => {
                      if (e.target.value === '__nuevo__') {
                        setMostrarNuevoProveedor(true);
                        setEditFormData(prev => ({ ...prev, proveedor_habitual_id: '__nuevo__' }));
                      } else {
                        handleEditChange('proveedor_habitual_id', e.target.value);
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

              {/* Separador */}
              <div className="border-t border-warm-gray/10 pt-4">
                <p className="text-xs font-semibold text-warm-gray uppercase tracking-wide mb-3">
                  Receta
                </p>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Cantidad ({editFormData.unidad_medida})
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={editFormData.cantidad}
                    onChange={e => handleEditChange('cantidad', e.target.value)}
                    className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                  />
                </div>

                {/* Merma */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-ink mb-1">
                    Merma (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editFormData.merma}
                    onChange={e => handleEditChange('merma', e.target.value)}
                    className="w-full rounded-lg border border-warm-gray/30 px-4 py-3 bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                  />
                  <p className="text-xs text-warm-gray mt-1">
                    Porcentaje de desperdicio al preparar el ingrediente.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGuardarIngrediente}
                disabled={savingIngrediente}
                className="flex-1 flex items-center justify-center gap-2 bg-olive text-white rounded-full py-3 font-semibold hover:bg-olive-dark transition-colors disabled:opacity-60"
              >
                {savingIngrediente ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                {savingIngrediente ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={cerrarModal}
                className="flex-1 border border-warm-gray/30 text-ink-soft rounded-full py-3 font-medium hover:bg-warm-gray/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
