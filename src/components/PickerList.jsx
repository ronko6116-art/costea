import { useState } from 'react';

export default function PickerList({
  items,
  value,
  onChange,
  placeholder = 'Buscar...',
  emptyMessage = 'Sin resultados',
  renderItem,
  footer,
  searchValue: controlledSearch,
  onSearchChange: controlledSearchChange,
}) {
  const [internalSearch, setInternalSearch] = useState('');
  const isControlled = controlledSearch !== undefined;
  const search = isControlled ? controlledSearch : internalSearch;
  const setSearch = isControlled ? controlledSearchChange : setInternalSearch;

  const filtered = items.filter(item =>
    !search || item.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
      />
      {items.length === 0 ? (
        <p className="text-sm text-warm-gray py-2 text-center">{emptyMessage}</p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-warm-gray/10 p-1 bg-white">
          {filtered.length === 0 && search ? (
            <p className="text-sm text-warm-gray py-2 text-center">Sin coincidencias</p>
          ) : (
            filtered.map(item => {
              const selected = value === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onChange(item.id); if (isControlled) controlledSearchChange(''); else setInternalSearch(''); }}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                    selected
                      ? 'border-olive bg-olive/5 ring-1 ring-olive'
                      : 'border-transparent hover:border-warm-gray/20 hover:bg-warm-gray/5'
                  }`}
                >
                  {renderItem ? renderItem(item, selected) : (
                    <span className="font-medium text-ink">{item.nombre}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
      {footer && <div className="pt-1">{footer}</div>}
    </div>
  );
}
