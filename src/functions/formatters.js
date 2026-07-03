const monedaFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

const monedaFormatterCompacto = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

export const UNIDADES_MEDIDA = ['kg', 'g', 'l', 'ml', 'unidad', 'docena'];

export function formatearMoneda(valor) {
  return monedaFormatter.format(valor ?? 0);
}

export function formatearMonedaCompacto(valor) {
  return monedaFormatterCompacto.format(valor ?? 0);
}

export function formatearPrecioUnitario(ingrediente) {
  const precio = formatearMoneda(ingrediente?.precio_actual ?? 0);
  const udm = ingrediente?.unidad_medida;
  if (udm && UNIDADES_MEDIDA.includes(udm)) {
    return `${precio} / ${udm}`;
  }
  return precio;
}
