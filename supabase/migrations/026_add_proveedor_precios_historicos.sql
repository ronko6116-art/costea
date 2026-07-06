-- 026_add_proveedor_precios_historicos.sql
-- Añade proveedor_id a precios_historicos para distinguir compras
-- del mismo producto a diferentes proveedores en la misma fecha.
-- Si dos registros tienen la misma fecha y proveedor, se asume que
-- el último (por creado_en) es una corrección del precio.

-- 1. Añadir columna proveedor_id (nullable para registros existentes)
ALTER TABLE precios_historicos
  ADD COLUMN IF NOT EXISTS proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL;

-- 2. Recrear función del trigger incluyendo proveedor_id
CREATE OR REPLACE FUNCTION guardar_precios_historico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO precios_historicos (ingrediente_id, precio, fecha, precio_anterior, precio_nuevo, restaurante_id, proveedor_id, creado_en)
    VALUES (
      NEW.id,
      NEW.precio_actual,
      CURRENT_DATE,
      0,
      NEW.precio_actual,
      NEW.restaurante_id,
      NEW.proveedor_id,
      NOW()
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.precio_actual IS DISTINCT FROM NEW.precio_actual THEN
    INSERT INTO precios_historicos (ingrediente_id, precio, fecha, precio_anterior, precio_nuevo, restaurante_id, proveedor_id, creado_en)
    VALUES (
      NEW.id,
      NEW.precio_actual,
      CURRENT_DATE,
      OLD.precio_actual,
      NEW.precio_actual,
      NEW.restaurante_id,
      NEW.proveedor_id,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Backfill: asignar proveedor_id actual del ingrediente a registros existentes
UPDATE precios_historicos ph
SET proveedor_id = i.proveedor_id
FROM ingredientes i
WHERE ph.ingrediente_id = i.id
  AND ph.proveedor_id IS NULL;
