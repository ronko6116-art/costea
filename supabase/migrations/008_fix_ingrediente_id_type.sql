-- 008_fix_ingrediente_id_type.sql
-- Corrige el tipo de ingrediente_id en precios_historicos (era BIGINT, debe ser uuid)

-- 1. Eliminar políticas RLS que dependen de la columna
DROP POLICY IF EXISTS "owner ve historico de sus ingredientes" ON precios_historicos;

-- 2. Eliminar el trigger y la función para poder modificar la tabla
DROP TRIGGER IF EXISTS trg_guardar_precios_historico ON ingredientes;
DROP FUNCTION IF EXISTS guardar_precios_historico;

-- 3. Eliminar el índice que usa la columna
DROP INDEX IF EXISTS idx_precios_historicos_ingrediente;

-- 4. Vaciar datos existentes (no servirán porque el tipo era incorrecto)
DELETE FROM precios_historicos;

-- 5. Cambiar el tipo de la columna
ALTER TABLE precios_historicos
  ALTER COLUMN ingrediente_id TYPE uuid USING ingrediente_id::text::uuid;

-- 6. Recrear el índice
CREATE INDEX IF NOT EXISTS idx_precios_historicos_ingrediente
  ON precios_historicos(ingrediente_id, creado_en DESC);

-- 7. Recrear la función y el trigger
CREATE OR REPLACE FUNCTION guardar_precios_historico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.precio_actual IS DISTINCT FROM NEW.precio_actual THEN
    INSERT INTO precios_historicos (ingrediente_id, precio_anterior, precio_nuevo, restaurante_id)
    VALUES (OLD.id, OLD.precio_actual, NEW.precio_actual, OLD.restaurante_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guardar_precios_historico ON ingredientes;
CREATE TRIGGER trg_guardar_precios_historico
  BEFORE UPDATE OF precio_actual ON ingredientes
  FOR EACH ROW
  EXECUTE FUNCTION guardar_precios_historico();
