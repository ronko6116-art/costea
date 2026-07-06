import CategoriaDropdown from './CategoriaDropdown';

function BtnFiltro({ activo, onClick, children }) {
  const base = 'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors';
  return (
    <button onClick={onClick}
      className={`${base} ${activo
        ? 'bg-terracotta text-white border-terracotta'
        : 'bg-white text-ink border-warm-gray/20 hover:border-terracotta/30'}`}>
      {children}
    </button>
  );
}

function BtnAlertas({ activo, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${activo
        ? 'bg-red-500 text-white border-red-500'
        : 'bg-white text-ink border-warm-gray/20 hover:border-red-300'}`}>
      {children}
    </button>
  );
}

function BtnOcultos({ mostrarOcultos, onClick }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${mostrarOcultos
        ? 'bg-amber-500 text-white border-amber-500'
        : 'bg-white text-ink border-warm-gray/20 hover:border-amber-300'}`}>
      {mostrarOcultos ? 'Ver todos' : 'Solo activos'}
    </button>
  );
}

export default function BarraFiltros({
  alertasCount, categorias, filtro, categoriaFiltro, ordenBeneficio, mostrarOcultos,
  onChangeFiltro, onChangeCategoria, onChangeOrden, onChangeOcultos,
}) {
  return (
    <div className="mb-4 flex items-center gap-2 flex-wrap">
      <BtnFiltro
        activo={filtro === 'todo' && !categoriaFiltro && ordenBeneficio === 'none'}
        onClick={() => { onChangeFiltro('todo'); onChangeCategoria(''); }}>
        Todo
      </BtnFiltro>

      <BtnAlertas
        activo={filtro === 'alertas'}
        onClick={() => onChangeFiltro(filtro === 'alertas' ? 'todo' : 'alertas')}>
        Alertas {alertasCount > 0 && `(${alertasCount})`}
      </BtnAlertas>

      <CategoriaDropdown
        categorias={categorias}
        categoriaFiltro={categoriaFiltro}
        onChangeCategoria={onChangeCategoria}
        onChangeFiltro={onChangeFiltro}
      />

      <BtnFiltro
        activo={ordenBeneficio !== 'none'}
        onClick={() => onChangeOrden(prev => prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none')}>
        Beneficio
        {ordenBeneficio === 'desc' && ' ↓'}
        {ordenBeneficio === 'asc' && ' ↑'}
      </BtnFiltro>

      <BtnOcultos mostrarOcultos={mostrarOcultos} onClick={onChangeOcultos} />

      {categoriaFiltro && (
        <button onClick={() => onChangeCategoria('')}
          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium bg-terracotta/10 text-terracotta border border-terracotta/20">
          ✕
        </button>
      )}
    </div>
  );
}
