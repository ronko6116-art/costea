import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Trash2, BookOpen, AlertTriangle } from 'lucide-react';
import { formatearMoneda } from '../../functions/formatters';
import usePlatoDetail from '../../hooks/usePlatoDetail';
import InfoPlato from '../../components/InfoPlato';
import ListaIngredientes from '../../components/ListaIngredientes';

export default function PlatoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { plato, setPlato, ingredientes, loading, error } = usePlatoDetail(id, session);
  const [activo, setActivo] = useState(true);

  const handleToggleActivo = async () => {
    const nuevoValor = !activo;
    const { error: err } = await supabase
      .from('platos')
      .update({ activo: nuevoValor, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) {
      alert('Error al cambiar visibilidad: ' + err.message);
      return;
    }
    setActivo(nuevoValor);
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este plato? Esta acción no se puede deshacer.')) return;
    const { error: err } = await supabase
      .from('platos')
      .delete()
      .eq('id', id);
    if (err) {
      alert('Error al eliminar: ' + err.message);
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto mb-4" />
          <p className="text-ink-soft">Cargando el plato...</p>
        </div>
      </div>
    );
  }

  if (error || !plato) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-sm text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ink mb-2">Error al cargar</h2>
          <p className="text-ink-soft">{error || 'No se encontró el plato'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 w-full bg-terracotta text-white rounded-full py-3 font-semibold"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-olive/10 text-ink transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="font-bold text-ink text-lg truncate max-w-[60%]">{plato.plato_nombre}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
              aria-label="Eliminar plato"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/recetas', { state: { expandRecipeId: plato.receta_id } })}
              className="bg-olive text-white rounded-full px-4 py-2 text-sm font-semibold"
            >
              <BookOpen className="h-4 w-4 inline mr-1" />
              Editar receta
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        <InfoPlato plato={plato} ingredientes={ingredientes} onUpdate={(p) => { setPlato(p); }} />

        <div className="mt-2 flex items-center gap-2 mb-4">
          <button
            onClick={handleToggleActivo}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${activo ? 'bg-green-500' : 'bg-warm-gray/40'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${activo ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
          </button>
          <span className="text-xs text-ink-soft">
            {activo ? 'Visible en dashboard' : 'Oculto en dashboard'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-warm-gray/10 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-warm-gray/10 flex justify-between items-center">
            <h3 className="font-semibold text-ink">Ingredientes y costes</h3>
            <span className="text-sm text-warm-gray">{ingredientes.length} items</span>
          </div>

          <ListaIngredientes
            ingredientes={ingredientes}
            plato={plato}
            onNavigate={() => navigate('/recetas', { state: { expandRecipeId: plato.receta_id } })}
          />

          <div className="px-5 py-4 bg-cream/50 border-t border-warm-gray/10 flex justify-between items-center">
            <span className="font-semibold text-ink">Coste total</span>
            <span className="font-bold text-ink text-lg">{formatearMoneda(plato.coste_total)}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
