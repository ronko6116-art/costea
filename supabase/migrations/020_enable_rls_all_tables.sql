-- 020_enable_rls_all_tables.sql
-- Activar RLS en todas las tablas que aún no lo tienen y crear políticas
-- consistentes basadas en restaurantes.owner_id = auth.uid()
--
-- NOTA: Las tablas platos, ingredientes, proveedores, restaurantes, alertas y
-- facturas ya tienen RLS activado con políticas similares; se dejan intactas.

-- Precios históricos: tiene restaurante_id directo
ALTER TABLE precios_historicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propietario gestiona precios históricos"
ON precios_historicos
FOR ALL
USING (
  restaurante_id IN (SELECT id FROM restaurantes WHERE owner_id = auth.uid())
);

-- Precios por proveedor: se relaciona con ingrediente → restaurante
ALTER TABLE precios_proveedor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propietario gestiona precios por proveedor"
ON precios_proveedor
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM ingredientes i
    JOIN restaurantes r ON r.id = i.restaurante_id
    WHERE i.id = precios_proveedor.ingrediente_id
    AND r.owner_id = auth.uid()
  )
);

-- Receta líneas: se relaciona con recetas_base (que tiene restaurante_id)
ALTER TABLE receta_lineas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propietario gestiona receta líneas"
ON receta_lineas
FOR ALL
USING (
  receta_id IN (
    SELECT rb.id FROM recetas_base rb
    JOIN restaurantes r ON r.id = rb.restaurante_id
    WHERE r.owner_id = auth.uid()
  )
);

-- Recetas base: tiene restaurante_id directo
ALTER TABLE recetas_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propietario gestiona recetas base"
ON recetas_base
FOR ALL
USING (
  restaurante_id IN (SELECT id FROM restaurantes WHERE owner_id = auth.uid())
);

-- Ventas diarias: tiene restaurante_id directo
ALTER TABLE ventas_diarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propietario gestiona ventas diarias"
ON ventas_diarias
FOR ALL
USING (
  restaurante_id IN (SELECT id FROM restaurantes WHERE owner_id = auth.uid())
);

-- La vista no tiene RLS (no aplica a vistas), pero el SELECT se concede
-- según los permisos de las tablas subyacentes.

-- El trigger guardar_precios_historico se ejecuta en el contexto del usuario
-- que actualiza ingredientes. Con RLS activado en precios_historicos, la
-- inserción desde el trigger fallaría porque el usuario no tiene permiso
-- directo sobre esa tabla. Solución: marcar la función como SECURITY DEFINER
-- para que se ejecute como el dueño (postgres) y pueda insertar en
-- precios_historicos sin pasar por RLS.
CREATE OR REPLACE FUNCTION guardar_precios_historico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Recrear el trigger para que use la función actualizada
DROP TRIGGER IF EXISTS trg_guardar_precios_historico ON ingredientes;
CREATE TRIGGER trg_guardar_precios_historico
  AFTER INSERT OR UPDATE OF precio_actual ON ingredientes
  FOR EACH ROW
  EXECUTE FUNCTION guardar_precios_historico();

-- Revocar permisos de anon sobre tablas sensibles (ya que RLS los controla)
-- Nota: mantener SELECT en vistas e ingredientes para consultas anónimas si
-- la app lo requiere; en este caso, anon necesita SELECT en ingredientes para
-- PrecioEvolucion, pero ya no necesita INSERT/UPDATE/DELETE
REVOKE ALL ON precios_historicos FROM anon;
REVOKE ALL ON precios_proveedor FROM anon;
REVOKE ALL ON receta_lineas FROM anon;
REVOKE ALL ON recetas_base FROM anon;
REVOKE ALL ON ventas_diarias FROM anon;
REVOKE ALL ON platos FROM anon;
REVOKE ALL ON proveedores FROM anon;
REVOKE ALL ON alertas FROM anon;
REVOKE ALL ON facturas FROM anon;
REVOKE ALL ON restaurantes FROM anon;
-- Mantener solo SELECT en ingredientes para anon (necesario para PrecioEvolucion)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON ingredientes FROM anon;
