# Costea — Estado del Proyecto

> App mobile-friendly de gestión de costes de platos para hostelería (autónomos, bares de barrio).
> Stack: React 19 + Vite 8 + Supabase (PostgreSQL). Sin TypeScript. Tailwind CSS v4.
> Deploy: Vercel (SPA + Serverless Functions).
> PWA: Instalable en móvil con manifest + service worker. Sesión persistente.

---

## ¿Qué está construido (funcionando)?

### Core
- **Autenticación** con Supabase Auth (email + Google OAuth + PKCE + persistencia PWA)
- **Onboarding**: crear primer restaurante si no existe
- **Dashboard**: lista de platos con tarjetas (nombre, venta, coste, margen)
- **CRUD de platos**: crear, editar, eliminar platos con categoría, precio venta, margen objetivo
- **CRUD de ingredientes**: crear, editar, eliminar ingredientes con nombre, unidad, precio, categoría, proveedor, fecha de compra
- **CRUD de proveedores**: crear, editar, eliminar proveedores (nombre, persona contacto, teléfono, email, notas)
- **Recetas**: añadir/eliminar ingredientes a un plato con cantidad y % de merma
- **Acordeón de recetas** en RecetasBase: recetas colapsadas por defecto, se expanden al hacer click; auto-expand desde PlatoDetail
- **Cantidad de ingredientes en unidades** para ingredientes medidos por docenas (6 = 6 huevos, no 6 docenas)
- **Vista `vista_coste_platos`**: recálculo automático de coste total y margen al cambiar precios, cantidades o merma
- **RLS activado en todas las tablas**: políticas `owner_id = auth.uid()` que impiden acceso a datos de otros restaurantes aunque se consulte directamente la API REST

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
- **AuthCallback**: manejador de callback OAuth y recovery (con polling robusto + manejo de errores)
- **Persistencia PWA**: sesión mantenida al abrir desde pantalla de inicio (gracias a manifest + SW)

### UX / Navegación
- **Navbar inferior fijo** en todas las pantallas protegidas: Inicio, Proveedores, Gráficos, Ingredientes
- **Botón "+ Plato"** en el header del Dashboard
- **Selector de restaurante** con persistencia en localStorage
- **Modal de edición de ingrediente** desde PlatoDetail (tocar ingrediente para editar)
- **Creación inline de categorías y proveedores** desde selects (con opción "+ Crear nuevo")
- **Creación inline de ingredientes en RecetaManager** con nombre, unidad, categoría y **precio de compra**
- **Selector de ingredientes estilizado** en recetas: lista con buscador, nombre del proveedor y precio por unidad
- **Modal de tipo de compra** al cambiar fecha: permite elegir entre "Compra actual" (actualiza precio) o "Compra pasada" (solo histórico)
- **Página de Precios** (`/precios`): edición inline de precios por categorías colapsables, con formato "6,00 € / Kg"
- **Alertas de margen** computadas localmente desde `vista_coste_platos` (sin tabla alertas en DB)
- **Inline editing** de precio_venta y margen_objetivo en PlatoDetail
- **Precio mínimo sugerido** al editar precio_venta (coste_total / (1 - margen_objetivo/100))
- **Semáforo en dashboard** (verde >70%, amarillo 35-70%, rojo <35%)
- **Modo Fácil de Merma** en RecetaManager (botones: Sin merma, Media 20%, Alta 40%)

### Gráficos e histórico
- **Trigger automático**: al actualizar `precio_actual` en ingredientes, se guarda el precio + fecha en `precios_historicos` vía trigger SQL (columnas: `precio`, `fecha`, `precio_anterior`, `precio_nuevo`). Trigger usa `CURRENT_DATE` para la fecha (no `NEW.fecha_compra`)
- **Gráfica de evolución por ingrediente** (`PrecioEvolucion.jsx`): botón 📈 en `IngredienteList.jsx` y pestaña "Evolución" en el modal de `PlatoDetail.jsx` — LineChart con recharts (precio vs fecha). Datos deduplicados por `(fecha, proveedor_id)` vía helpers compartidos
- **Alertas de precio en Dashboard** (`AlertasPrecio.jsx`): muestra ingredientes con mayor variación de precio en los últimos 30 días, con indicador de subida/bajada/estable. Datos deduplicados por `(ingrediente_id, fecha, proveedor_id)`

