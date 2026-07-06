-- 025_fix_trigger_fecha.sql
-- La migración 024 cambió el trigger para usar NEW.fecha_compra como fecha,
-- pero eso provoca que todos los cambios de precio de un mismo ingrediente
-- tengan la misma fecha (la fecha de compra original). El trigger debe usar
-- CURRENT_DATE para reflejar cuándo ocurrió realmente el cambio de precio.
-- La fecha_compra solo debe usarse en inserciones manuales ("Compra pasada").

-- 1. Recrear función con CURRENT_DATE
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
      CURRENT_DATE,
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

-- 2. Corregir registros existentes: usar la fecha real del cambio (creado_en)
--    para deshacer el daño de la migración 024
UPDATE precios_historicos
SET fecha = creado_en::date
WHERE fecha IS DISTINCT FROM creado_en::date;
