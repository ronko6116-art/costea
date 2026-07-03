-- 016_rls_receta_lineas.sql
-- Desactiva RLS en receta_lineas (se perdió al dropear políticas en 013)

ALTER TABLE receta_lineas DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE receta_lineas TO anon, authenticated;
