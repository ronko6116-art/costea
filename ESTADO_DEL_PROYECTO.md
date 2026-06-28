# Costea — Estado del Proyecto

> App mobile-friendly de gestión de costes de platos para hostelería (autónomos, bares de barrio).
> Stack: React + Vite + Supabase (PostgreSQL). Sin TypeScript.

---

## ¿Qué está construido (funcionando)?

### Core
- **Autenticación** con Supabase Auth (email + Google)
- **Onboarding**: crear primer restaurante si no existe
- **Dashboard**: lista de platos con tarjetas (nombre, venta, coste, margen)
- **CRUD de platos**: crear, editar, eliminar platos con categoría, precio venta, margen objetivo
- **CRUD de ingredientes**: crear, editar, eliminar ingredientes con nombre, unidad, precio, categoría, proveedor
- **CRUD de proveedores**: crear, editar, eliminar proveedores (nombre, persona contacto, teléfono, email, notas)
- **Recetas**: añadir/eliminar ingredientes a un plato con cantidad y % de merma
- **Vista `vista_coste_platos`**: recálculo automático de coste total y margen al cambiar precios, cantidades o merma

### UX / Navegación
- **Navbar inferior fijo** en todas las pantallas protegidas: Inicio, Alertas, Proveedores, Ingrediente
- **Botón "+ Plato"** en el header del Dashboard
- **Selector de restaurante** con persistencia en localStorage
- **Modal de edición de ingrediente** desde PlatoDetail (tocar ingrediente para editar)
- **Creación inline de categorías y proveedores** desde selects (con opción "+ Crear nuevo")
- **Página de Precios** (hidden route `/precios`): edición inline de precios por categorías colapsables, con formato "6,00 € / Kg"
- **Alertas de margen** computadas localmente desde `vista_coste_platos` (sin tabla alertas en DB)
- **Inline editing** de precio_venta y margen_objetivo en PlatoDetail
- **Precio mínimo sugerido** al editar precio_venta (coste_total / (1 - margen_objetivo/100))

### Varios
- Persistencia de restaurante seleccionado en localStorage
- `replace: true` en navegación post-formulario para evitar historial sucio
- Back buttons en listas navegan a Dashboard con replace
- Animaciones slide-up y fade-in en modales
- `prefers-reduced-motion` respetado

---

## Esquema de Base de Datos (actual)

Tablas: `restaurantes`, `platos`, `ingredientes`, `receta_lineas`, `proveedores`
Vistas: `vista_coste_platos` (JOIN platos + receta_lineas + ingredientes)

Relaciones:
- `restaurantes` 1:N `platos`, `ingredientes`, `proveedores`
- `platos` 1:N `receta_lineas`
- `ingredientes` está referenciado por `receta_lineas.ingrediente_id`
- `proveedores` está referenciado por `ingredientes.proveedor_habitual_id`

### Vista coste_platos (fórmulas)

```
coste_total = SUM(cantidad * (1 + merma_pct/100) * precio_actual)
margen_pct  = (precio_venta - coste_total) / precio_venta * 100
```

---

## Bugs conocidos (ninguno abierto actualmente)

---

## Próximos cambios (acordados)

### Prioridad 1 — Alto impacto
1. **Semáforo en dashboard**: círculo verde (>70%), amarillo (35-70%), rojo (<35%) al lado de cada plato, en vez del badge de alerta genérico
2. **Modo Fácil de Merma**: al añadir ingrediente, 3 botones — [Sin merma] [Media: Verduras/Carnes 20%] [Alta: Pescados/Mariscos 40%]
3. **Calculador de Menú del Día**: seleccionar 1º plato + 2º plato + postre de los existentes; muestra coste total, precio sugerido y ganancia por cliente

### Prioridad 2 — Medio impacto
4. **Clonar recetas**: botón para duplicar un plato con todos sus ingredientes (útil para variaciones: ración/media ración)

### Prioridad 3 — Bajo impacto
5. **Modo oscuro** (CSS variables + toggle) — útil en cocinas con poca luz
6. **Exportar menú a PDF/WhatsApp** — lista limpia con costes para compartir

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

---

## Estructura de archivos clave

```
src/
├── App.jsx                          # Rutas con AppLayout + ProtectedRoute
├── index.css                        # Tema, animaciones, prefers-reduced-motion
├── contexts/
│   ├── AuthContext.jsx               # Auth con Supabase
│   ├── ProtectedRoute.jsx            # Ruta protegida
│   ├── AppLayout.jsx                 # Navbar inferior + wrapper
│   └── PlatoCard.jsx                 # Tarjeta de plato en Dashboard
├── pages/
│   ├── Dashboard/
│   │   ├── Dashboard.jsx             # Home: platos, alertas, selector restaurante
│   │   └── Onboarding.jsx            # Crear primer restaurante
│   ├── Plato/
│   │   ├── PlatoDetail.jsx           # Detalle + inline editing + modal ingredientes
│   │   ├── PlatoForm.jsx             # Crear/editar plato
│   │   └── RecetaManager.jsx         # Añadir/eliminar ingredientes de un plato
│   ├── Ingrediente/
│   │   ├── IngredienteForm.jsx       # Crear/editar ingrediente
│   │   └── IngredienteList.jsx       # Lista de ingredientes
│   ├── Proveedor/
│   │   ├── ProveedorForm.jsx         # Crear/editar proveedor (nombre, contacto, teléfono, email, notas)
│   │   └── ProveedorList.jsx         # Lista con acordeón de productos
│   └── Precios/
│       └── PreciosIngrediente.jsx    # Pizarra de precios por categorías
└── supabase/migrations/
    └── 001_fix_vista_coste_platos.sql
```