### PWA (Progressive Web App)
- **Manifest**: nombre "Costea - Gestión de Costes", `display: standalone`, iconos en 144/192/512px (SVG con logo € terracota)
- **Service Worker**: precarga de app shell + cacheo de API Supabase (NetworkFirst)
- **Meta tags**: theme-color, apple-mobile-web-app-capable, viewport-fit=cover, apple-touch-icon
- **Instalable**: el navegador muestra banner de instalar; la sesión persiste al abrir desde pantalla de inicio

### Varios
- Persistencia de restaurante seleccionado en localStorage
- `replace: true` en navegación post-formulario para evitar historial sucio
- Back buttons en listas navegan a Dashboard con replace
- Animaciones slide-up y fade-in en modales
- `prefers-reduced-motion` respetado
- Tema de colores personalizado: terracotta, olive, cream, warm-gray, ink
- Componente `ticket` visual estilo tíquet de compra (hero + PlatoDetail)
- **ErrorBoundary** global en App.jsx (fallback UI diferenciada en dev/prod)

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

| Migración | Descripción | Estado |
|-----------|-------------|--------|
| `001_fix_vista_coste_platos.sql` | Recrea vista con cálculo correcto (cantidad * merma * precio) | ✅ Aplicada |
| `002_merge_categorias.sql` | Merge categorías | ✅ Aplicada |
| `003_precios_proveedor.sql` | Crea tabla `precios_proveedor` | ✅ Aplicada |
| `004_add_tiene_sin_precio.sql` | Añade flag `tiene_sin_precio` a vista | ✅ Aplicada |
| `005_rls_precios_proveedor.sql` | ~~Activa RLS en `precios_proveedor`~~ | ❌ **Descartada** — ver RLS |
| `006_permisos_precios_proveedor.sql` | Desactiva RLS y da permisos totales a anon/authenticated | ✅ **Vigente** |
| `007_precios_historicos.sql` | Añade columnas `precio_anterior`, `precio_nuevo`, `restaurante_id`, `creado_en` + trigger | ✅ Aplicada |
| `008_fix_ingrediente_id_type.sql` | Cambia `ingrediente_id` de BIGINT a uuid + recrea trigger | ✅ Aplicada |
| `009_rls_precios_historicos.sql` | Desactiva RLS y otorga permisos a anon/authenticated en `precios_historicos` | ✅ Aplicada |
| `010_fix_trigger_defaults.sql` | Añade defaults a `id` (uuid gen_random), `fecha`, `precio`; recrea trigger | ✅ Aplicada |
| `011_fix_trigger.sql` | (desconocido) | ✅ Aplicada |
| `012_ventas_diarias.sql` | Crea tabla ventas_diarias | ✅ Aplicada |
| `013_recetas_base.sql` | Crea tabla recetas_base | ✅ Aplicada |
| `014_vista_receta_id.sql` | Actualiza vista_coste_platos | ✅ Aplicada |
| `015_permisos_recetas_base.sql` | Permisos en recetas_base | ✅ Aplicada |
| `016_rls_receta_lineas.sql` | Permisos en receta_lineas | ✅ Aplicada |
| `017_vista_porciones_base.sql` | Actualiza vista con porciones_base | ✅ Aplicada |
| `018_trigger_insert_ingredientes.sql` | Trigger dispara en INSERT+UPDATE de precio_actual; backfill de históricos; grant SELECT ingredientes | ✅ Aplicada vía API |
| `019_add_fecha_compra.sql` | Añade columna `fecha_compra DATE` a ingredientes | ✅ Aplicada vía API |
| `020_enable_rls_all_tables.sql` | Activa RLS en todas las tablas restantes (precios_historicos, precios_proveedor, receta_lineas, recetas_base, ventas_diarias). Políticas consistentes: `restaurante_id IN (SELECT id FROM restaurantes WHERE owner_id = auth.uid())`. Trigger SECURITY DEFINER para bypass de RLS. Revoca permisos excesivos de anon. | ✅ Aplicada vía API |
| `021_fix_vista_costes_docena.sql` | Añade factor `1/12` a `vista_coste_platos` cuando `unidad_medida = 'docena'`, para que cantidad en unidades se convierta correctamente a docenas en el cálculo de coste total y margen. | ✅ Aplicada vía API |
| `999_mock_historicos.sql` | Genera datos mock de histórico de precios para pruebas | ⚠️ Sólo tests |

---



## Bugs conocidos / Issues

### Altos
- *(ninguno)*

