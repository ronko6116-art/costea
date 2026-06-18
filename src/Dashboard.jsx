// src/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Euro,
  ChevronDown,
  Home,
  Receipt,
  Bell,
  User,
  Package
} from 'lucide-react';
import PlatoCard from './PlatoCard';

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState([]);
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState(null);
  const [platos, setPlatos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarSelector, setMostrarSelector] = useState(false);

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
        setRestauranteSeleccionado(data[0]);
      }
      setLoading(false);
    };

    fetchRestaurantes();
  }, []);

  // Cargar platos y alertas al cambiar de restaurante
  useEffect(() => {
    if (!restauranteSeleccionado) return;

    const fetchPlatosYAlertas = async () => {
      setLoading(true);
      const { data: platosData, error: platosError } = await supabase
        .from('vista_coste_platos')
        .select('*')
        .eq('restaurante_id', restauranteSeleccionado.id)
        .order('plato_nombre');

      if (platosError) {
        console.error(platosError);
      } else {
        setPlatos(platosData);
      }

      const { data: alertasData, error: alertasError } = await supabase
        .from('alertas')
        .select('*')
        .eq('restaurante_id', restauranteSeleccionado.id)
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false });

      if (alertasError) {
        console.error(alertasError);
      } else {
        setAlertas(alertasData);
      }

      setLoading(false);
    };

    fetchPlatosYAlertas();
  }, [restauranteSeleccionado]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Formateador de moneda
  const formatoMoneda = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  });

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
    <div className="min-h-screen bg-cream pb-20">
      {/* Header con navegación */}
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-white">
              <Euro className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold text-ink">Costea</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-olive/10 text-olive transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
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
              </div>
            )}
          </div>
        )}

        {/* Resumen de alertas (destacado) */}
        {alertas.length > 0 && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-800 text-sm">
                  {alertas.length} alerta{alertas.length > 1 ? 's' : ''} pendiente{alertas.length > 1 ? 's' : ''}
                </p>
                <ul className="mt-1 text-sm text-red-700 space-y-1">
                  {alertas.slice(0, 2).map((a) => {
                    const plato = platos.find(p => p.plato_id === a.plato_id);
                    return (
                      <li key={a.id} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                        <span>
                          {plato ? plato.plato_nombre : 'Plato desconocido'}
                          {a.tipo === 'erosion_margen' && ' → margen bajo'}
                          {a.tipo === 'proveedor_subida_sostenida' && ' → proveedor subió'}
                        </span>
                      </li>
                    );
                  })}
                  {alertas.length > 2 && (
                    <li className="text-red-600 font-medium text-xs">
                      + {alertas.length - 2} más
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

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
                tieneAlerta={alertas.some(a => a.plato_id === plato.plato_id)}
                formatoMoneda={formatoMoneda}
                onPress={() => {
                  // Aquí navegaremos al detalle del plato (próximo paso)
                  console.log('Navegar a detalle de', plato.plato_nombre);
                  <PlatoCard
                    key={plato.plato_id}
                    plato={plato}
                    tieneAlerta={alertas.some(a => a.plato_id === plato.plato_id)}
                    formatoMoneda={formatoMoneda}
                    onPress={() => navigate(`/plato/${plato.plato_id}`)}
                  />
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom navigation (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-warm-gray/20 px-4 py-2 flex justify-around items-center">
        <button className="flex flex-col items-center text-terracotta">
          <Home className="h-6 w-6" />
          <span className="text-[10px] font-medium">Inicio</span>
        </button>
        <button className="flex flex-col items-center text-warm-gray">
          <Receipt className="h-6 w-6" />
          <span className="text-[10px] font-medium">Facturas</span>
        </button>
        <button className="flex flex-col items-center text-warm-gray relative">
          <Bell className="h-6 w-6" />
          {alertas.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
              {alertas.length}
            </span>
          )}
          <span className="text-[10px] font-medium">Alertas</span>
        </button>
        <button
            onClick={() => navigate('/ingredientes')}
            className="flex flex-col items-center text-warm-gray"
            >
            <Package className="h-6 w-6" />
            <span className="text-[10px] font-medium">Ingredientes</span>
        </button>
        <button className="flex flex-col items-center text-warm-gray">
          <User className="h-6 w-6" />
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </nav>
    </div>
  );
}