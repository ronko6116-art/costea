-- Habilitar RLS y añadir políticas para precios_proveedor
-- La tabla se creó sin políticas, lo que causa "permission denied"

ALTER TABLE precios_proveedor ENABLE ROW LEVEL SECURITY;

-- Permitir SELECT a usuarios autenticados sobre ingredientes de sus restaurantes
CREATE POLICY "Usuarios pueden leer precios de sus ingredientes"
ON precios_proveedor
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ingredientes
    JOIN restaurantes ON restaurantes.id = ingredientes.restaurante_id
    WHERE ingredientes.id = precios_proveedor.ingrediente_id
    AND restaurantes.owner_id = auth.uid()
  )
);

-- Permitir INSERT/UPDATE/DELETE a usuarios autenticados
CREATE POLICY "Usuarios pueden gestionar precios de sus ingredientes"
ON precios_proveedor
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ingredientes
    JOIN restaurantes ON restaurantes.id = ingredientes.restaurante_id
    WHERE ingredientes.id = precios_proveedor.ingrediente_id
    AND restaurantes.owner_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden actualizar precios de sus ingredientes"
ON precios_proveedor
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM ingredientes
    JOIN restaurantes ON restaurantes.id = ingredientes.restaurante_id
    WHERE ingredientes.id = precios_proveedor.ingrediente_id
    AND restaurantes.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ingredientes
    JOIN restaurantes ON restaurantes.id = ingredientes.restaurante_id
    WHERE ingredientes.id = precios_proveedor.ingrediente_id
    AND restaurantes.owner_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden eliminar precios de sus ingredientes"
ON precios_proveedor
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM ingredientes
    JOIN restaurantes ON restaurantes.id = ingredientes.restaurante_id
    WHERE ingredientes.id = precios_proveedor.ingrediente_id
    AND restaurantes.owner_id = auth.uid()
  )
);
