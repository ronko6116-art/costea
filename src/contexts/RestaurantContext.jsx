import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const RestaurantContext = createContext(null);

export function RestaurantProvider({ children }) {
  const [restaurantes, setRestaurantes] = useState([]);
  const [restaurante, setRestauranteState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase
      .from('restaurantes')
      .select('*')
      .order('nombre')
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('Error cargando restaurantes:', error);
          setLoading(false);
          return;
        }
        const list = data ?? [];
        setRestaurantes(list);
        if (list.length > 0) {
          const savedId = localStorage.getItem('restauranteId');
          const saved = list.find(r => r.id === savedId);
          setRestauranteState(saved || list[0]);
        }
        setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const setRestaurante = useCallback((r) => {
    setRestauranteState(r);
    if (r?.id) {
      localStorage.setItem('restauranteId', r.id);
    }
  }, []);

  useEffect(() => {
    if (restaurantes.length > 0 && !restaurante) {
      const savedId = localStorage.getItem('restauranteId');
      const saved = restaurantes.find(r => r.id === savedId);
      setRestauranteState(saved || restaurantes[0]);
    }
  }, [restaurantes, restaurante]);

  const value = {
    restaurante,
    restauranteId: restaurante?.id ?? null,
    restaurantes,
    setRestaurante,
    loading,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant debe usarse dentro de RestaurantProvider');
  return ctx;
}
