# Costea — Estado del Proyecto

> App mobile-friendly de gestión de costes de platos para hostelería (autónomos, bares de barrio).
> Stack: React 19 + Vite 8 + Supabase (PostgreSQL). Sin TypeScript. Tailwind CSS v4.
> Deploy: Vercel (SPA + Serverless Functions).

---

## ¿Qué está construido (funcionando)?

### Core
- **Autenticación** con Supabase Auth (email + Google OAuth + PKCE)
- **Onboarding**: crear primer restaurante si no existe
- **Dashboard**: lista de platos con tarjetas (nombre, venta, coste, margen)
- **CRUD de platos**: crear, editar, eliminar platos con categoría, precio venta, margen objetivo
- **CRUD de ingredientes**: crear, editar, eliminar ingredientes con nombre, unidad, precio, categoría, proveedor
- **CRUD de proveedores**: crear, editar, eliminar proveedores (nombre, persona contacto, teléfono, email, notas)
- **Recetas**: añadir/eliminar ingredientes a un plato con cantidad y % de merma
- **Vista `vista_coste_platos`**: recálculo automático de coste total y margen al cambiar precios, cantidades o merma

### Páginas públicas (Landing)
- **Home** con navbar público (Costea logo, Funciones, Contacto, Login/Signup)
- **Demo/Hero** con "Descubre qué plato te da de comer y cuál te está costando dinero"
- **Modal de login** desde landing (LoginModal con overlay, scroll lock, Escape dismiss)
- **Turnstile captcha** en todos los formularios de auth

### Autenticación
- **Login**: email+password, Google OAuth, enlace a registro y recuperación
- **Signup**: registro con email, password, confirmar password
- **Recuperar contraseña**: email + detección de cuenta existente (hack con login falso)
- **ChangePassword**: actualizar contraseña desde enlace de recovery
- **AuthCallback**: manejador de callback OAuth y recovery

### UX / Navegación
- **Navbar inferior fijo** en todas las pantallas protegidas: Inicio, Proveedores, Ingrediente
- **Botón "+ Plato"** en el header del Dashboard
- **Selector de restaurante** con persistencia en localStorage
- **Modal de edición de ingrediente** desde PlatoDetail (tocar ingrediente para editar)
- **Creación inline de categorías y proveedores** desde selects (con opción "+ Crear nuevo")
- **Página de Precios** (`/precios`): edición inline de precios por categorías colapsables, con formato "6,00 € / Kg"
- **Alertas de margen** computadas localmente desde `vista_coste_platos` (sin tabla alertas en DB)
- **Inline editing** de precio_venta y margen_objetivo en PlatoDetail
- **Precio mínimo sugerido** al editar precio_venta (coste_total / (1 - margen_objetivo/100))

### Gráficos e histórico
- **Trigger automático**: al actualizar `precio_actual` en ingredientes, se guarda el precio + fecha en `precios_historicos` vía trigger SQL (columnas: `precio`, `fecha`, `precio_anterior`, `precio_nuevo`)
- **Gráfica de evolución por ingrediente** (`PrecioEvolucion.jsx`): botón 📈 en `IngredienteList.jsx` y pestaña "Evolución" en el modal de `PlatoDetail.jsx` — LineChart con recharts (precio vs fecha)
- **Alertas de precio en Dashboard** (`AlertasPrecio.jsx`): muestra ingredientes con mayor variación de precio en los últimos 30 días, con indicador de subida/bajada/estable

### Varios
- Persistencia de restaurante seleccionado en localStorage
- `replace: true` en navegación post-formulario para evitar historial sucio
- Back buttons en listas navegan a Dashboard con replace
- Animaciones slide-up y fade-in en modales
- `prefers-reduced-motion` respetado
- Tema de colores personalizado: terracotta, olive, cream, warm-gray, ink
- Componente `ticket` visual estilo tíquet de compra (hero + PlatoDetail)

---

## Esquema de Base de Datos (actual)

### Tablas principales
`restaurantes`, `platos`, `ingredientes`, `receta_lineas`, `proveedores`, `precios_proveedor`, `precios_historicos`

### Vistas
`vista_coste_platos` (JOIN platos + receta_lineas + ingredientes)

### Relaciones
- `restaurantes` 1:N `platos`, `ingredientes`, `proveedores`
- `platos` 1:N `receta_lineas`
- `ingredientes` está referenciado por `receta_lineas.ingrediente_id` y `precios_proveedor.ingrediente_id`
- `proveedores` está referenciado por `ingredientes.proveedor_habitual_id` y `precios_proveedor.proveedor_id`
- `precios_proveedor` guarda precios por ingrediente+proveedor (UNIQUE compuesto)
- `precios_historicos` guarda histórico de cambios de precio (para futuras gráficas de evolución)

