-- 012_ventas_diarias.sql
-- Tabla para registrar ventas diarias por plato

CREATE TABLE IF NOT EXISTS ventas_diarias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plato_id uuid REFERENCES platos(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  cantidad integer NOT NULL DEFAULT 0,
  restaurante_id uuid REFERENCES restaurantes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(plato_id, fecha, restaurante_id)
);

CREATE INDEX IF NOT EXISTS idx_ventas_diarias_fecha
  ON ventas_diarias(restaurante_id, fecha DESC);

-- Desactivar RLS (control de acceso via frontend, como el resto de tablas)
ALTER TABLE ventas_diarias DISABLE ROW LEVEL SECURITY;

-- Dar permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ventas_diarias TO anon, authenticated;
