-- 009_rls_precios_historicos.sql
-- Desactiva RLS en precios_historicos para que el frontend pueda leer datos

DROP POLICY IF EXISTS "owner ve historico de sus ingredientes" ON precios_historicos;
ALTER TABLE precios_historicos DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE precios_historicos TO anon, authenticated;
