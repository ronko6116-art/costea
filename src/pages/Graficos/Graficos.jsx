// src/Graficos.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, ChevronDown, TrendingUp, Store, BarChart3, ClipboardList, DollarSign } from 'lucide-react';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { supabase } from '../../supabaseClient';
import PrecioEvolucion from '../../components/PrecioEvolucion';
import AlertasPrecio from '../../components/AlertasPrecio';
import ComparativaProveedores from '../../components/ComparativaProveedores';
import ParteCocina from '../../components/ParteCocina';
import GraficoVentas from '../../components/GraficoVentas';

const SECCIONES = [
  { id: 'precios', label: 'Evolución de precios', icon: TrendingUp },
  { id: 'alertas', label: 'Alertas de precio', icon: BarChart3 },
  { id: 'proveedores', label: 'Comparativa proveedores', icon: Store },
  { id: 'parte', label: 'Parte de cocina', icon: ClipboardList },
  { id: 'ventas', label: 'Ventas', icon: DollarSign },
];

export default function Graficos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { restauranteId } = useRestaurant();

  const ingredienteParam = searchParams.get('ingrediente');

  const [seccionActiva, setSeccionActiva] = useState('precios');
  const [ingredientes, setIngredientes] = useState([]);
  const [ingredienteSel, setIngredienteSel] = useState(null);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [busquedaIng, setBusquedaIng] = useState('');
  const [loadingIng, setLoadingIng] = useState(true);

  useEffect(() => {
    if (!restauranteId) return;
    setLoadingIng(true);
    supabase
      .from('ingredientes')
      .select('id, nombre, precio_actual, unidad_medida')
      .eq('restaurante_id', restauranteId)
      .order('nombre')
      .then(({ data }) => {
        if (data) setIngredientes(data);
        setLoadingIng(false);
      });
  }, [restauranteId]);

  // Seleccionar ingrediente de query param
  useEffect(() => {
    if (ingredienteParam && ingredientes.length) {
      const encontrado = ingredientes.find(i => i.id === ingredienteParam);
      if (encontrado) {
        setIngredienteSel(encontrado);
        setSeccionActiva('precios');
      }
    }
  }, [ingredienteParam, ingredientes]);

  const ingredientesFiltrados = useMemo(() => {
    if (!busquedaIng) return ingredientes;
    const q = busquedaIng.toLowerCase();
    return ingredientes.filter(i => i.nombre.toLowerCase().includes(q));
  }, [ingredientes, busquedaIng]);

  const seleccionarIngrediente = (ing) => {
    setIngredienteSel(ing);
    setBuscadorAbierto(false);
    setBusquedaIng('');
  };

  const limpiarIngrediente = () => {
    setIngredienteSel(null);
    navigate('/graficos', { replace: true });
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="p-2 -ml-2 rounded-full hover:bg-olive/10 text-ink transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg">Gráficos</span>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {/* Selector de sección */}
        <div className="flex gap-1 bg-warm-gray/10 rounded-xl p-1 mb-4 overflow-x-auto">
          {SECCIONES.map(s => {
            const activa = seccionActiva === s.id;
            const Icono = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setSeccionActiva(s.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activa
                    ? 'bg-white text-terracotta shadow-sm'
                    : 'text-warm-gray hover:text-ink'
                }`}
              >
                <Icono className="h-4 w-4" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Sección: Evolución de precios */}
        {seccionActiva === 'precios' && (
          <div>
            {/* Selector de ingrediente */}
            <div className="relative mb-4">
              {ingredienteSel ? (
                <div className="bg-white rounded-xl border border-warm-gray/20 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-ink">{ingredienteSel.nombre}</p>
                      <p className="text-xs text-warm-gray">
                        {ingredienteSel.precio_actual}€ / {ingredienteSel.unidad_medida}
                      </p>
                    </div>
                    <button
                      onClick={limpiarIngrediente}
                      className="text-sm text-terracotta font-medium hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setBuscadorAbierto(!buscadorAbierto)}
                    className="w-full flex items-center justify-between bg-white rounded-xl border border-warm-gray/20 px-4 py-3 shadow-sm"
                  >
                    <span className="text-warm-gray">
                      {loadingIng ? 'Cargando...' : 'Selecciona un ingrediente'}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-warm-gray transition-transform ${buscadorAbierto ? 'rotate-180' : ''}`} />
                  </button>
                  {buscadorAbierto && (
                    <div className="mt-2 bg-white rounded-xl border border-warm-gray/20 shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-warm-gray/10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
                          <input
                            type="text"
                            value={busquedaIng}
                            onChange={e => setBusquedaIng(e.target.value)}
                            placeholder="Buscar ingrediente..."
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-cream text-sm outline-none focus:ring-2 focus:ring-terracotta/20"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {ingredientesFiltrados.length === 0 ? (
                          <p className="text-center text-sm text-warm-gray py-6">
                            {busquedaIng ? 'Sin resultados' : 'No hay ingredientes'}
                          </p>
                        ) : (
                          ingredientesFiltrados.map(ing => (
                            <button
                              key={ing.id}
                              onClick={() => seleccionarIngrediente(ing)}
                              className="w-full text-left px-4 py-3 hover:bg-cream transition-colors border-b border-warm-gray/5 last:border-0"
                            >
                              <span className="font-medium text-ink text-sm">{ing.nombre}</span>
                              <span className="text-xs text-warm-gray ml-2">
                                {ing.precio_actual}€ / {ing.unidad_medida}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gráfico */}
            {ingredienteSel ? (
              <PrecioEvolucion
                ingredienteId={ingredienteSel.id}
                onClose={limpiarIngrediente}
              />
            ) : (
              <div className="bg-white rounded-xl border border-warm-gray/10 p-8 text-center shadow-sm">
                <TrendingUp className="h-10 w-10 text-warm-gray/40 mx-auto mb-3" />
                <p className="text-warm-gray text-sm">
                  Selecciona un ingrediente para ver su evolución de precio
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sección: Alertas de precio */}
        {seccionActiva === 'alertas' && (
          <AlertasPrecio restauranteId={restauranteId} />
        )}

        {/* Sección: Comparativa proveedores */}
        {seccionActiva === 'proveedores' && (
          <ComparativaProveedores restauranteId={restauranteId} />
        )}

        {/* Sección: Parte de cocina */}
        {seccionActiva === 'parte' && (
          <ParteCocina restauranteId={restauranteId} />
        )}

        {/* Sección: Ventas */}
        {seccionActiva === 'ventas' && (
          <GraficoVentas restauranteId={restauranteId} />
        )}
      </main>
    </div>
  );
}
