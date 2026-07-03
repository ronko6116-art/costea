-- 015_permisos_recetas_base.sql
-- Concede permisos a recetas_base y vista_coste_platos (perdidos al recrear la vista)

ALTER TABLE recetas_base DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE recetas_base TO anon, authenticated;

GRANT SELECT ON TABLE vista_coste_platos TO anon, authenticated;
