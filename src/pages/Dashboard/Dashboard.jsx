import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogOut, Euro, PlusCircle } from 'lucide-react';
import SelectorRestaurante from '../../components/SelectorRestaurante';
import BarraFiltros from '../../components/BarraFiltros';
import AlertasBanner from '../../components/AlertasBanner';
import PlatoListContent from '../../components/PlatoListContent';
import Onboarding from './Onboarding';
import { aplicarFiltros, obtenerCategorias, obtenerAlertas } from '../../helpers/platoFilters';

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const { restaurantes, restaurante: restauranteSeleccionado, restauranteId, setRestaurante, loading: loadingRest } = useRestaurant();
  const [platos, setPlatos] = useState([]);
  const [loadingPlatos, setLoadingPlatos] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [filtro, setFiltro] = useState('todo');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [ordenBeneficio, setOrdenBeneficio] = useState('none');
  const [mostrarOcultos, setMostrarOcultos] = useState(false);

  useEffect(() => {
    if (!loadingRest && restaurantes.length === 0) {
      setNeedsOnboarding(true);
    }
  }, [loadingRest, restaurantes]);

  useEffect(() => {
    if (!restauranteId) return;

    supabase
      .from('vista_coste_platos')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('plato_nombre')
      .then(({ data }) => { if (data) setPlatos(data); })
      .finally(() => setLoadingPlatos(false));
  }, [restauranteId]);

  const alertasMargen = useMemo(() => obtenerAlertas(platos), [platos]);
  const categorias = useMemo(() => obtenerCategorias(platos), [platos]);
  const filteredPlatos = useMemo(
    () => aplicarFiltros(platos, { mostrarOcultos, filtro, categoriaFiltro, ordenBeneficio }),
    [platos, mostrarOcultos, filtro, categoriaFiltro, ordenBeneficio]
  );

  if (needsOnboarding) {
    return <Onboarding userId={session?.user?.id} onComplete={(r) => { setRestaurante(r); setNeedsOnboarding(false); }} />;
  }

  if (loadingRest && restaurantes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto mb-4" />
          <p className="text-ink-soft">Cargando tu restaurante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-white">
              <Euro className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold text-ink">Costea</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/platos/nuevo')}
              className="flex items-center gap-1 bg-terracotta text-white rounded-full px-4 py-2 text-sm font-semibold hover:bg-terracotta-dark transition-colors">
              <PlusCircle className="h-4 w-4" />
              Plato
            </button>
            <button onClick={() => { signOut(); navigate('/'); }}
              className="p-2 rounded-full hover:bg-olive/10 text-olive transition-colors" aria-label="Cerrar sesión">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-6xl mx-auto">
        <SelectorRestaurante
          restaurantes={restaurantes}
          restauranteSeleccionado={restauranteSeleccionado}
          session={session}
          onSelect={setRestaurante}
        />

        <AlertasBanner alertas={alertasMargen} />

        {platos.length > 0 && (
          <BarraFiltros
            alertasCount={alertasMargen.length}
            categorias={categorias}
            filtro={filtro}
            categoriaFiltro={categoriaFiltro}
            ordenBeneficio={ordenBeneficio}
            mostrarOcultos={mostrarOcultos}
            onChangeFiltro={setFiltro}
            onChangeCategoria={setCategoriaFiltro}
            onChangeOrden={setOrdenBeneficio}
            onChangeOcultos={() => setMostrarOcultos(!mostrarOcultos)}
          />
        )}

        <PlatoListContent
          loadingPlatos={loadingPlatos}
          filteredPlatos={filteredPlatos}
          filtro={filtro}
          categoriaFiltro={categoriaFiltro}
        />
      </main>
    </div>
  );
}
