-- 018_trigger_insert_ingredientes.sql
-- El trigger actual (011) solo se dispara en UPDATE de precio_actual.
-- Los ingredientes creados con un precio nunca generan su primer registro
-- histórico, por lo que no aparecen en la gráfica de evolución de precios.
-- 
-- Cambios:
--   1. Recrear función y trigger para que también dispare en INSERT
--   2. Conceder SELECT en ingredientes a anon/authenticated (necesario
--      para que PrecioEvolucion.jsx pueda resolver restaurante_id)

-- 1. Eliminar trigger y función viejos
DROP TRIGGER IF EXISTS trg_guardar_precios_historico ON ingredientes;
DROP FUNCTION IF EXISTS guardar_precios_historico();

-- 2. Recrear función que maneja INSERT y UPDATE
CREATE OR REPLACE FUNCTION guardar_precios_historico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Al crear un ingrediente, registrar el precio inicial
    INSERT INTO precios_historicos (ingrediente_id, precio, fecha, precio_anterior, precio_nuevo, restaurante_id, creado_en)
    VALUES (
      NEW.id,
      NEW.precio_actual,
      CURRENT_DATE,
      0,
      NEW.precio_actual,
      NEW.restaurante_id,
      NOW()
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.precio_actual IS DISTINCT FROM NEW.precio_actual THEN
    -- Solo registrar si el precio cambió
    INSERT INTO precios_historicos (ingrediente_id, precio, fecha, precio_anterior, precio_nuevo, restaurante_id, creado_en)
    VALUES (
      NEW.id,
      NEW.precio_actual,
      CURRENT_DATE,
      OLD.precio_actual,
      NEW.precio_actual,
      NEW.restaurante_id,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Recrear trigger para INSERT y UPDATE
CREATE TRIGGER trg_guardar_precios_historico
  AFTER INSERT OR UPDATE OF precio_actual ON ingredientes
  FOR EACH ROW
  EXECUTE FUNCTION guardar_precios_historico();

-- 4. Conceder SELECT en ingredientes para que PrecioEvolucion.jsx
--    pueda obtener el restaurante_id del ingrediente
GRANT SELECT ON TABLE ingredientes TO anon, authenticated;

-- 5. Backfill: crear registro histórico inicial para ingredientes existentes
--    que aún no tengan ninguna fila en precios_historicos
INSERT INTO precios_historicos (ingrediente_id, precio, fecha, precio_anterior, precio_nuevo, restaurante_id, creado_en)
SELECT
  i.id,
  i.precio_actual,
  CURRENT_DATE,
  0,
  i.precio_actual,
  i.restaurante_id,
  NOW()
FROM ingredientes i
WHERE NOT EXISTS (
  SELECT 1 FROM precios_historicos ph WHERE ph.ingrediente_id = i.id
);
