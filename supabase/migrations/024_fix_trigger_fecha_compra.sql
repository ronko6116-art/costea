-- 024_fix_trigger_fecha_compra.sql
-- El trigger guardar_precios_historico usaba CURRENT_DATE como fecha en lugar
-- de la fecha_compra real del ingrediente. Esto provocaba que el gráfico de
-- evolución de precios mostrara el precio en el día incorrecto.

-- 1. Recrear función para INSERT
CREATE OR REPLACE FUNCTION guardar_precios_historico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO precios_historicos (ingrediente_id, precio, fecha, precio_anterior, precio_nuevo, restaurante_id, creado_en)
    VALUES (
      NEW.id,
      NEW.precio_actual,
      COALESCE(NEW.fecha_compra, CURRENT_DATE),
      0,
      NEW.precio_actual,
      NEW.restaurante_id,
      NOW()
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.precio_actual IS DISTINCT FROM NEW.precio_actual THEN
    INSERT INTO precios_historicos (ingrediente_id, precio, fecha, precio_anterior, precio_nuevo, restaurante_id, creado_en)
    VALUES (
      NEW.id,
      NEW.precio_actual,
      COALESCE(NEW.fecha_compra, CURRENT_DATE),
      OLD.precio_actual,
      NEW.precio_actual,
      NEW.restaurante_id,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Backfill: corregir registros históricos cuya fecha no coincide con la
--    fecha_compra del ingrediente (solo cuando fecha_compra está definida)
UPDATE precios_historicos ph
SET fecha = i.fecha_compra
FROM ingredientes i
WHERE ph.ingrediente_id = i.id
  AND i.fecha_compra IS NOT NULL
  AND ph.fecha IS DISTINCT FROM i.fecha_compra;
