# Costea — Gestión de costes de platos para hostelería

App *mobile-friendly* pensada para autónomos y bares de barrio. Calcula el coste real de cada plato del menú a partir de ingredientes, recetas y proveedores, y muestra el margen de cada plato para saber cuáles dan de comer y cuáles están costando dinero.

**Demo:** [supatest-green.vercel.app](https://supatest-green.vercel.app)

## Características

- **Autenticación** con Supabase Auth: email + contraseña y **Google OAuth** (PKCE), con sesión persistente en PWA.
- **Cloudflare Turnstile** (captcha invisible) en todos los formularios de autenticación.
- **CRUD completo** de platos, ingredientes, recetas y proveedores, con categorías, unidades (incluidas docenas) y % de merma.
- **Cálculo automático** del coste total y margen de cada plato mediante una vista SQL (`vista_coste_platos`).
- **Histórico de precios**: trigger SQL que registra cada cambio de precio de ingrediente, con gráficas de evolución (recharts) y alertas de variación en los últimos 30 días.
- **Alertas de margen** con semáforo (verde / amarillo / rojo) y precio mínimo sugerido.
- **PWA instalable**: manifest + service worker, instalable en móvil desde pantalla de inicio, con sesión persistente.
- **Row Level Security (RLS)** en todas las tablas: cada restaurante solo accede a sus propios datos, incluso llamando directamente a la API REST.

## Stack

- React 19 + Vite 8 (sin TypeScript)
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth + RLS)
- recharts (gráficas)
- Cloudflare Turnstile
- Deploy en Vercel (SPA + serverless)

## Estructura

```
├── public/          # Iconos PWA, favicon, imágenes
├── src/
│   ├── components/  # Componentes UI (navbars, modales, gráficas...)
│   ├── contexts/    # AuthContext, AppLayout, ProtectedRoute, LoginModal
│   ├── pages/       # Auth, Home, Dashboard, Plato, Ingrediente, Recetas, Proveedor, Precios, Graficos
│   ├── hooks/       # usePlatoDetail
│   ├── helpers/     # precios.js (dedup + mapeo), platoFilters, platoSave, ingredienteSave
│   ├── utils/       # categorías centralizadas
│   └── supabaseClient.js
├── supabase/
│   └── migrations/  # Migraciones SQL aplicadas
├── vercel.json      # Rewrites SPA + API
└── vite.config.js   # Vite + React + PWA plugin
```

## Desarrollo local

1. Clona el repositorio.
2. `npm install`.
3. Crea un `.env` con las variables de Supabase (URL + anon key) y la site key de Turnstile.
4. `npm run dev`.

Scripts disponibles: `dev`, `build`, `lint` (ESLint + regla de complejidad max 10), `test` (Vitest), `preview`, `knip`.

## Estado del proyecto

El detalle completo (funcionalidad implementada, esquema de base de datos, migraciones SQL, bugs conocidos y próximos cambios) está documentado en [ESTADO_DEL_PROYECTO.md](ESTADO_DEL_PROYECTO.md).
