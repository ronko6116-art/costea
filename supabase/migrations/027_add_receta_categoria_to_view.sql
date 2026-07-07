-- 027_add_receta_categoria_to_view.sql
-- Añade el servicio (categoría de la receta) a vista_coste_platos
-- para mostrarlo en el dashboard y que refleje cambios en la receta

DROP VIEW IF EXISTS vista_coste_platos CASCADE;

CREATE VIEW vista_coste_platos AS
SELECT
  p.id AS plato_id,
  p.nombre AS plato_nombre,
  p.precio_venta,
  p.factor_porcion,
  p.receta_id,
  rb.porciones_base,
  rb.categoria AS receta_categoria,
  COALESCE(SUM(
    rl.cantidad
    * (1 + COALESCE(rl.merma_pct, 0) / 100)
    * i.precio_actual
    * CASE WHEN i.unidad_medida = 'docena' THEN 1.0/12 ELSE 1 END
  ), 0)
    / NULLIF(rb.porciones_base, 0) * p.factor_porcion AS coste_total,
  CASE
    WHEN p.precio_venta > 0
    THEN ROUND((
      p.precio_venta - (
        COALESCE(SUM(
          rl.cantidad
          * (1 + COALESCE(rl.merma_pct, 0) / 100)
          * i.precio_actual
          * CASE WHEN i.unidad_medida = 'docena' THEN 1.0/12 ELSE 1 END
        ), 0)
          / NULLIF(rb.porciones_base, 0) * p.factor_porcion
      )
    ) / p.precio_venta * 100, 2)
    ELSE 0
  END AS margen_pct,
  p.margen_objetivo,
  p.categoria,
  p.restaurante_id,
  p.activo,
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
GROUP BY p.id, p.nombre, p.precio_venta, p.margen_objetivo, p.categoria, p.restaurante_id, p.factor_porcion, p.receta_id, rb.porciones_base, rb.categoria, p.activo;

GRANT SELECT ON TABLE vista_coste_platos TO anon, authenticated;