### Vista coste_platos (fórmulas)

```
coste_total = SUM(cantidad * (1 + merma_pct/100) * precio_actual)
margen_pct  = (precio_venta - coste_total) / precio_venta * 100
```

---

## Migraciones SQL

| Migración | Descripción |
|-----------|-------------|
| `001_fix_vista_coste_platos.sql` | Recrea vista con cálculo correcto (cantidad * merma * precio) |
| `002_merge_categorias.sql` | Merge categorías: Verduras → Frutas y Verduras, Legumbres/Cereales → Legumbres y cereales, Huevos → Despensa |
| `003_precios_proveedor.sql` | Crea tabla `precios_proveedor`, migra datos desde `ingredientes` |
| `004_add_tiene_sin_precio.sql` | Añade flag `tiene_sin_precio` a vista para ingredientes sin precio |
| `005_rls_precios_proveedor.sql` | Activa RLS en `precios_proveedor` con políticas por restaurante |
| `006_permisos_precios_proveedor.sql` | Desactiva RLS y da permisos totales a anon/authenticated (revierte 005) |
| `007_precios_historicos.sql` | Añade columnas `precio_anterior`, `precio_nuevo`, `restaurante_id`, `creado_en` a tabla existente + trigger |
| `008_fix_ingrediente_id_type.sql` | Cambia `ingrediente_id` de BIGINT a uuid + recrea trigger + elimina RLS policy huérfana |
| `009_rls_precios_historicos.sql` | Desactiva RLS y otorga permisos a anon/authenticated en `precios_historicos` |
| `010_fix_trigger_defaults.sql` | Añade defaults a `id` (uuid gen_random), `fecha`, `precio`; recrea trigger con todas las columnas obligatorias |

---

## API endpoint (Vercel Serverless)

| Endpoint | Descripción |
|----------|-------------|
| `api/health.js` | Health check (versión Node) |

---

## Supabase Edge Functions

| Función | Estado |
|---------|--------|
| `check-email` | **Completamente comentada** (`/* */`). Verificaba existencia de email vía admin API. Nunca se usó desde el frontend. |

---

## Bugs conocidos / Issues

### Altos
- **Conflicto entre migraciones 005 y 006**: 005 activa RLS con políticas, 006 lo desactiva inmediatamente con GRANTs totales. Hay que decidir cuál es la correcta.

### Medios
- **Categorías duplicadas**: el array `CATEGORIAS` está hardcodeado en `IngredienteForm.jsx`, `PreciosIngrediente.jsx` y `RecetaManager.jsx`. Debería ser una constante compartida.
- **Precios en 3 sitios**: `ingredientes.precio_actual` + `precios_proveedor` + `precios_historicos` — posible deriva si algún code path no actualiza todos.
- **Sin Error Boundaries**: toda la app carece de manejo de errores de React (error boundaries).
- **Directorios vacíos**: `src/hooks/`, `src/functions/formatters/`, `src/assets/` existen pero no tienen contenido.

### Bajos
- **Suppliers y categorías globales**: en `PlatoDetail.jsx` se fetchan todos los proveedores y categorías (no filtrados por restaurante).
- **Restaurante en localStorage**: funciona para una pestaña, pero podría quedar referencia huérfana si se borra el restaurante en otra pestaña.
- **check-email edge function muerta**: no se referencia desde el frontend; `Recuperar.jsx` usa un hack propio (login con fake password) para detectar cuentas.

---

## Próximos cambios (acordados)

### Prioridad 1 — Alto impacto
1. **Semáforo en dashboard**: círculo verde (>70%), amarillo (35-70%), rojo (<35%) al lado de cada plato, en vez del badge de alerta genérico
2. **Modo Fácil de Merma**: al añadir ingrediente, 3 botones — [Sin merma] [Media: Verduras/Carnes 20%] [Alta: Pescados/Mariscos 40%]
3. **Calculador de Menú del Día**: seleccionar 1º plato + 2º plato + postre de los existentes; muestra coste total, precio sugerido y ganancia por cliente

### Prioridad 2 — Medio impacto
4. **Clonar recetas**: botón para duplicar un plato con todos sus ingredientes (útil para variaciones: ración/media ración)
5. **Resolver conflicto RLS**: decidir entre migración 005 o 006 y limpiar
6. **Constante compartida de categorías**: extraer `CATEGORIAS` a un archivo común
### Prioridad 3 — Bajo impacto
7. **Modo oscuro** (CSS variables + toggle) — útil en cocinas con poca luz
8. **Exportar menú a PDF/WhatsApp** — lista limpia con costes para compartir
9. **Error Boundaries** — añadir manejo de errores en React
10. **Llenar directorios vacíos** — hooks, formatters, assets

