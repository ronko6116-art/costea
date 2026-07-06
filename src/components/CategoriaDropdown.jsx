import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CategoriaDropdown({ categorias, categoriaFiltro, onChangeCategoria, onChangeFiltro }) {
  const [showCatMenu, setShowCatMenu] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setShowCatMenu(!showCatMenu)}
        className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors flex items-center gap-1 ${
          categoriaFiltro
            ? 'bg-terracotta text-white border-terracotta'
            : 'bg-white text-ink border-warm-gray/20 hover:border-terracotta/30'
        }`}
      >
        {categoriaFiltro || 'Categoría'}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCatMenu ? 'rotate-180' : ''}`} />
      </button>
      {showCatMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-warm-gray/20 shadow-lg z-10 min-w-[140px] overflow-hidden">
          <button
            onClick={() => { onChangeCategoria(''); setShowCatMenu(false); onChangeFiltro('todo'); }}
            className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-cream"
          >
            Todas
          </button>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => { onChangeCategoria(cat); setShowCatMenu(false); onChangeFiltro('todo'); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-cream ${
                categoriaFiltro === cat ? 'bg-cream font-semibold text-terracotta' : 'text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
