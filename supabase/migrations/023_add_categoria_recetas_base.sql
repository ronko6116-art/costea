-- 023_add_categoria_recetas_base.sql
-- Añade columna categoria a recetas_base para clasificar recetas

ALTER TABLE recetas_base ADD COLUMN IF NOT EXISTS categoria text;

UPDATE recetas_base SET categoria = NULL WHERE categoria IS NULL;
