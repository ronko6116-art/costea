-- 013_recetas_base.sql
-- Migración para motor de recetas base

BEGIN;

-- 1. Eliminar dependencias primero
DROP VIEW IF EXISTS vista_coste_platos CASCADE;
DROP POLICY IF EXISTS "owner gestiona recetas de sus platos" ON receta_lineas;
DROP POLICY IF EXISTS "owner gestiona recetas" ON receta_lineas;

-- 2. Crear tabla recetas_base
CREATE TABLE IF NOT EXISTS recetas_base (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    porciones_base integer NOT NULL DEFAULT 1,
    restaurante_id uuid REFERENCES restaurantes(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- 3. Modificar platos
ALTER TABLE platos ADD COLUMN IF NOT EXISTS receta_id uuid REFERENCES recetas_base(id);
ALTER TABLE platos ADD COLUMN IF NOT EXISTS factor_porcion numeric NOT NULL DEFAULT 1.0;

-- 4. Modificar receta_lineas
ALTER TABLE receta_lineas ADD COLUMN IF NOT EXISTS receta_id uuid REFERENCES recetas_base(id);

-- 5. Migrar datos
DO $$
DECLARE
    plato_record RECORD;
    new_receta_id uuid;
BEGIN
    FOR plato_record IN SELECT id, nombre, restaurante_id FROM platos LOOP
        -- Crear receta base por plato
        INSERT INTO recetas_base (nombre, porciones_base, restaurante_id)
        VALUES (plato_record.nombre, 1, plato_record.restaurante_id)
        RETURNING id INTO new_receta_id;

        -- Actualizar plato con nuevo receta_id
        UPDATE platos SET receta_id = new_receta_id WHERE id = plato_record.id;

        -- Actualizar receta_lineas con nuevo receta_id
        UPDATE receta_lineas SET receta_id = new_receta_id WHERE plato_id = plato_record.id;
    END LOOP;
END $$;

-- 6. Hacer receta_id NOT NULL
ALTER TABLE platos ALTER COLUMN receta_id SET NOT NULL;
ALTER TABLE receta_lineas ALTER COLUMN receta_id SET NOT NULL;

-- 7. Eliminar plato_id de receta_lineas
ALTER TABLE receta_lineas DROP COLUMN plato_id;

-- 8. Desactivar RLS en recetas_base
ALTER TABLE recetas_base DISABLE ROW LEVEL SECURITY;

-- 9. Recrear vista vista_coste_platos
CREATE VIEW vista_coste_platos AS
SELECT
  p.id AS plato_id,
  p.nombre AS plato_nombre,
  p.precio_venta,
  COALESCE(SUM(rl.cantidad * (1 + COALESCE(rl.merma_pct, 0) / 100) * i.precio_actual), 0) * p.factor_porcion AS coste_total,
  CASE
    WHEN p.precio_venta > 0
    THEN ROUND(((p.precio_venta - (COALESCE(SUM(rl.cantidad * (1 + COALESCE(rl.merma_pct, 0) / 100) * i.precio_actual), 0) * p.factor_porcion)) / p.precio_venta) * 100, 2)
    ELSE 0
  END AS margen_pct,
  p.margen_objetivo,
  p.categoria,
  p.restaurante_id,
  COALESCE(
    (SELECT bool_or(i2.precio_actual IS NULL OR i2.precio_actual = 0)
     FROM receta_lineas rl2
     JOIN ingredientes i2 ON i2.id = rl2.ingrediente_id
     WHERE rl2.receta_id = p.receta_id),
    FALSE
  ) AS tiene_sin_precio
FROM platos p
LEFT JOIN receta_lineas rl ON rl.receta_id = p.receta_id
LEFT JOIN ingredientes i ON i.id = rl.ingrediente_id
GROUP BY p.id, p.nombre, p.precio_venta, p.margen_objetivo, p.categoria, p.restaurante_id, p.factor_porcion, p.receta_id;

COMMIT;
