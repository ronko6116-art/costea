import { useState } from 'react';
import { ChevronDown, PlusCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SelectorRestaurante({ restaurantes, restauranteSeleccionado, session, onSelect }) {
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [showNewRestaurant, setShowNewRestaurant] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [creandoRest, setCreandoRest] = useState(false);

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
    onSelect(data);
    setShowNewRestaurant(false);
    setNewRestaurantName('');
  };

  if (restaurantes.length === 0) return null;

  return (
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
                onSelect(r);
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
                <PlusCircle className="h-4 w-4 inline mr-1" />
                Añadir restaurante
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
