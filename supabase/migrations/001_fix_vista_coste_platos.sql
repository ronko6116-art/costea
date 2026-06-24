-- Corrige el cálculo de coste_total y margen_pct en vista_coste_platos.
-- Antes: usaba i.precio_actual directamente sin multiplicar por la cantidad de receta.
-- Ahora: multiplica por (cantidad + merma) * precio_actual del ingrediente.

-- Drop primero porque CREATE OR REPLACE VIEW no permite renombrar columnas
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
  p.restaurante_id
FROM platos p
LEFT JOIN receta_lineas rl ON rl.plato_id = p.id
LEFT JOIN ingredientes i ON i.id = rl.ingrediente_id
GROUP BY p.id, p.nombre, p.precio_venta, p.margen_objetivo, p.categoria, p.restaurante_id;