### Medios
- **Precios en 3 sitios**: `ingredientes.precio_actual` + `precios_proveedor` + `precios_historicos` — posible deriva si algún code path no actualiza todos.
- **precios_historicos.proveedor_id**: columna existente pero el frontend aún no la usa consistentemente en todos los queries de gráficos.

### Bajos
- **Restaurante en localStorage**: funciona para una pestaña, pero podría quedar referencia huérfana si se borra el restaurante en otra pestaña.
- **Mock histórico de precios**: `999_mock_historicos.sql` inserta datos de prueba. Si se ejecuta en producción, podría contaminar datos reales.
- **set-state-in-effect en varios componentes**: error ESLint presente en `AuthContext`, `ComparativaProveedores`, `PlatoForm`, `RecetasBase`, `Graficos` y otros (pre-existing, no crítico para funcionalidad).
- **SonarCloud desactivado**: reemplazado por knip + ESLint complexity rule (más ligeros).

---

## Bugs resueltos (sprint actual)

| Bug | Solución |
|-----|----------|
| **Tooltip gráfico siempre muestra 18€ (mismo precio en todos los puntos)** | Root cause: migración 024 cambió trigger a `NEW.fecha_compra` como `fecha`, aplanando todos los registros en una misma fecha. Migración 025 revierte a `CURRENT_DATE` + backfill |
| **Precios repetidos en gráfica (misma fecha + mismo proveedor)** | Migración 026 añade `proveedor_id` a `precios_historicos`. Helper `deduplicarPorFecha` en `src/helpers/precios.js` elimina duplicados de `(fecha, proveedor_id)` conservando el más reciente |
| **Precios mezclados de diferentes proveedores en misma fecha** | `fechaKey(fecha, proveedorId)` permite agrupar por fecha+proveedor. `AlertasPrecio` desduplica por `(ingrediente_id, fecha, proveedor_id)` |
| **Dashboard complejidad 37 / PlatoDetail 33 / doSave 23** | Refactor: extracción de hooks, helpers y componentes. Todas las funciones target ahora < 10 de complejidad ciclomática |
| **Código muerto: ErrorBoundary, RecetaManager, api/health, check-email** | Eliminados tras detección con knip |
| **SonarCloud análisis lento (+6 min, requiere JRE)** | Reemplazado por knip (análisis local < 1s) + ESLint complexity rule |

## Bugs resueltos (sprint anterior)

| Bug | Solución |
|-----|----------|
| **Datos de otros usuarios visibles en Gráficos/Precios** | Añadido filtro `.eq('restaurante_id', ...)` en todos los queries (AlertasPrecio, PreciosIngrediente, ProveedorList, IngredienteList, PrecioEvolucion) |
| **"Desconocido" en alertas de precio** | El fallback `|| 'Desconocido'` ya no se alcanza porque los queries están correctamente filtrados por restaurante |
| **App se queda en "Cargando..." al abrir desde pantalla de inicio** | AuthContext: añadido `.catch()` en `getSession()`, timeout 8s, limpieza de localStorage corrupto, y estado `error` con botones Reintentar/Ir al login |
| **Login no completaba (AuthCallback polling sin error handling)** | Añadido `try/catch` en el polling de `checkSession()` y contador de intentos incluso con error |
| **Servicio de mock no filtrando por usuario** | Migración 999_mock_historicos respeta `restaurante_id` en cada inserción, y los queries frontend ya filtran correctamente |
| **Ingredientes sin histórico en gráfica de evolución** | Trigger recreado para disparar también en INSERT (018), backfill de registros históricos |
| **Botón '+ Receta' en PlatoDetail iba a editor antiguo** | Redirigido a RecetasBase con auto-expand del acordeón; ruta `/recetas/:id/ingredientes` eliminada |
| **Cantidad de ingredientes en docenas confusa** | Ahora la cantidad se interpreta en unidades (no docenas); coste dividido por 12; display muestra "uds" |
| **Selector de ingredientes nativo (feo)** | Reemplazado por lista estilizada con buscador, nombre del proveedor y precio por unidad |
| **Ingredientes sin campo fecha de compra** | Migración 019 añade `fecha_compra DATE`; formulario incluye input tipo date |
| **Al cambiar fecha de compra, sin distinción entre compra actual o pasada** | Modal que pregunta al usuario: "Compra actual" (actualiza precio) o "Compra pasada" (solo histórico) |
| **RLS desactivado en precios_historicos, precios_proveedor, receta_lineas, recetas_base, ventas_diarias** | Migración 020 activa RLS con políticas owner-based en todas las tablas; trigger function marcada SECURITY DEFINER para insertar en histórico sin fricción; permisos de anon revocados en tablas sensibles |
| **vista_coste_platos no consideraba docenas** | Migración 021 añade factor 1/12 en el SQL de la vista cuando unidad_medida = 'docena'. El Dashboard y el coste total de PlatoDetail ahora calculan correctamente |

