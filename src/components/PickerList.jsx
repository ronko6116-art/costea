import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function PickerList({
  items,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  emptyMessage = 'Sin resultados',
  renderItem,
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find(i => i.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
          selected
            ? 'border-olive bg-olive/5 font-medium text-ink'
            : 'border-warm-gray/30 bg-white text-warm-gray'
        }`}
      >
        <span>{selected ? selected.nombre : placeholder}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-white rounded-lg border border-warm-gray/20 shadow-lg max-h-48 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-warm-gray py-3 text-center">{emptyMessage}</p>
          ) : (
            items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => { onChange(item.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-cream transition-colors ${
                  value === item.id ? 'bg-cream font-semibold text-terracotta' : 'text-ink'
                }`}
              >
                {renderItem ? renderItem(item, value === item.id) : item.nombre}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
