import { supabase } from '../supabaseClient';

export function getPlatoDerived(plato, ingredientes) {
  const margenBajo = plato.margen_pct < 50;
  const margenCritico = plato.margen_pct < 35;
  const obj = plato.margen_objetivo;
  const diferenciaMargen = plato.margen_pct - (obj || 70);
  const precioMinimo = obj > 0 && obj < 100
    ? plato.coste_total / (1 - obj / 100)
    : 0;
  const ingredientesSinPrecio = ingredientes.filter(l => !l.precioUnitario);
  const colorMargen = margenCritico ? 'text-red-600' : margenBajo ? 'text-orange-500' : 'text-olive-dark';
  const colorMargenIcono = margenCritico ? 'text-red-600' : 'text-orange-500';
  const fp = plato.factor_porcion;
  const labelRacion = fp === 0.25 ? 'Tapa' : fp === 0.5 ? 'Media' : (fp || '') + 'x';
  const difColor = diferenciaMargen >= 0 ? 'text-olive-dark' : 'text-red-600';
  const difSigno = diferenciaMargen >= 0 ? '+' : '';
  return { margenBajo, margenCritico, diferenciaMargen, precioMinimo, ingredientesSinPrecio, colorMargen, colorMargenIcono, labelRacion, difColor, difSigno };
}

export async function guardarPlatoField(platoId, field, value, plato) {
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
    .eq('id', platoId);

  if (error) {
    alert('Error al guardar: ' + error.message);
    return null;
  }

  return { ...plato, ...localUpdates };
}
