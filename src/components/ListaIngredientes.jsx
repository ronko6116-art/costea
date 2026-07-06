import { AlertTriangle } from 'lucide-react';
import { formatearMoneda } from '../functions/formatters';

export default function ListaIngredientes({ ingredientes, plato, onNavigate }) {
  if (ingredientes.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-ink-soft">
        <p>Esta receta aún no tiene ingredientes.</p>
        <button onClick={onNavigate} className="mt-2 text-terracotta font-semibold">
          Gestionar receta
        </button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-warm-gray/10">
      {ingredientes.map((linea) => (
        <div key={linea.id} className="px-5 py-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {!linea.precioUnitario && (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <p className="font-medium text-ink">
                  {linea.ingrediente?.nombre || 'Ingrediente desconocido'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-warm-gray mt-0.5">
                <span>
                  {Number(linea.cantidadEscalada).toFixed(3).replace(/\.?0+$/, '')} {linea.ingrediente?.unidad_medida === 'docena' ? 'uds' : linea.ingrediente?.unidad_medida || 'u'}
                </span>
                {linea.merma_pct > 0 && (
                  <span className="text-orange-500">merma {linea.merma_pct}%</span>
                )}
                <span>
                  {formatearMoneda(linea.precioUnitario)} / {linea.ingrediente?.unidad_medida === 'docena' ? 'doc' : linea.ingrediente?.unidad_medida || 'u'}
                </span>
              </div>
            </div>
            <div className="text-right ml-4 flex-shrink-0">
              <p className="font-semibold text-ink">{formatearMoneda(linea.costeLinea)}</p>
              <p className="text-xs text-warm-gray">
                {plato.coste_total > 0 ? ((linea.costeLinea / plato.coste_total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
