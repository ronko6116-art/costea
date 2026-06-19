// src/PlatoDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';
import { 
  ArrowLeft, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Info,
  Plus
} from 'lucide-react';

export default function PlatoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [plato, setPlato] = useState(null);
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !session) {
        setError('No hay sesión o ID de plato');
        setLoading(false);
        return;
      }

      try {
        console.log('Cargando plato ID:', id);
        // 1. Obtener datos del plato (desde la vista)
        const { data: platoData, error: platoError } = await supabase
          .from('vista_coste_platos')
          .select('*')
          .eq('plato_id', id)
          .single();

        if (platoError) {
          console.error('Error al obtener plato:', platoError);
          throw platoError;
        }
        console.log('Plato obtenido:', platoData);
        setPlato(platoData);

        // 2. Obtener receta con ingredientes
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
              precio_actual
            )
          `)
          .eq('plato_id', id);

        if (recetaError) {
          console.error('Error al obtener receta:', recetaError);
          throw recetaError;
        }
        console.log('Receta obtenida (raw):', recetaData);

        // Verificar que recetaData tiene elementos
        if (!recetaData || recetaData.length === 0) {
          console.log('No hay ingredientes en la receta');
          setIngredientes([]);
          setLoading(false);
          return;
        }

        // Calcular coste por línea y total
        let costeTotal = 0;
        const lineasConCoste = recetaData.map(linea => {
          // Acceder al ingrediente anidado
          const ingrediente = linea.ingrediente;
          if (!ingrediente) {
            console.warn('Línea sin ingrediente:', linea);
            return null;
          }
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
        }).filter(Boolean); // eliminar nulos

        console.log('Líneas con coste:', lineasConCoste);
        console.log('Coste total calculado:', costeTotal);

        setIngredientes(lineasConCoste);
        setLoading(false);
      } catch (err) {
        console.error('Error en fetchData:', err);
        setError(err.message || 'Error al cargar los datos del plato');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, session]);

  const handleBack = () => {
    navigate('/dashboard');
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

  return (
    <div className="min-h-screen bg-cream pb-24">
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
          <button
            onClick={() => navigate(`/plato/${plato.plato_id}/receta`)}
            className="bg-olive text-white rounded-full px-4 py-2 text-sm font-semibold"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Receta
          </button>
        </div>
      </header>

      <main className="px-4 py-4 max-w-6xl mx-auto">
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

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-xs text-warm-gray">Precio venta</p>
              <p className="font-bold text-ink text-lg">
                {formatoMoneda.format(plato.precio_venta)}
              </p>
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

          {/* Comparativa con objetivo */}
          {plato.margen_objetivo && (
            <div className="mt-3 pt-3 border-t border-warm-gray/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Margen objetivo</span>
                <span className="font-medium text-ink">{plato.margen_objetivo}%</span>
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
                <div key={linea.id} className="px-5 py-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-ink">
                        {linea.ingrediente?.nombre || 'Ingrediente desconocido'}
                      </p>
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
                    <div className="text-right ml-4 shrink-0">
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

          {/* Total */}
          <div className="px-5 py-4 bg-cream/50 border-t border-warm-gray/10 flex justify-between items-center">
            <span className="font-semibold text-ink">Coste total</span>
            <span className="font-bold text-ink text-lg">
              {formatoMoneda.format(plato.coste_total)}
            </span>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mt-4 flex items-start gap-2 text-xs text-warm-gray bg-white/50 p-3 rounded-xl border border-warm-gray/10">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            El coste se calcula usando el precio actual de cada ingrediente.
            Las mermas (desperdicio) se aplican como porcentaje sobre la cantidad base.
          </p>
        </div>
      </main>
    </div>
  );
}