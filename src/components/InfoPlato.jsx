import { useState } from 'react';
import { TrendingDown, TrendingUp, AlertTriangle, Edit3, Check, X } from 'lucide-react';
import { formatearMoneda } from '../functions/formatters';
import { guardarPlatoField, getPlatoDerived } from '../helpers/platoSave';
import MargenObjetivoSection from './MargenObjetivoSection';

function PrecioVentaField({ plato, onSave, editando, onStartEdit, onCancel, temp, setTemp, precioMinimo }) {
  if (!editando) {
    return (
      <button onClick={onStartEdit}
        className="font-bold text-ink text-lg inline-flex items-center gap-1.5 bg-terracotta/10 rounded-lg px-3 py-1.5 active:bg-terracotta/20 transition-colors border border-dashed border-terracotta/30">
        {formatearMoneda(plato.precio_venta)}
        <Edit3 className="h-3.5 w-3.5 text-terracotta" />
      </button>
    );
  }

  return (
    <div>
      <p className="font-bold text-ink text-lg opacity-60">{formatearMoneda(plato.precio_venta)}</p>
      <div className="mt-3 pt-3 border-t border-warm-gray/10">
        <p className="text-xs font-semibold text-warm-gray uppercase tracking-wide mb-2">Editar precio de venta</p>
        <div className="flex items-center gap-2 bg-olive/5 rounded-lg p-2 border-2 border-olive/30 shadow-sm">
          <span className="text-sm font-semibold text-ink shrink-0">€</span>
          <input type="number" step="0.01" min="0" value={temp}
            onChange={e => setTemp(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border-2 border-olive/40 px-3 py-2 text-sm bg-white font-semibold focus:border-olive focus:ring-2 focus:ring-olive/20 outline-none transition"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') onSave(temp); if (e.key === 'Escape') onCancel(); }} />
          <button onClick={() => onSave(temp)} className="p-2 rounded-full bg-olive text-white shrink-0 hover:bg-olive-dark transition-colors" title="Guardar">
            <Check className="h-5 w-5" />
          </button>
          <button onClick={onCancel} className="p-2 rounded-full bg-white border-2 border-warm-gray/20 text-warm-gray shrink-0 hover:bg-warm-gray/5 transition-colors" title="Cancelar">
            <X className="h-5 w-5" />
          </button>
        </div>
        {precioMinimo > 0 && (
          <div className={`flex items-center gap-1.5 text-xs mt-2 ${parseFloat(temp) < precioMinimo ? 'text-orange-600' : 'text-warm-gray'}`}>
            <span>Mín. sugerido {formatearMoneda(precioMinimo)}</span>
            {parseFloat(temp) < precioMinimo && (
              <button onClick={() => setTemp(precioMinimo.toFixed(2))} className="font-semibold text-olive hover:underline">Usar</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InfoPlato({ plato, ingredientes, onUpdate }) {
  const [editandoPrecioVenta, setEditandoPrecioVenta] = useState(false);
  const [tempPrecioVenta, setTempPrecioVenta] = useState('');

  const d = getPlatoDerived(plato, ingredientes);

  const handleSave = async (field, value) => {
    const updated = await guardarPlatoField(plato.plato_id, field, value, plato);
    if (!updated) return;
    onUpdate(updated);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-warm-gray/10 p-5 shadow-sm mb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-ink">{plato.plato_nombre}</h2>
            {plato.categoria && <span className="text-sm text-warm-gray uppercase tracking-wide">{plato.categoria}</span>}
          </div>
          {d.margenBajo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              <AlertTriangle className="h-3 w-3" />
              Alerta
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mt-4">
          <div>
            <p className="text-xs text-warm-gray">Precio venta</p>
            <PrecioVentaField
              plato={plato}
              editando={editandoPrecioVenta}
              onStartEdit={() => { setTempPrecioVenta(plato.precio_venta); setEditandoPrecioVenta(true); }}
              onSave={(v) => { handleSave('precio_venta', v); setEditandoPrecioVenta(false); }}
              onCancel={() => setEditandoPrecioVenta(false)}
              temp={tempPrecioVenta} setTemp={setTempPrecioVenta}
              precioMinimo={d.precioMinimo} />
          </div>
          <div>
            <p className="text-xs text-warm-gray">Coste actual</p>
            <p className="font-bold text-ink text-lg">{formatearMoneda(plato.coste_total)}</p>
          </div>
          <div>
            <p className="text-xs text-warm-gray">Margen</p>
            <div className="flex items-center gap-1">
              <span className={`font-bold text-xl ${d.colorMargen}`}>{plato.margen_pct}%</span>
              {d.margenBajo
                ? <TrendingDown className={`h-5 w-5 ${d.colorMargenIcono}`} />
                : <TrendingUp className="h-5 w-5 text-olive-dark" />}
            </div>
          </div>
        </div>

        {plato.factor_porcion !== 1 && plato.factor_porcion && (
          <div className="mt-2 text-xs text-warm-gray">
            Ración: {d.labelRacion}
          </div>
        )}

        {plato.margen_objetivo && (
          <div className="mt-3 pt-3 border-t border-warm-gray/10">
            <MargenObjetivoSection
              margenObjetivo={plato.margen_objetivo}
              onSave={(v) => handleSave('margen_objetivo', v)}
            />
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-ink-soft">Diferencia</span>
              <span className={`font-semibold ${d.difColor}`}>
                {d.difSigno}{d.diferenciaMargen.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {d.ingredientesSinPrecio.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {d.ingredientesSinPrecio.length} ingrediente{d.ingredientesSinPrecio.length > 1 ? 's' : ''} sin precio
            </p>
            <p className="text-xs text-amber-700 mt-0.5">El coste y margen mostrados no son reales.</p>
            <ul className="mt-2 space-y-0.5">
              {d.ingredientesSinPrecio.map(l => (
                <li key={l.id} className="text-xs text-amber-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {l.ingrediente?.nombre}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
