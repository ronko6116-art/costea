import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Home, Bell, Store, PlusCircle } from 'lucide-react';

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [alertasCount, setAlertasCount] = useState(0);

  useEffect(() => {
    const fetchAlertas = async () => {
      const savedId = localStorage.getItem('restauranteId');
      if (!savedId) return;
      const { data } = await supabase
        .from('vista_coste_platos')
        .select('plato_id, margen_pct, margen_objetivo')
        .eq('restaurante_id', savedId);
      if (data) {
        setAlertasCount(data.filter(p => p.margen_objetivo > 0 && p.margen_pct < p.margen_objetivo).length);
      }
    };
    fetchAlertas();
  }, []);

  const navItems = [
    { label: 'Inicio', icon: Home, path: '/dashboard' },
    { label: 'Alertas', icon: Bell, path: '/dashboard', hash: '#seccion-alertas' },
    { label: 'Proveedores', icon: Store, path: '/proveedores' },
    { label: 'Ingrediente', icon: PlusCircle, path: '/ingredientes/nuevo' },
  ];

  const isActive = (item) => {
    if (item.path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(item.path);
  };

  const handleNavClick = (item) => {
    if (item.hash) {
      if (location.pathname === '/dashboard') {
        const el = document.getElementById('seccion-alertas');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(item.path);
      }
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-20">
      {children}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-warm-gray/20 px-4 py-2 flex justify-around items-center z-40">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={`flex flex-col items-center relative ${active ? 'text-terracotta' : 'text-warm-gray'}`}
            >
              <Icon className="h-6 w-6" />
              {item.label === 'Alertas' && alertasCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                  {alertasCount}
                </span>
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
