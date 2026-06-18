// src/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';
import { ChevronDown, LogOut, AlertTriangle, TrendingDown, TrendingUp, Euro, User, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState([]);
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState(null);
  const [platos, setPlatos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Cargar restaurantes del usuario
  useEffect(() => {

    const fetchRestaurantes = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurantes')
          .select('*')
          .order('nombre');

        if (error) throw error;

        setRestaurantes(data);
        if (data.length > 0) {
          setRestauranteSeleccionado(data[0]);
        }
      } catch (err) {
        console.error('Error al cargar restaurantes:', err);
        setError('No se pudieron cargar tus restaurantes. Verifica que el usuario tenga datos.');
      } finally {
        setLoading(false);
      }



    };

    fetchRestaurantes();
  }, []);

  // 2. Cargar platos y alertas al cambiar de restaurante
  useEffect(() => {
    if (!restauranteSeleccionado) return;

    const fetchPlatosYAlertas = async () => {
      setLoading(true);
      setError(null);
      try {
        // Platos con margen
        const { data: platosData, error: platosError } = await supabase
          .from('vista_coste_platos')
          .select('*')
          .eq('restaurante_id', restauranteSeleccionado.id)
          .order('plato_nombre');

        if (platosError) throw platosError;
        setPlatos(platosData);

        // Alertas activas
        const { data: alertasData, error: alertasError } = await supabase
          .from('alertas')
          .select('*')
          .eq('restaurante_id', restauranteSeleccionado.id)
          .eq('estado', 'pendiente')
          .order('created_at', { ascending: false });

        if (alertasError) throw alertasError;
        setAlertas(alertasData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos del restaurante.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlatosYAlertas();
  }, [restauranteSeleccionado]);

  const handleLogout = async () => {
    if (window.confirm('¿Seguro que quieres cerrar sesión?')) {
      try {
        await signOut();
        navigate('/');
      } catch (err) {
        console.error('Error al cerrar sesión:', err);
        alert('Ocurrió un error al cerrar sesión. Inténtalo de nuevo.');
      }
    }
  };

  const handleGoHome = () => navigate('/');

  // Mostrar error si no hay restaurantes
  if (error && restaurantes.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream p-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ink mb-2">Error al cargar datos</h2>
          <p className="text-ink-soft mb-4">{error}</p>
          <p className="text-sm text-ink-soft mb-6">
            Asegúrate de que el usuario <strong>demo@costea.com</strong> tenga restaurantes asignados.
            Ejecuta el script de seed en Supabase.
          </p>
          <button
            onClick={handleLogout}
            className="rounded-full bg-terracotta px-6 py-2 text-white hover:bg-terracotta-dark"
          >
            Cerrar sesión y volver
          </button>
        </div>
      </div>
    );
  }

  if (loading && restaurantes.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Cargando datos de tu restaurante...</div>;
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar propia */}
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-bold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-white">
              <Euro className="h-4 w-4" />
            </span>
            <span className="text-lg tracking-tight">Costea · Panel</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGoHome}
              className="flex items-center gap-1 rounded-full border border-warm-gray/30 px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-white/50 transition-colors"
              title="Ir al inicio"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Inicio</span>
            </button>

            <span className="text-sm text-ink-soft hidden md:inline">
              {session?.user?.email}
            </span>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Selector de restaurante */}
        {restaurantes.length > 1 && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <label htmlFor="restaurante" className="text-sm font-semibold text-ink">
              Restaurante:
            </label>
            <select
              id="restaurante"
              value={restauranteSeleccionado?.id || ''}
              onChange={(e) => {
                const selected = restaurantes.find(r => r.id === e.target.value);
                setRestauranteSeleccionado(selected);
              }}
              className="rounded-lg border border-warm-gray/30 bg-white px-4 py-2 text-sm font-medium text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
            >
              {restaurantes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Resumen de alertas */}
        {alertas.length > 0 && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">¡Atención! {alertas.length} alerta(s) pendiente(s)</p>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {alertas.slice(0, 3).map((a) => (
                    <li key={a.id}>
                      {a.plato_id ? `Plato: ${platos.find(p => p.plato_id === a.plato_id)?.plato_nombre || 'desconocido'}` : 'Proveedor'} — {a.tipo === 'erosion_margen' ? 'Margen por debajo del objetivo' : 'Subida sostenida de proveedor'}
                    </li>
                  ))}
                  {alertas.length > 3 && <li>+ {alertas.length - 3} más</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Lista de platos */}
        <div className="rounded-2xl border border-warm-gray/20 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink mb-4">
            Carta · {restauranteSeleccionado?.nombre || 'Selecciona un restaurante'}
          </h2>

          {loading ? (
            <p className="text-ink-soft">Cargando platos...</p>
          ) : platos.length === 0 ? (
            <p className="text-ink-soft">Aún no hay platos en este restaurante.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-warm-gray/20 text-xs uppercase text-warm-gray">
                  <tr>
                    <th className="py-3 pr-4 font-semibold">Plato</th>
                    <th className="py-3 pr-4 font-semibold">Categoría</th>
                    <th className="py-3 pr-4 font-semibold text-right">Precio venta</th>
                    <th className="py-3 pr-4 font-semibold text-right">Coste</th>
                    <th className="py-3 pr-4 font-semibold text-right">Margen</th>
                    <th className="py-3 font-semibold text-right">Alerta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-gray/10">
                  {platos.map((p) => {
                    const esAlerta = alertas.some(a => a.plato_id === p.plato_id);
                    const margenBajo = p.margen_pct < 50;
                    return (
                      <tr key={p.plato_id} className="hover:bg-cream/50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-ink">{p.plato_nombre}</td>
                        <td className="py-3 pr-4 text-ink-soft">{p.categoria || '—'}</td>
                        <td className="py-3 pr-4 text-right text-ink-soft">
                          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.precio_venta)}
                        </td>
                        <td className="py-3 pr-4 text-right text-ink-soft">
                          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.coste_total)}
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold">
                          <span
                            className={`inline-flex items-center gap-1 ${margenBajo ? 'text-red-600' : 'text-olive-dark'}`}
                          >
                            {p.margen_pct}%
                            {margenBajo ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {esAlerta ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                              <AlertTriangle className="h-3 w-3" /> Alerta
                            </span>
                          ) : (
                            <span className="text-xs text-warm-gray">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-warm-gray">
          <p>Los datos mostrados son de demostración. Los márgenes se calculan en tiempo real con los precios actuales de los ingredientes.</p>
        </div>
      </main>
    </div>
  );
}