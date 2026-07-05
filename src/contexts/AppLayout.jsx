import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Store, BarChart3, BookOpen, PlusCircle } from 'lucide-react';

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Inicio', icon: Home, path: '/dashboard' },
    { label: 'Proveedores', icon: Store, path: '/proveedores' },
    { label: 'Gráficos', icon: BarChart3, path: '/graficos' },
    { label: 'Recetas', icon: BookOpen, path: '/recetas' },
    { label: 'Ingrediente', icon: PlusCircle, path: '/ingredientes' },
  ];

  const isActive = (item) => {
    if (item.path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(item.path);
  };

  const handleNavClick = (item) => {
    navigate(item.path);
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
              className={`flex flex-col items-center relative px-3 py-1 rounded-xl transition-colors ${
                active ? 'text-terracotta bg-terracotta/10' : 'text-warm-gray hover:text-ink/60'
              }`}
            >
              <Icon className={`h-6 w-6 ${active ? 'drop-shadow-sm' : ''}`} />
              <span className={`text-[10px] mt-0.5 ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-terracotta" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
