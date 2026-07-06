import PlatoCard from '../contexts/PlatoCard';
import { useNavigate } from 'react-router-dom';

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filtro, categoriaFiltro }) {
  return (
    <div className="bg-white rounded-xl p-6 text-center shadow-sm">
      <p className="text-ink-soft">
        {filtro === 'alertas'
          ? 'No hay platos con alertas de margen.'
          : categoriaFiltro
            ? `No hay platos en la categoría "${categoriaFiltro}".`
            : 'Aún no hay platos en este restaurante.'}
      </p>
    </div>
  );
}

export default function PlatoListContent({ loadingPlatos, filteredPlatos, filtro, categoriaFiltro }) {
  const navigate = useNavigate();

  if (loadingPlatos) return <Skeleton />;

  if (filteredPlatos.length === 0) {
    return <EmptyState filtro={filtro} categoriaFiltro={categoriaFiltro} />;
  }

  return (
    <div className="space-y-3">
      {filteredPlatos.map((plato) => (
        <PlatoCard
          key={plato.plato_id}
          plato={plato}
          onPress={() => navigate(`/plato/${plato.plato_id}`)}
        />
      ))}
    </div>
  );
}
