import { useState } from 'react';
import { UtensilsCrossed, Menu, X } from 'lucide-react';

export default function Navbar({ onLoginClick, onSignupClick }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-warm-gray/20 bg-cream/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2 font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-white">
            <UtensilsCrossed className="h-4 w-4" />
          </span>
          <span className="text-lg tracking-tight">Costea</span>
        </a>

        <nav className="hidden items-center gap-8 sm:flex">
          <a href="#funciones" className="text-sm font-medium text-ink-soft transition-colors hover:text-terracotta">
            Funciones
          </a>
          <a href="#contacto" className="text-sm font-medium text-ink-soft transition-colors hover:text-terracotta">
            Contacto
          </a>
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <button
            onClick={onLoginClick}
            className="rounded-full border border-olive px-4 py-2 text-sm font-semibold text-olive transition-colors hover:bg-olive/8"
          >
            Iniciar sesión
          </button>
          <button
            onClick={onSignupClick}
            className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(231,111,81,0.7)] transition-colors hover:bg-terracotta-dark"
          >
            Crear cuenta
          </button>
        </div>

        <button
          className="text-ink sm:hidden"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-warm-gray/20 bg-cream px-4 py-4 sm:hidden">
          <nav className="mb-4 flex flex-col gap-3">
            <a href="#funciones" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-ink-soft">
              Funciones
            </a>
            <a href="#contacto" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-ink-soft">
              Contacto
            </a>
          </nav>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setMobileOpen(false); onLoginClick(); }}
              className="rounded-full border border-olive px-4 py-2 text-sm font-semibold text-olive"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setMobileOpen(false); onSignupClick(); }}
              className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white"
            >
              Crear cuenta
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
