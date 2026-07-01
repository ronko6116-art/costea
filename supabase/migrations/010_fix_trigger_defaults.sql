-- 010_fix_trigger_defaults.sql
-- Arregla el trigger y añade defaults para que el INSERT funcione
-- La tabla real tiene: id uuid NOT NULL, precio numeric NOT NULL, fecha date NOT NULL

-- 1. Asegurar default para UUID primary key
ALTER TABLE precios_historicos
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Asegurar default para fecha (hoy)
ALTER TABLE precios_historicos
  ALTER COLUMN fecha SET DEFAULT CURRENT_DATE;

-- 3. Asegurar default para precio (0, aunque el trigger siempre pondrá un valor)
ALTER TABLE precios_historicos
  ALTER COLUMN precio SET DEFAULT 0;

-- 4. Recrear función del trigger incluyendo TODAS las columnas obligatorias
CREATE OR REPLACE FUNCTION guardar_precios_historico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.precio_actual IS DISTINCT FROM NEW.precio_actual THEN
    INSERT INTO precios_historicos (id, ingrediente_id, precio, fecha, created_at, precio_anterior, precio_nuevo, restaurante_id, creado_en)
    VALUES (
      gen_random_uuid(),
      OLD.id,
      NEW.precio_actual,
      CURRENT_DATE,
      NOW(),
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
DROP TRIGGER IF EXISTS trg_guardar_precios_historico ON ingredientes;
CREATE TRIGGER trg_guardar_precios_historico
  BEFORE UPDATE OF precio_actual ON ingredientes
  FOR EACH ROW
  EXECUTE FUNCTION guardar_precios_historico();
