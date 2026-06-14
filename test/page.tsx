import type { Metadata } from "next"
import { Quote, UtensilsCrossed } from "lucide-react"

import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Iniciar sesión · Mesa",
}

export default function Page() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Panel visual */}
      <section className="relative hidden overflow-hidden lg:block">
        <img
          src="/images/restaurant-bg.png"
          alt="Interior de restaurante con iluminación cálida al atardecer"
          className="absolute inset-0 size-full object-cover"
        />
        {/* Capas de oscurecimiento para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.03_45_/_0.92)] via-[oklch(0.2_0.03_45_/_0.55)] to-[oklch(0.2_0.03_45_/_0.35)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_oklch(0.6_0.16_42_/_0.25),_transparent_55%)]" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <UtensilsCrossed className="size-5" />
            </span>
            <span className="font-serif text-2xl font-semibold tracking-tight text-white">Mesa</span>
          </div>

          <div className="max-w-md space-y-6">
            <Quote className="size-8 text-accent" />
            <p className="text-balance font-serif text-2xl leading-snug text-white">
              {"Desde que usamos Mesa gestionamos reservas, sala y cocina desde un solo lugar. Hemos ganado una hora cada servicio."}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-accent font-serif text-sm font-bold text-accent-foreground">
                LM
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Lucía Martín</p>
                <p className="text-sm text-white/70">Directora · Grupo Sabores</p>
              </div>
            </div>
          </div>

          <div className="flex gap-8 text-sm text-white/70">
            <div>
              <p className="font-serif text-2xl font-semibold text-white">+2.400</p>
              <p>locales activos</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-semibold text-white">98%</p>
              <p>satisfacción</p>
            </div>
          </div>
        </div>
      </section>

      {/* Panel de formulario */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          {/* Logo móvil */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-5" />
            </span>
            <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">Mesa</span>
          </div>

          <div className="mb-8 space-y-2">
            <h1 className="text-balance font-serif text-3xl font-semibold tracking-tight text-foreground">
              Bienvenido de nuevo
            </h1>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              Accede para gestionar reservas, sala y cocina de tu negocio.
            </p>
          </div>

          <LoginForm />

          <p className="mt-10 text-center text-xs leading-relaxed text-muted-foreground">
            Al continuar aceptas los{" "}
            <a href="#" className="underline underline-offset-4 hover:text-foreground">
              Términos
            </a>{" "}
            y la{" "}
            <a href="#" className="underline underline-offset-4 hover:text-foreground">
              Política de privacidad
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