---

## Próximos cambios (acordados)

### Prioridad 1 — Alto impacto
1. **Calculador de Menú del Día**: seleccionar 1º plato + 2º plato + postre de los existentes; muestra coste total, precio sugerido y ganancia por cliente

### Prioridad 2 — Medio impacto
2. **Clonar recetas**: botón para duplicar un plato con todos sus ingredientes (útil para variaciones: ración/media ración)
3. **Filtrar proveedores por restaurante en IngredienteForm**: actualmente fetchan todos sin filtrar
4. **Mover 999_mock_historicos.sql fuera de migrations/**: añadir guarda de entorno o mover a carpeta de tests
5. **Tests de componentes con @testing-library/react**: extender cobertura más allá de helpers

### Prioridad 3 — Bajo impacto
6. **Modo oscuro** (CSS variables + toggle) — útil en cocinas con poca luz
7. **Exportar menú a PDF/WhatsApp** — lista limpia con costes para compartir
8. **Reemplazar hack Recuperar.jsx** — usar edge function con admin API en lugar del login con password falsa

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
| **RLS activado en todas las tablas (migración 020)** | El control desde el frontend (`.eq('restaurante_id', ...)`) es insuficiente: cualquiera con DevTools puede llamar directamente a la API REST usando la anon key pública. RLS es la única barrera real a nivel BD. Trigger guardar_precios_historico marcado SECURITY DEFINER para que pueda insertar en precios_historicos sin pasar por RLS del usuario. |
| **Categorías centralizadas en `src/utils/categorias.js`** | Elimina duplicación de la lista en 3 componentes. Fácil de mantener y extender |
| **ErrorBoundary global** | Captura errores inesperados de React sin colapsar la app. UI diferenciada para desarrollo (detalles técnicos) y producción (mensaje amigable) |
| **PWA con service worker** | Permite instalar la app en móvil, sesión persistente al abrir desde pantalla de inicio, carga más rápida gracias al precaching |
| **AuthContext robusto (catch + timeout + retry)** | Evita que la app se quede en "Cargando..." si `localStorage` falla (comportamiento conocido en iOS PWA standalone) |
| **knip > SonarCloud** | knip detecta código/dependencias/exports muertos en < 1s sin JRE ni servicios externos. SonarCloud necesitaba JRE + 6 min de análisis + token |
| **ESLint complexity rule (max 10)** | Previene funciones demasiado largas/complejas. Refactorización obligada si una función supera el límite |
| **Deduplicación de precios por (fecha, proveedor_id)** | `deduplicarPorFecha` con callback `getKey` permite que cada componente defina su criterio de agrupación. `PrecioEvolucion` agrupa por `(fecha, proveedor_id)`, `AlertasPrecio` por `(ingrediente_id, fecha, proveedor_id)` |
| **Helpers compartidos para dedup en `src/helpers/precios.js`** | `fechaKey`, `deduplicarPorFecha` y `mapearPuntos` extraídos a módulo común con 15 tests unitarios (vitest). Elimina duplicación de lógica entre componentes |

---

## Estructura de archivos clave

```
├── public/
│   ├── favicon.svg                   # Logo Costea (€ terracota)
│   ├── icons.svg
│   ├── icons/
│   │   ├── icon-144.svg              # Icono PWA 144px
│   │   ├── icon-192.svg              # Icono PWA 192px
│   │   └── icon-512.svg              # Icono PWA 512px
│   └── images/restaurant-bg.png
├── src/
│   ├── main.jsx                      # Entry: StrictMode + BrowserRouter
│   ├── App.jsx                       # Rutas + ErrorBoundary + error UI sesión
│   ├── index.css                     # Tailwind v4 + tema personalizado + componentes
│   ├── supabaseClient.js             # Cliente Supabase con PKCE + persistSession
│   ├── utils/
│   │   └── categorias.js             # CATEGORIAS + ORDEN_CATEGORIAS (compartido)
│   ├── components/
│   │   ├── AlertasBanner.jsx         # Banner de alertas de margen en Dashboard
│   │   ├── AlertasPrecio.jsx         # Widget alertas de precio Dashboard
│   │   ├── BarraFiltros.jsx          # Barra de filtros del Dashboard
│   │   ├── CategoriaDropdown.jsx     # Menú desplegable de categorías
│   │   ├── InfoPlato.jsx             # Resumen del plato + inline editing precios
│   │   ├── ListaIngredientes.jsx     # Desglose de ingredientes con costes
│   │   ├── MargenObjetivoSection.jsx # Edición inline de margen objetivo
│   │   ├── Navbar.jsx                # Navbar público (landing)
│   │   ├── PlatoListContent.jsx      # Lista platos con estado carga/vacío/lista
│   │   ├── PrecioEvolucion.jsx       # Gráfica evolución precio (recharts)
│   │   └── SelectorRestaurante.jsx   # Selector de restaurante + crear nuevo
│   ├── contexts/
│   │   ├── AuthContext.jsx           # Auth robusto: catch, timeout, retry, limpieza
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
│   │   │   └── AuthCallback.jsx      # Callback OAuth + recovery (polling robusto)
│   │   ├── Home/
│   │   │   ├── Home.jsx              # Landing page wrapper
│   │   │   └── Demo.jsx              # Hero + features + CTA
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx         # Home: platos, alertas, selector restaurante
│   │   │   └── Onboarding.jsx        # Crear primer restaurante
│   │   ├── Plato/
│   │   │   ├── PlatoDetail.jsx       # Detalle + inline editing + acordeón recetas
│   │   │   └── PlatoForm.jsx         # Crear/editar plato (con factor docena)
│   │   ├── Ingrediente/
│   │   │   ├── IngredienteForm.jsx   # Crear/editar ingrediente con fecha_compra + modal tipo compra
│   │   │   └── IngredienteList.jsx   # Lista con búsqueda, categorías y fecha de compra
│   │   ├── Recetas/
│   │   │   └── RecetasBase.jsx       # Acordeón de recetas + selector estilizado de ingredientes
│   │   ├── Proveedor/
│   │   │   ├── ProveedorForm.jsx     # Crear/editar proveedor
│   │   │   └── ProveedorList.jsx     # Lista con acordeón de productos
│   │   ├── Precios/
│   │   │   └── PreciosIngrediente.jsx # Pizarra de precios por categorías
│   │   └── Graficos/
│   │       └── Graficos.jsx          # Página de gráficos con AlertasPrecio
│   ├── hooks/
│   │   └── usePlatoDetail.js      # Hook de fetching para PlatoDetail
│   ├── helpers/
│   │   ├── precios.js             # Dedup helpers + mapeo de puntos (fechaKey, deduplicarPorFecha, mapearPuntos)
│   │   ├── precios.test.js        # 15 tests unitarios (vitest)
│   │   ├── platoFilters.js        # Filtros, categorías y alertas extraídos de Dashboard
│   │   ├── platoSave.js           # Guardado de campos + cálculos derivados de plato
│   │   └── ingredienteSave.js     # Guardado de ingredientes (proveedor, compra, histórico)
│   └── assets/
├── supabase/
│   └── migrations/
│       ├── 001_fix_vista_coste_platos.sql
│       ├── 017_vista_porciones_base.sql
│       ├── 018_trigger_insert_ingredientes.sql  # Trigger INSERT+UPDATE + backfill
│       ├── 019_add_fecha_compra.sql             # Columna fecha_compra en ingredientes
│       ├── 020_enable_rls_all_tables.sql        # RLS en todas las tablas + trigger SECURITY DEFINER
│       ├── 021_fix_vista_costes_docena.sql     # Factor docena en vista_coste_platos
│       ├── 025_fix_trigger_fecha.sql            # Trigger usa CURRENT_DATE en vez de NEW.fecha_compra + backfill
│       └── 026_add_proveedor_precios_historicos.sql  # Columna proveedor_id en precios_historicos + backfill
├── index.html                       # Meta tags PWA + apple-touch-icon
├── .env                             # Variables públicas (Supabase, Turnstile)
├── .env.local                       # Desarrollo local (no versionado)
├── .env.production                  # Producción Vercel
├── vercel.json                      # Rewrites SPA + API
├── vite.config.js                   # Vite + React + babel + PWA plugin + vitest coverage (v8, lcov)
├── postcss.config.cjs
├── eslint.config.js                 # ESLint flat config + complexity rule (max 10)
├── knip.json                        # knip: detecta código/dependencias/exports muertos
└── package.json
```
