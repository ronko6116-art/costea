export function aplicarFiltros(platos, { mostrarOcultos, filtro, categoriaFiltro, ordenBeneficio }) {
  let result = [...platos];

  if (!mostrarOcultos) {
    result = result.filter(p => p.activo !== false);
  }

  if (filtro === 'alertas') {
    result = result.filter(p => p.margen_objetivo > 0 && p.margen_pct < p.margen_objetivo);
  }

  if (categoriaFiltro) {
    result = result.filter(p => p.categoria === categoriaFiltro);
  }

  if (ordenBeneficio === 'asc') {
    result.sort((a, b) => a.margen_pct - b.margen_pct);
  } else if (ordenBeneficio === 'desc') {
    result.sort((a, b) => b.margen_pct - a.margen_pct);
  }

  return result;
}

export function obtenerCategorias(platos) {
  const cats = [...new Set(platos.map(p => p.categoria).filter(Boolean))];
  return cats.sort();
}

export function obtenerAlertas(platos) {
  return platos.filter(p => p.margen_objetivo > 0 && p.margen_pct < p.margen_objetivo);
}
