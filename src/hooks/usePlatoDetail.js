import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function usePlatoDetail(id, session) {
  const [plato, setPlato] = useState(null);
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || !session) {
      setError('No hay sesión o ID de plato');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: platoData, error: platoError } = await supabase
          .from('vista_coste_platos')
          .select('*')
          .eq('plato_id', id)
          .single();

        if (platoError) throw platoError;
        setPlato(platoData);

        const { data: recetaData, error: recetaError } = await supabase
          .from('receta_lineas')
          .select(`
            id, cantidad, merma_pct,
            ingrediente:ingrediente_id (id, nombre, unidad_medida, precio_actual, categoria, proveedor_habitual_id)
          `)
          .eq('receta_id', platoData.receta_id);

        if (recetaError) throw recetaError;

        if (!recetaData?.length) {
          setIngredientes([]);
        } else {
          const lineasConCoste = recetaData.map(linea => {
            const ing = linea.ingrediente;
            if (!ing) return null;
            const precioUnitario = ing.precio_actual || 0;
            const cantidadConMerma = linea.cantidad * (1 + (linea.merma_pct || 0) / 100);
            const factorUnidad = ing.unidad_medida === 'docena' ? 1 / 12 : 1;
            const porciones = platoData.porciones_base || 1;
            const factor = platoData.factor_porcion || 1;
            return {
              ...linea,
              ingrediente: ing,
              cantidadConMerma,
              cantidadEscalada: linea.cantidad / porciones * factor,
              costeLinea: precioUnitario * cantidadConMerma * factorUnidad / porciones * factor,
              precioUnitario,
            };
          }).filter(Boolean);

          setIngredientes(lineasConCoste);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message || 'Error al cargar los datos del plato');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, session]);

  return { plato, setPlato, ingredientes, loading, error };
}
