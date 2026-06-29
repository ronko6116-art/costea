// src/PlatoCard.jsx
import { TrendingDown, TrendingUp, ChevronRight, AlertTriangle } from 'lucide-react';

export default function PlatoCard({ plato, formatoMoneda, onPress }) {
  const margenBajo = plato.margen_pct < 50;
  const margenCritico = plato.margen_pct < 35;

  const semaforoColor =
    plato.margen_pct > 70
      ? 'bg-green-500'
      : plato.margen_pct >= 35
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div
      onClick={onPress}
      className="bg-white rounded-xl border border-warm-gray/10 shadow-sm overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-bold text-ink text-base leading-tight">
              {plato.plato_nombre}
            </h3>
            {plato.categoria && (
              <span className="text-xs text-warm-gray uppercase tracking-wide">
                {plato.categoria}
              </span>
            )}
          </div>
          <div className="shrink-0 ml-2">
            {plato.tiene_sin_precio ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <div className={`h-3 w-3 rounded-full ${semaforoColor} shadow-sm`} />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-col">
            <span className="text-xs text-warm-gray">Venta</span>
            <span className="font-semibold text-ink">
              {formatoMoneda.format(plato.precio_venta)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-warm-gray">Coste</span>
            <span className="font-semibold text-ink">
              {formatoMoneda.format(plato.coste_total)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-warm-gray">Margen</span>
            <div className="flex items-center gap-1">
              <span
                className={`font-bold text-lg ${
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
                <TrendingDown className={`h-4 w-4 ${margenCritico ? 'text-red-600' : 'text-orange-500'}`} />
              ) : (
                <TrendingUp className="h-4 w-4 text-olive-dark" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <ChevronRight className="h-5 w-5 text-warm-gray" />
        </div>
      </div>
    </div>
  );
}