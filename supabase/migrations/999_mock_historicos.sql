-- MOCK: Genera datos de histórico de precios para pruebas
-- 1. Primero obtén tu restaurante_id:
--    SELECT id FROM restaurantes LIMIT 1;
-- 2. Reemplaza 'TU_RESTAURANTE_ID_AQUÍ' abajo y ejecuta

DO $$
DECLARE
  ing RECORD;
  precio_base DECIMAL(10,2);
  precio_anterior DECIMAL(10,2);
  precio_nuevo DECIMAL(10,2);
  dias_atras INT;
  num_cambios INT;
  j INT;
  rest_id UUID := '25059c4c-3078-4476-9476-f86f3db2ad27'; -- ← CAMBIA ESTO
BEGIN
  FOR ing IN SELECT id, precio_actual, nombre FROM ingredientes WHERE restaurante_id = rest_id LOOP
    precio_base := COALESCE(ing.precio_actual, 1.0);
    num_cambios := 4 + floor(random() * 7)::int; -- entre 4 y 10 cambios por ingrediente

    FOR j IN 1..num_cambios LOOP
      dias_atras := (num_cambios - j + 1) * (90 / num_cambios);
      precio_anterior := precio_base * (0.8 + random() * 0.4);
      precio_nuevo := precio_base * (0.8 + random() * 0.4);

      INSERT INTO precios_historicos (ingrediente_id, precio_anterior, precio_nuevo, restaurante_id, creado_en)
      VALUES (ing.id, precio_anterior, precio_nuevo, rest_id, now() - (dias_atras || ' days')::interval);
    END LOOP;
  END LOOP;
END;
$$;
