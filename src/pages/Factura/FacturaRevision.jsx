// src/FacturaRevision.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  ArrowLeft, Check, AlertCircle, Sparkles, Loader2,
  TrendingUp, TrendingDown, ChevronDown
} from 'lucide-react';

// --- Calcular precio de referencia por kg / litro ---
function precioReferencia(precio, unidad) {
  if (!precio || !unidad) return null;
  if (unidad === 'g') return precio * 1000;
  if (unidad === 'ml') return precio * 1000;
  if (unidad === 'kg' || unidad === 'l') return precio;
  return null;
}

// --- Utilidad de matching difuso, sin dependencias externas ---
// Compara nombres normalizados (sin acentos, minúsculas, sin plurales triviales)
// y decide si dos strings probablemente se refieren al mismo ingrediente.
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function similitud(a, b) {
  const na = normalizar(a);
  const nb = normalizar(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  // Solapamiento de palabras (ej: "atún rojo lomo" vs "atún" -> comparten "atun")
  const wordsA = new Set(na.split(/\s+/));
  const wordsB = new Set(nb.split(/\s+/));
  const interseccion = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? interseccion / union : 0;
}

function encontrarMejorMatch(nombreBuscado, lista, campoNombre = 'nombre') {
  let mejor = null;
  let mejorScore = 0;
  for (const item of lista) {
    const score = similitud(nombreBuscado, item[campoNombre]);
    if (score > mejorScore) {
      mejorScore = score;
      mejor = item;
    }
  }
  // Umbrales: alto = match automático, medio = candidato sugerido, bajo = ignorar
  if (mejorScore >= 0.7) return { item: mejor, score: mejorScore, nivel: 'alto' };
  if (mejorScore >= 0.4) return { item: mejor, score: mejorScore, nivel: 'medio' };
  return null;
}

export default function FacturaRevision() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [proveedorInfo, setProveedorInfo] = useState(null);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState(null);

  const formatoMoneda = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

  useEffect(() => {
    const cargarYProcesar = async () => {
      // 1. Cargar la factura
      const { data: facturaData, error: facturaError } = await supabase
        .from('facturas')
        .select('*')
        .eq('id', id)
        .single();

      if (facturaError || !facturaData) {
        setError('No se encontró la factura.');
        setLoading(false);
        return;
      }
      setFactura(facturaData);

      const datos = facturaData.datos_extraidos;
      const restauranteId = facturaData.restaurante_id;

      // 2. Cargar proveedores e ingredientes existentes para hacer el matching
      const { data: proveedores } = await supabase
        .from('proveedores')
        .select('id, nombre')
        .eq('restaurante_id', restauranteId);

      const { data: ingredientes } = await supabase
        .from('ingredientes')
        .select('id, nombre, unidad_medida, precio_actual')
        .eq('restaurante_id', restauranteId);

      setIngredientesDisponibles(ingredientes || []);

      // 3. Matching de proveedor
      const matchProveedor = encontrarMejorMatch(datos.proveedor_nombre, proveedores || []);
      setProveedorInfo({
        nombre: datos.proveedor_nombre,
        esNuevo: !matchProveedor || matchProveedor.nivel !== 'alto',
        match: matchProveedor?.nivel === 'alto' ? matchProveedor.item : null,
      });

      // 4. Matching de cada línea contra ingredientes existentes
      const lineasProcesadas = (datos.lineas || []).map((linea, idx) => {
        const match = encontrarMejorMatch(linea.nombre_producto, ingredientes || []);

        let decision, ingredienteSugerido, ingredienteCandidato, variacionPrecio = null;

        if (match?.nivel === 'alto') {
          // Match fuerte: se actualiza directamente ese ingrediente
          decision = 'match';
          ingredienteSugerido = match.item;
          if (match.item.precio_actual > 0) {
            variacionPrecio = Math.round(
              ((linea.precio_unitario - match.item.precio_actual) / match.item.precio_actual) * 1000
            ) / 10;
          }
        } else {
          // Sin match fuerte: se creará como nuevo, pero si hay un candidato
          // medio se lo sugerimos al usuario para que pueda fusionar con un toque
          decision = 'nuevo';
          ingredienteCandidato = match?.nivel === 'medio' ? match.item : null;
        }

        return {
          ...linea,
          _id: idx,
          confianza: linea.confianza_linea || 'alta', // por si el OCR la incluye a futuro
          decision,
          ingrediente_sugerido: ingredienteSugerido || null,
          ingrediente_candidato: ingredienteCandidato || null,
          variacion_precio: variacionPrecio,
          ingredienteElegidoId: ingredienteSugerido?.id ?? null,
        };
      });

      setLineas(lineasProcesadas);
      setLoading(false);
    };

    cargarYProcesar();
  }, [id]);

  const actualizarLinea = (idx, cambios) => {
    setLineas(prev => prev.map((l, i) => (i === idx ? { ...l, ...cambios } : l)));
  };

  const handleConfirmar = async () => {
    setConfirmando(true);
    setError(null);

    try {
      const restauranteId = factura.restaurante_id;

      // 1. Resolver proveedor: usar el existente o crear uno nuevo
      let proveedorId = proveedorInfo.match?.id ?? null;
      if (proveedorInfo.esNuevo) {
        const { data: nuevoProveedor, error: provError } = await supabase
          .from('proveedores')
          .insert([{ restaurante_id: restauranteId, nombre: proveedorInfo.nombre }])
          .select('id')
          .single();
        if (provError) throw provError;
        proveedorId = nuevoProveedor.id;
      }

      // 2. Para cada línea: resolver ingrediente (existente o nuevo),
      //    actualizar precio_actual, e insertar en precios_historicos
      const facturasConsideradas = [];

      for (const linea of lineas) {
        let ingredienteId = linea.ingredienteElegidoId;

        if (linea.decision === 'nuevo' && !ingredienteId) {
          // Crear ingrediente nuevo
          const { data: nuevoIngrediente, error: ingError } = await supabase
            .from('ingredientes')
            .insert([{
              restaurante_id: restauranteId,
              nombre: linea.nombre_producto,
              unidad_medida: linea.unidad_medida,
              precio_actual: linea.precio_unitario,
              proveedor_habitual_id: proveedorId,
            }])
            .select('id')
            .single();
          if (ingError) throw ingError;
          ingredienteId = nuevoIngrediente.id;
        } else {
          // Actualizar precio del ingrediente existente (match o fusión manual)
          const { error: updateError } = await supabase
            .from('ingredientes')
            .update({ precio_actual: linea.precio_unitario, updated_at: new Date().toISOString() })
            .eq('id', ingredienteId);
          if (updateError) throw updateError;
        }

        // 3. Registrar en histórico de precios (siempre, sea ingrediente nuevo o existente)
        const { data: historico, error: histError } = await supabase
          .from('precios_historicos')
          .insert([{
            ingrediente_id: ingredienteId,
            proveedor_id: proveedorId,
            precio: linea.precio_unitario,
            factura_id: factura.id,
            fecha: factura.fecha_factura || new Date().toISOString().slice(0, 10),
          }])
          .select('id')
          .single();
        if (histError) throw histError;

        facturasConsideradas.push(factura.id);
      }

      // 4. Marcar la factura como procesada
      const { error: facturaUpdateError } = await supabase
        .from('facturas')
        .update({
          estado: 'procesada',
          proveedor_id: proveedorId,
          procesada_en: new Date().toISOString(),
        })
        .eq('id', factura.id);
      if (facturaUpdateError) throw facturaUpdateError;

      // Nota: la detección de tendencia sostenida (que genera filas en
      // "alertas") se hace en un paso aparte, no aquí — ver nota al final
      // de este archivo.

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'No se pudo confirmar la factura.');
      setConfirmando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto mb-4"></div>
          <p className="text-ink-soft">Cargando revisión...</p>
        </div>
      </div>
    );
  }

  if (error && !factura) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-sm text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-ink-soft">{error}</p>
          <button onClick={() => navigate('/facturas')} className="mt-6 w-full bg-terracotta text-white rounded-full py-3 font-semibold">
            Volver a facturas
          </button>
        </div>
      </div>
    );
  }

  const nuevosCount = lineas.filter(l => l.decision === 'nuevo').length;

  return (
    <div className="min-h-screen bg-cream pb-32">
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => navigate('/facturas')}
            className="p-2 -ml-2 rounded-full hover:bg-olive/10 text-ink transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg">Revisar factura</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* Proveedor */}
        <div className="bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm">
          <p className="text-xs font-semibold text-warm-gray uppercase tracking-wide mb-2">Proveedor</p>
          {proveedorInfo.esNuevo ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-terracotta/10 text-terracotta-dark text-xs font-semibold px-2 py-1 rounded-full">
                <Sparkles className="h-3 w-3" />
                Nuevo
              </span>
              <span className="font-medium text-ink">{proveedorInfo.nombre}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-olive-dark" />
              <span className="font-medium text-ink">{proveedorInfo.match?.nombre}</span>
              <span className="text-xs text-warm-gray">(ya existía)</span>
            </div>
          )}
        </div>

        {/* Aviso de ingredientes nuevos */}
        {nuevosCount > 0 && (
          <div className="bg-terracotta/8 border border-terracotta/20 rounded-xl p-3 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-terracotta-dark shrink-0 mt-0.5" />
            <p className="text-sm text-ink-soft">
              Hemos detectado <strong className="text-ink">{nuevosCount} ingrediente{nuevosCount > 1 ? 's' : ''} nuevo{nuevosCount > 1 ? 's' : ''}</strong>.
              Revisa que no exista ya con otro nombre antes de confirmar.
            </p>
          </div>
        )}

        {/* Líneas */}
        <div className="space-y-3">
          {lineas.map((linea, idx) => (
            <LineaFactura
              key={linea._id}
              linea={linea}
              ingredientesDisponibles={ingredientesDisponibles}
              formatoMoneda={formatoMoneda}
              onChange={(cambios) => actualizarLinea(idx, cambios)}
            />
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </main>

      {/* Barra fija de confirmación */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-warm-gray/20 p-4">
        <button
          onClick={handleConfirmar}
          disabled={confirmando}
          className="w-full flex items-center justify-center gap-2 bg-terracotta text-white rounded-full py-3.5 font-semibold disabled:opacity-60 transition-colors hover:bg-terracotta-dark max-w-lg mx-auto"
        >
          {confirmando ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Confirmando...
            </>
          ) : (
            `Confirmar y actualizar ${lineas.length} ingrediente${lineas.length > 1 ? 's' : ''}`
          )}
        </button>
      </div>
    </div>
  );
}

function LineaFactura({ linea, ingredientesDisponibles, formatoMoneda, onChange }) {
  const [mostrarSelector, setMostrarSelector] = useState(false);

  const tieneVariacion = linea.variacion_precio !== null && linea.variacion_precio !== undefined;
  const refPrecio = precioReferencia(linea.precio_unitario, linea.unidad_medida);
  const refLabel = linea.unidad_medida === 'g' || linea.unidad_medida === 'kg' ? 'kg' : 'l';

  return (
    <div className="bg-white rounded-xl border border-warm-gray/10 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <p className="font-medium text-ink">{linea.nombre_producto}</p>
          <p className="text-xs text-warm-gray mt-0.5">
            {linea.cantidad} {linea.unidad_medida} · {formatoMoneda.format(linea.precio_unitario)}/{linea.unidad_medida}
            {refPrecio !== null && (
              <span className="ml-2 font-semibold text-olive-dark">
                ({formatoMoneda.format(refPrecio)}/{refLabel})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Estado: match automático con ingrediente existente */}
      {linea.decision === 'match' && (
        <div className="mt-3 flex items-center justify-between bg-cream rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-olive-dark shrink-0" />
            <span className="text-sm text-ink">
              Actualiza <strong>{linea.ingrediente_sugerido?.nombre}</strong>
            </span>
          </div>
          {tieneVariacion && Math.abs(linea.variacion_precio) >= 1 && (
            <span className={`flex items-center gap-1 text-xs font-semibold ${linea.variacion_precio > 0 ? 'text-red-600' : 'text-olive-dark'}`}>
              {linea.variacion_precio > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {linea.variacion_precio > 0 ? '+' : ''}{linea.variacion_precio}%
            </span>
          )}
        </div>
      )}

      {/* Estado: ingrediente nuevo (con opción de fusionar con uno existente) */}
      {linea.decision === 'nuevo' && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between bg-terracotta/8 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-terracotta-dark shrink-0" />
              <span className="text-sm text-ink">Se creará como ingrediente nuevo</span>
            </div>
          </div>

          {linea.ingrediente_candidato && (
            <button
              onClick={() => onChange({ decision: 'elegir_existente', ingredienteElegidoId: linea.ingrediente_candidato.id })}
              className="w-full text-left text-xs text-olive-dark hover:underline px-1"
            >
              ¿Es lo mismo que "{linea.ingrediente_candidato.nombre}"? Tócalo para fusionar.
            </button>
          )}

          <button
            onClick={() => setMostrarSelector(!mostrarSelector)}
            className="w-full flex items-center justify-between text-xs text-warm-gray hover:text-ink px-1"
          >
            <span>O elige un ingrediente existente manualmente</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${mostrarSelector ? 'rotate-180' : ''}`} />
          </button>

          {mostrarSelector && (
            <select
              className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-cream"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  onChange({ decision: 'elegir_existente', ingredienteElegidoId: e.target.value });
                  setMostrarSelector(false);
                }
              }}
            >
              <option value="">Selecciona...</option>
              {ingredientesDisponibles.map(i => (
                <option key={i.id} value={i.id}>{i.nombre} ({i.unidad_medida})</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Estado: fusionado manualmente con un ingrediente existente */}
      {linea.decision === 'elegir_existente' && (
        <div className="mt-3 flex items-center justify-between bg-cream rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-olive-dark shrink-0" />
            <span className="text-sm text-ink">
              Actualizará <strong>
                {ingredientesDisponibles.find(i => i.id === linea.ingredienteElegidoId)?.nombre}
              </strong>
            </span>
          </div>
          <button
            onClick={() => onChange({ decision: 'nuevo', ingredienteElegidoId: null })}
            className="text-xs text-warm-gray hover:text-red-500"
          >
            Deshacer
          </button>
        </div>
      )}
    </div>
  );
}

/*
 * NOTA sobre detección de tendencia sostenida y alertas:
 *
 * Este componente actualiza precios e inserta histórico, pero NO genera
 * filas en "alertas" directamente — eso requiere mirar varias facturas
 * pasadas de cada ingrediente (no solo la actual), tal y como se definió
 * en el esquema: una alerta solo se crea si hay una tendencia sostenida
 * en N facturas consecutivas, no por una variación puntual.
 *
 * Esa lógica vive mejor en una función aparte (ej. detectarAlertas.js o
 * una Edge Function en el futuro) que se invoque justo después de
 * handleConfirmar, recibiendo el ingredienteId actualizado. La construimos
 * como siguiente paso del roadmap de facturas.
 */
