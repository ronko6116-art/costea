import { useState } from 'react';
import { Edit3, Check, X } from 'lucide-react';

function InlineEdit({ value, onSave, onCancel, render }) {
  const [temp, setTemp] = useState(value);

  return (
    <div className="flex items-center gap-2 bg-olive/5 rounded-lg p-2 border-2 border-olive/30 shadow-sm">
      {render(temp, setTemp)}
      <button onClick={() => onSave(temp)} className="p-2 rounded-full bg-olive text-white shrink-0 hover:bg-olive-dark transition-colors" title="Guardar">
        <Check className="h-4 w-4" />
      </button>
      <button onClick={onCancel} className="p-2 rounded-full bg-white border-2 border-warm-gray/20 text-warm-gray shrink-0 hover:bg-warm-gray/5 transition-colors" title="Cancelar">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function MargenObjetivoSection({ margenObjetivo, onSave }) {
  const [editando, setEditando] = useState(false);
  const [temp, setTemp] = useState('');

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-soft">Margen objetivo</span>
      {editando ? (
        <InlineEdit
          value={temp}
          onSave={(v) => { onSave(v); setEditando(false); }}
          onCancel={() => setEditando(false)}
          render={(t, setT) => (
            <>
              <input
                type="number" step="0.5" min="0" max="100"
                value={t}
                onChange={e => setT(e.target.value)}
                className="w-16 rounded-lg border-2 border-olive/40 px-2 py-2 text-sm bg-white text-right font-semibold focus:border-olive focus:ring-2 focus:ring-olive/20 outline-none transition"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') { onSave(t); setEditando(false); }
                  if (e.key === 'Escape') setEditando(false);
                }}
              />
              <span className="text-sm font-semibold text-ink shrink-0">%</span>
            </>
          )}
        />
      ) : (
        <button
          onClick={() => { setTemp(margenObjetivo); setEditando(true); }}
          className="font-medium text-ink inline-flex items-center gap-1 bg-terracotta/10 rounded-lg px-3 py-1.5 active:bg-terracotta/20 transition-colors border border-dashed border-terracotta/30"
        >
          {margenObjetivo}%
          <Edit3 className="h-3 w-3 text-terracotta" />
        </button>
      )}
    </div>
  );
}
