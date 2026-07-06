import { AlertTriangle } from 'lucide-react';

export default function AlertasBanner({ alertas }) {
  if (alertas.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl bg-linear-to-r from-red-50 to-red-100 border border-red-200 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-red-800 text-sm">
            {alertas.length} alerta{alertas.length > 1 ? 's' : ''} de margen
          </p>
          <ul className="mt-1 text-sm text-red-700 space-y-1">
            {alertas.slice(0, 2).map((p) => (
              <li key={p.plato_id} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>{p.plato_nombre} → margen bajo ({p.margen_pct}%)</span>
              </li>
            ))}
            {alertas.length > 2 && (
              <li className="text-red-600 font-medium text-xs">
                + {alertas.length - 2} más
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
