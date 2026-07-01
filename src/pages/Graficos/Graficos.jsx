import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import AlertasPrecio from '../../components/AlertasPrecio';

export default function Graficos() {
  const navigate = useNavigate();
  const [restauranteId, setRestauranteId] = useState(null);

  useEffect(() => {
    const savedId = localStorage.getItem('restauranteId');
    if (savedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRestauranteId(savedId);
      return;
    }
    supabase.from('restaurantes').select('id').limit(1).single().then(({ data }) => {
      if (data) setRestauranteId(data.id);
    });
  }, []);

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
        <AlertasPrecio restauranteId={restauranteId} />
      </main>
    </div>
  );
}
