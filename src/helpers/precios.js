import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function fechaKey(f) {
  if (!f) return '';
  return f instanceof Date
    ? f.toISOString().slice(0, 10)
    : String(f).slice(0, 10);
}

export function deduplicarPorFecha(arr, getKey) {
  const map = new Map();
  for (const item of arr) {
    const key = getKey
      ? getKey(item)
      : `${fechaKey(item.fecha)}|${item.proveedor_id || ''}`;
    const existing = map.get(key);
    if (!existing || new Date(item.creado_en) > new Date(existing.creado_en)) {
      map.set(key, item);
    }
  }
  return [...map.values()].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

export function mapearPuntos(arr) {
  const formatearFecha = (f) => {
    if (!f) return '';
    if (typeof f === 'string') return format(parseISO(f), 'dd MMM', { locale: es });
    return format(f, 'dd MMM', { locale: es });
  };
  return arr.map((h) => ({
    fecha: formatearFecha(h.fecha),
    precio: h.precio,
    ts: h.creado_en,
  }));
}
