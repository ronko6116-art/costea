-- 007_precios_historicos.sql
-- Crea tabla de histórico de precios + trigger automático al actualizar ingredientes

-- Crear tabla si no existe (esquema completo)
CREATE TABLE IF NOT EXISTS precios_historicos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ingrediente_id uuid REFERENCES ingredientes(id) ON DELETE CASCADE,
  precio_anterior DECIMAL(10,2),
  precio_nuevo DECIMAL(10,2),
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- Añadir columnas si la tabla ya existía sin ellas (seguro con IF NOT EXISTS)
ALTER TABLE precios_historicos ADD COLUMN IF NOT EXISTS precio_anterior DECIMAL(10,2);
ALTER TABLE precios_historicos ADD COLUMN IF NOT EXISTS precio_nuevo DECIMAL(10,2);
ALTER TABLE precios_historicos ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE;
ALTER TABLE precios_historicos ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT now();

-- Índice para consultas rápidas por ingrediente + fecha
CREATE INDEX IF NOT EXISTS idx_precios_historicos_ingrediente
  ON precios_historicos(ingrediente_id, creado_en DESC);

-- Función del trigger
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

-- Vincular trigger a la tabla ingredientes
DROP TRIGGER IF EXISTS trg_guardar_precios_historico ON ingredientes;
CREATE TRIGGER trg_guardar_precios_historico
  BEFORE UPDATE OF precio_actual ON ingredientes
  FOR EACH ROW
  EXECUTE FUNCTION guardar_precios_historico();
