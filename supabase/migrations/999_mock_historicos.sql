-- MOCK: Genera datos de histórico de precios para pruebas
-- Este script funciona con cualquier restaurante que tenga ingredientes

DO $$
DECLARE
  ing RECORD;
  r RECORD;
  precio_base DECIMAL(10,2);
  precio_anterior DECIMAL(10,2);
  precio_nuevo DECIMAL(10,2);
  dias_atras INT;
  num_cambios INT;
  j INT;
  total_ingredientes INT := 0;
  total_inserts INT := 0;
BEGIN
  -- Mostrar restaurantes disponibles
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'RESTAURANTES DISPONIBLES:';
  FOR r IN SELECT id, nombre FROM restaurantes ORDER BY nombre LOOP
    RAISE NOTICE '  - % (%)', r.nombre, r.id;
  END LOOP;

  -- Generar datos para cada restaurante que tenga ingredientes
  FOR r IN SELECT id, nombre FROM restaurantes ORDER BY nombre LOOP
    SELECT COUNT(*) INTO total_ingredientes FROM ingredientes WHERE restaurante_id = r.id;

    IF total_ingredientes = 0 THEN
      RAISE NOTICE 'Sin ingredientes para: % (%)', r.nombre, r.id;
      CONTINUE;
    END IF;

    RAISE NOTICE 'Generando datos para: % (%) - % ingredientes', r.nombre, r.id, total_ingredientes;

    FOR ing IN SELECT id, precio_actual, nombre FROM ingredientes WHERE restaurante_id = r.id LOOP
      precio_base := COALESCE(ing.precio_actual, 1.0);
      IF precio_base <= 0 THEN precio_base := 1.0; END IF;

      num_cambios := 4 + floor(random() * 7)::int;

      FOR j IN 1..num_cambios LOOP
        dias_atras := (num_cambios - j + 1) * (90 / num_cambios);
        precio_anterior := precio_base * (0.75 + random() * 0.5);
        precio_nuevo := precio_base * (0.75 + random() * 0.5);

        INSERT INTO precios_historicos (ingrediente_id, precio_anterior, precio_nuevo, restaurante_id, creado_en)
        VALUES (ing.id, precio_anterior, precio_nuevo, r.id, now() - (dias_atras || ' days')::interval);

        total_inserts := total_inserts + 1;
      END LOOP;
    END LOOP;
  END LOOP;

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TOTAL INSERTS: %', total_inserts;

  IF total_inserts = 0 THEN
    RAISE NOTICE 'NO HAY DATOS: No se encontraron ingredientes en ningun restaurante.';
    RAISE NOTICE 'Crea primero ingredientes desde la interfaz.';
  END IF;
END;
$$;
