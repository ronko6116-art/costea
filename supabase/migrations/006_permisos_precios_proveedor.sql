-- Conceder permisos sobre precios_proveedor a los roles de Supabase
-- (la tabla se creó sin RLS pero los roles anon/authenticated no tienen acceso por defecto)

ALTER TABLE precios_proveedor DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE precios_proveedor TO anon, authenticated;
