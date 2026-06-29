-- Añadir columna tiene_sin_precio a vista_coste_platos
-- Indica si algún ingrediente de la receta tiene precio_actual = 0 o NULL

DROP VIEW IF EXISTS vista_coste_platos CASCADE;

CREATE VIEW vista_coste_platos AS
SELECT
  p.id AS plato_id,
  p.nombre AS plato_nombre,
  p.precio_venta,
  COALESCE(SUM(rl.cantidad * (1 + COALESCE(rl.merma_pct, 0) / 100) * i.precio_actual), 0) AS coste_total,
  CASE
    WHEN p.precio_venta > 0
    THEN ROUND(((p.precio_venta - COALESCE(SUM(rl.cantidad * (1 + COALESCE(rl.merma_pct, 0) / 100) * i.precio_actual), 0)) / p.precio_venta) * 100, 2)
    ELSE 0
  END AS margen_pct,
  p.margen_objetivo,
  p.categoria,
  p.restaurante_id,
  COALESCE(
    (SELECT bool_or(i2.precio_actual IS NULL OR i2.precio_actual = 0)
     FROM receta_lineas rl2
     JOIN ingredientes i2 ON i2.id = rl2.ingrediente_id
     WHERE rl2.plato_id = p.id),
    FALSE
  ) AS tiene_sin_precio
FROM platos p
LEFT JOIN receta_lineas rl ON rl.plato_id = p.id
LEFT JOIN ingredientes i ON i.id = rl.ingrediente_id
GROUP BY p.id, p.nombre, p.precio_venta, p.margen_objetivo, p.categoria, p.restaurante_id;