---

## Decisiones técnicas importantes

| Decisión | Por qué |
|----------|---------|
| Sin TypeScript | Público no técnico, minimizar fricción de desarrollo |
| Inline editing > modals (para 1 campo) | Menos pasos = mejor UX para no iniciados |
| Alertas computadas client-side | Evita RLS, datos siempre frescos, alertas desaparecen al instante |
| Navbar inferior en todas las páginas | El usuario siempre puede volver a Inicio en 1 tap |
| Sin `es_volatil` en ingredientes | La pizarra de precios ya muestra todos |
| Restaurante separado del usuario | Un usuario puede tener varios locales |
| Histórico vía trigger SQL (no frontend) | Garantiza que ningún cambio de precio quede sin registrar |
| recharts para gráficas | Reactivo, declarativo, sin TypeScript, componentes simples |


---

## Estructura de archivos clave

```
├── api/
│   └── health.js                     # Health check
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── images/restaurant-bg.png
├── src/
│   ├── main.jsx                      # Entry: StrictMode + BrowserRouter
│   ├── App.jsx                       # Rutas (auth, protegidas, layouts)
│   ├── index.css                     # Tailwind v4 + tema personalizado + componentes
│   ├── supabaseClient.js             # Cliente Supabase con PKCE
│   ├── components/
│   │   ├── Navbar.jsx                # Navbar público (landing)
│   │   ├── PrecioEvolucion.jsx       # Gráfica de evolución de precio por ingrediente (recharts)
│   │   └── AlertasPrecio.jsx         # Widget de alertas de precio para Dashboard
│   ├── contexts/
│   │   ├── AuthContext.jsx           # Auth con Supabase (session, signOut)
│   │   ├── AppLayout.jsx             # Navbar inferior + wrapper
│   │   ├── LoginModal.jsx            # Modal login desde landing
│   │   ├── PlatoCard.jsx             # Tarjeta de plato en Dashboard
│   │   └── ProtectedRoute.jsx        # Ruta protegida
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.jsx             # Login (email + Google + Turnstile)
│   │   │   ├── Signup.jsx            # Registro
│   │   │   ├── Recuperar.jsx         # Recuperar contraseña
│   │   │   ├── ChangePassword.jsx    # Cambiar contraseña (recovery link)
│   │   │   └── AuthCallback.jsx      # Callback OAuth + recovery
│   │   ├── Home/
│   │   │   ├── Home.jsx              # Landing page wrapper
│   │   │   └── Demo.jsx              # Hero + features + CTA
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx         # Home: platos, alertas, selector restaurante
│   │   │   └── Onboarding.jsx        # Crear primer restaurante
│   │   ├── Plato/
│   │   │   ├── PlatoDetail.jsx       # Detalle + inline editing + modal ingredientes
│   │   │   ├── PlatoForm.jsx         # Crear/editar plato
│   │   │   └── RecetaManager.jsx     # Añadir/eliminar ingredientes de un plato
│   │   ├── Ingrediente/
│   │   │   ├── IngredienteForm.jsx   # Crear/editar ingrediente
│   │   │   └── IngredienteList.jsx   # Lista de ingredientes con búsqueda y categorías
│   │   ├── Proveedor/
│   │   │   ├── ProveedorForm.jsx     # Crear/editar proveedor
│   │   │   └── ProveedorList.jsx     # Lista con acordeón de productos
│   │   ├── Precios/
│   │   │   └── PreciosIngrediente.jsx # Pizarra de precios por categorías
│   ├── hooks/                        # (vacío)
│   ├── functions/formatters/         # (vacío)
│   └── assets/                       # (vacío)
├── supabase/
│   ├── functions/check-email/index.ts # Edge Function (comentada)
│   └── migrations/
│       ├── 001_fix_vista_coste_platos.sql
│       ├── 002_merge_categorias.sql
│       ├── 003_precios_proveedor.sql
│       ├── 004_add_tiene_sin_precio.sql
│       ├── 005_rls_precios_proveedor.sql
│       ├── 006_permisos_precios_proveedor.sql
│       └── 007_precios_historicos.sql
├── .env                              # Variables públicas (Supabase, Turnstile)
├── .env.local                        # Desarrollo local (no versionado)
├── .env.production                   # Producción Vercel
├── vercel.json                       # Rewrites SPA + API
├── vite.config.js                    # Vite config + proxy API
├── postcss.config.cjs
├── eslint.config.js
└── package.json
```
