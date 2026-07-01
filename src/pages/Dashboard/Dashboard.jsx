// src/Dashboard.jsx
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  AlertTriangle, 
  Euro,
  ChevronDown,
  PlusCircle
} from 'lucide-react';
import PlatoCard from '../../contexts/PlatoCard';
import Onboarding from './Onboarding';
import AlertasPrecio from '../../components/AlertasPrecio';

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState([]);
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState(null);
  const [platos, setPlatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showNewRestaurant, setShowNewRestaurant] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [creandoRest, setCreandoRest] = useState(false);

  // Cargar restaurantes del usuario
  useEffect(() => {
    const fetchRestaurantes = async () => {
      const { data, error } = await supabase
        .from('restaurantes')
        .select('*')
        .order('nombre');

      if (error) {
        console.error(error);
        return;
      }

      setRestaurantes(data);
      if (data.length > 0) {
        const savedId = localStorage.getItem('restauranteId');
        const saved = data.find(r => r.id === savedId);
        setRestauranteSeleccionado(saved || data[0]);
      } else {
        setNeedsOnboarding(true);
      }
      setLoading(false);
    };

    fetchRestaurantes();
  }, []);

  // Cargar platos al cambiar de restaurante
  useEffect(() => {
    if (!restauranteSeleccionado) return;

    const fetchPlatos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('vista_coste_platos')
        .select('*')
        .eq('restaurante_id', restauranteSeleccionado.id)
        .order('plato_nombre');

      if (error) {
        console.error(error);
      } else {
        setPlatos(data);
      }

      setLoading(false);
    };

    fetchPlatos();
  }, [restauranteSeleccionado]);

  // Persist restaurant selection across navigations
  useEffect(() => {
    if (restauranteSeleccionado) {
      localStorage.setItem('restauranteId', restauranteSeleccionado.id);
    }
  }, [restauranteSeleccionado]);

  // Alertas de margen computadas localmente desde los platos
  const alertasMargen = useMemo(() =>
    platos.filter(p => p.margen_objetivo > 0 && p.margen_pct < p.margen_objetivo),
    [platos]
  );

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleOnboardingComplete = (nuevoRestaurante) => {
    setRestaurantes([nuevoRestaurante]);
    setRestauranteSeleccionado(nuevoRestaurante);
    setNeedsOnboarding(false);
  };

  const handleAddRestaurant = async () => {
    if (!newRestaurantName.trim()) return;
    setCreandoRest(true);
    const { data, error } = await supabase
      .from('restaurantes')
      .insert([{
        owner_id: session?.user?.id,
        nombre: newRestaurantName.trim(),
        pais: 'ES',
        moneda: 'EUR',
      }])
      .select()
      .single();
    setCreandoRest(false);
    if (error) {
      alert('Error al crear restaurante: ' + error.message);
      return;
    }
    setRestaurantes(prev => [...prev, data]);
    setRestauranteSeleccionado(data);
    setShowNewRestaurant(false);
    setNewRestaurantName('');
  };

  // Formateador de moneda
  const formatoMoneda = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  });

  if (needsOnboarding) {
    return (
      <Onboarding
        userId={session?.user?.id}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  if (loading && restaurantes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto mb-4"></div>
          <p className="text-ink-soft">Cargando tu restaurante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header con navegación */}
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-white">
              <Euro className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold text-ink">Costea</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/platos/nuevo')}
              className="flex items-center gap-1 bg-terracotta text-white rounded-full px-4 py-2 text-sm font-semibold hover:bg-terracotta-dark transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Plato
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-olive/10 text-olive transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-6xl mx-auto">
        {/* Selector de restaurante (mobile-friendly) */}
        {restaurantes.length > 0 && (
          <div className="relative mb-4">
            <button
              onClick={() => setMostrarSelector(!mostrarSelector)}
              className="w-full flex items-center justify-between bg-white rounded-xl border border-warm-gray/20 px-4 py-3 shadow-sm"
            >
              <span className="font-semibold text-ink">
                {restauranteSeleccionado?.nombre || 'Selecciona un restaurante'}
              </span>
              <ChevronDown className={`h-5 w-5 text-warm-gray transition-transform ${mostrarSelector ? 'rotate-180' : ''}`} />
            </button>
            {mostrarSelector && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-warm-gray/20 shadow-lg z-10 overflow-hidden">
                {restaurantes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setRestauranteSeleccionado(r);
                      setMostrarSelector(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-cream transition-colors ${
                      r.id === restauranteSeleccionado?.id ? 'bg-cream font-semibold' : ''
                    }`}
                  >
                    {r.nombre}
                  </button>
                ))}
                <div className="border-t border-warm-gray/10">
                  {showNewRestaurant ? (
                    <div className="px-4 py-3 space-y-2">
                      <input
                        type="text"
                        value={newRestaurantName}
                        onChange={(e) => setNewRestaurantName(e.target.value)}
                        placeholder="Nombre del nuevo restaurante"
                        className="w-full rounded-lg border border-warm-gray/30 px-3 py-2 text-sm bg-cream focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddRestaurant}
                          disabled={creandoRest || !newRestaurantName.trim()}
                          className="flex-1 bg-terracotta text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
                        >
                          {creandoRest ? 'Creando...' : 'Crear'}
                        </button>
                        <button
                          onClick={() => { setShowNewRestaurant(false); setNewRestaurantName(''); }}
                          className="px-4 py-2 text-sm text-warm-gray hover:text-ink"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewRestaurant(true)}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-terracotta hover:bg-cream transition-colors"
                    >
                      + Añadir restaurante
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alertas de margen computadas desde los platos */}
        {alertasMargen.length > 0 && (
          <div id="seccion-alertas" className="mb-6 rounded-xl bg-linear-to-r from-red-50 to-red-100 border border-red-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-800 text-sm">
                  {alertasMargen.length} alerta{alertasMargen.length > 1 ? 's' : ''} de margen
                </p>
                <ul className="mt-1 text-sm text-red-700 space-y-1">
                  {alertasMargen.slice(0, 2).map((p) => (
                    <li key={p.plato_id} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                      <span>{p.plato_nombre} → margen bajo ({p.margen_pct}%)</span>
                    </li>
                  ))}
                  {alertasMargen.length > 2 && (
                    <li className="text-red-600 font-medium text-xs">
                      + {alertasMargen.length - 2} más
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Alertas de evolución de precios */}
        <AlertasPrecio restauranteId={restauranteSeleccionado?.id} />

        {/* Lista de platos en formato tarjeta (mobile-first) */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : platos.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <p className="text-ink-soft">Aún no hay platos en este restaurante.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {platos.map((plato) => (
                <PlatoCard
                    key={plato.plato_id}
                    plato={plato}
                    formatoMoneda={formatoMoneda}
                    onPress={() => {
                    console.log('Navegar a detalle de', plato.plato_nombre);
                    navigate(`/plato/${plato.plato_id}`);
                    }}
                />
            ))}
          </div>
        )}
      </main>


    </div>
  );
}