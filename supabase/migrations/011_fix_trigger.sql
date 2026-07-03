-- 011_fix_trigger.sql
-- Recrea el trigger con columnas que existen realmente en la tabla.
-- La migracion 010 referenciaba precio/fecha/created_at que no existian en
-- el schema original (007), dejando el trigger roto y silenciando las updates.

-- 1. Anadir columnas faltantes si no existen
ALTER TABLE precios_historicos ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2);
ALTER TABLE precios_historicos ADD COLUMN IF NOT EXISTS fecha DATE;

-- 2. Defaults para las nuevas columnas
ALTER TABLE precios_historicos ALTER COLUMN fecha SET DEFAULT CURRENT_DATE;
ALTER TABLE precios_historicos ALTER COLUMN precio SET DEFAULT 0;

-- 3. Eliminar trigger y funcion viejos
DROP TRIGGER IF EXISTS trg_guardar_precios_historico ON ingredientes;
DROP FUNCTION IF EXISTS guardar_precios_historico();

-- 4. Crear funcion solo con columnas reales
CREATE OR REPLACE FUNCTION guardar_precios_historico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.precio_actual IS DISTINCT FROM NEW.precio_actual THEN
    INSERT INTO precios_historicos (ingrediente_id, precio, fecha, precio_anterior, precio_nuevo, restaurante_id, creado_en)
    VALUES (
      OLD.id,
      NEW.precio_actual,
      CURRENT_DATE,
      OLD.precio_actual,
      NEW.precio_actual,
      OLD.restaurante_id,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Recrear trigger
CREATE TRIGGER trg_guardar_precios_historico
  BEFORE UPDATE OF precio_actual ON ingredientes
  FOR EACH ROW
  EXECUTE FUNCTION guardar_precios_historico();
