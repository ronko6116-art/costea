-- Crear tabla de precios por proveedor para cada ingrediente.
-- Permite que un mismo ingrediente tenga precios distintos según el proveedor.

CREATE TABLE IF NOT EXISTS precios_proveedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingrediente_id uuid NOT NULL REFERENCES ingredientes(id) ON DELETE CASCADE,
  proveedor_id uuid NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
  precio numeric NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ingrediente_id, proveedor_id)
);

-- Migrar datos existentes: si un ingrediente tiene proveedor_habitual,
-- crear el registro correspondiente en precios_proveedor
INSERT INTO precios_proveedor (ingrediente_id, proveedor_id, precio, updated_at)
SELECT id, proveedor_habitual_id, precio_actual, COALESCE(updated_at, now())
FROM ingredientes
WHERE proveedor_habitual_id IS NOT NULL AND precio_actual > 0
ON CONFLICT (ingrediente_id, proveedor_id) DO NOTHING;
