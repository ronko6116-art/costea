-- 017_vista_porciones_base.sql
-- Corrige el cálculo de coste_total dividiendo por porciones_base de recetas_base.
-- Añade porciones_base a la vista para uso en frontend.

DROP VIEW IF EXISTS vista_coste_platos CASCADE;

CREATE VIEW vista_coste_platos AS
SELECT
  p.id AS plato_id,
  p.nombre AS plato_nombre,
  p.precio_venta,
  p.factor_porcion,
  p.receta_id,
  rb.porciones_base,
  COALESCE(SUM(rl.cantidad * (1 + COALESCE(rl.merma_pct, 0) / 100) * i.precio_actual), 0)
    / NULLIF(rb.porciones_base, 0) * p.factor_porcion AS coste_total,
  CASE
    WHEN p.precio_venta > 0
    THEN ROUND((
      p.precio_venta - (
        COALESCE(SUM(rl.cantidad * (1 + COALESCE(rl.merma_pct, 0) / 100) * i.precio_actual), 0)
          / NULLIF(rb.porciones_base, 0) * p.factor_porcion
      )
    ) / p.precio_venta * 100, 2)
    ELSE 0
  END AS margen_pct,
  p.margen_objetivo,
  p.categoria,
  p.restaurante_id,
  COALESCE(
    (SELECT bool_or(i2.precio_actual IS NULL OR i2.precio_actual = 0)
     FROM receta_lineas rl2
     JOIN ingredientes i2 ON i2.id = rl2.ingrediente_id
     WHERE rl2.receta_id = p.receta_id),
    FALSE
  ) AS tiene_sin_precio
FROM platos p
LEFT JOIN recetas_base rb ON rb.id = p.receta_id
LEFT JOIN receta_lineas rl ON rl.receta_id = p.receta_id
LEFT JOIN ingredientes i ON i.id = rl.ingrediente_id
GROUP BY p.id, p.nombre, p.precio_venta, p.margen_objetivo, p.categoria, p.restaurante_id, p.factor_porcion, p.receta_id, rb.porciones_base;

GRANT SELECT ON TABLE vista_coste_platos TO anon, authenticated;
