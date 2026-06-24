import { Receipt, TrendingDown, FileBarChart, Check } from 'lucide-react';

export default function Demo({ onLoginClick, onSignupClick }) {
  return (
    <div id="top">
      {/* Hero */}
      <section className="hero-gradient px-4 py-20 sm:py-28">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-14 lg:flex-row lg:justify-between">
          <div className="max-w-xl text-center lg:text-left">
            <p className="mb-4 inline-flex items-center rounded-full bg-terracotta/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-terracotta-dark">
              Para restaurantes independientes
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.1] text-ink sm:text-5xl">
              Descubre qué plato te da de comer. Y cuál te está costando dinero.
            </h1>
            <p className="mt-5 text-lg text-ink-soft">
              Sube tus facturas de proveedor y Costea vigila el margen real de
              cada plato de tu carta. Sin Excel, sin sorpresas a final de mes.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <button
                onClick={onSignupClick}
                className="w-full rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(231,111,81,0.7)] transition-colors hover:bg-terracotta-dark sm:w-auto"
              >
                Empieza gratis con 10 platos
              </button>
              <button onClick={onLoginClick} className="text-sm font-medium text-olive hover:underline">
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>
          </div>

          {/* Signature element: margin ticket, same visual language as the order ticket */}
          <div className="ticket w-full max-w-sm">
            <div className="ticket-header">
              <span>Carta · Principales</span>
              <span>1 alerta</span>
            </div>
            <div className="ticket-divider" />
            <ul className="ticket-items">
              <li>
                <Check className="h-4 w-4" />
                <span>Risotto de hongos · 76%</span>
              </li>
              <li>
                <Check className="h-4 w-4" />
                <span>Costilla braseada · 50%</span>
              </li>
              <li className="pending">
                <span className="dot" />
                <span>Tartar de atún · 39%</span>
              </li>
            </ul>
            <div className="ticket-footer">
              <span>3 facturas seguidas al alza</span>
              <span>−8%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funciones" className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-3xl font-bold text-ink">
            Vigilancia constante, decisiones puntuales
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={Receipt}
              title="Sube la factura, ya está"
              text="Foto del albarán o reenvío por email. Costea lee cada línea y actualiza el coste de tus ingredientes sin que teclees nada."
            />
            <FeatureCard
              icon={TrendingDown}
              title="Margen real, plato a plato"
              text="Cada receta se recalcula sola cuando cambia el precio de un ingrediente. Ves el margen de toda tu carta en cualquier momento."
            />
            <FeatureCard
              icon={FileBarChart}
              title="Informes que justifican la suscripción"
              text="Evolución de costes, ranking de rentabilidad y cuánto te ha ahorrado detectar a tiempo cada subida de proveedor."
            />
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section id="contacto" className="bg-olive/6 px-4 py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <h2 className="font-display text-3xl font-bold text-ink">
            Tu próxima decisión de carta, con datos detrás
          </h2>
          <p className="text-ink-soft">
            Crea tu cuenta y sube tu primera factura en menos de 2 minutos.
          </p>
          <button
            onClick={onSignupClick}
            className="rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(231,111,81,0.7)] transition-colors hover:bg-terracotta-dark"
          >
            Crear cuenta gratis
          </button>
        </div>
      </section>

      <footer className="px-4 py-8 text-center text-sm text-warm-gray">
        © {new Date().getFullYear()} Costea · Margen claro para restaurantes independientes.
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-warm-gray/20 bg-white p-6 shadow-[0_1px_2px_rgba(59,53,47,0.04)]">
      <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mb-2 font-semibold text-ink">{title}</h3>
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}
