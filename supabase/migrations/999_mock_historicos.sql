-- MOCK: Genera datos de histórico de precios para pruebas
-- Inserta datos para TODOS los ingredientes existentes
-- NO depende de restaurante_id — funciona siempre que haya ingredientes

DO $$
DECLARE
  ing RECORD;
  r RECORD;
  precio_actual DECIMAL(10,2);
  precio_anterior DECIMAL(10,2);
  precio_nuevo DECIMAL(10,2);
  dias_atras INT;
  num_cambios INT;
  j INT;
  total_ing INT := 0;
  total_ins INT := 0;
BEGIN
  SELECT COUNT(*) INTO total_ing FROM ingredientes;
  RAISE NOTICE 'Ingredientes encontrados: %', total_ing;

  FOR ing IN SELECT id, nombre, precio_actual, restaurante_id FROM ingredientes LOOP
    precio_actual := COALESCE(ing.precio_actual, 1.0);
    IF precio_actual <= 0 THEN precio_actual := 1.0; END IF;

    num_cambios := 5 + floor(random() * 6)::int;

    FOR j IN 1..num_cambios LOOP
      dias_atras := 90 - ((j - 1) * 90 / num_cambios);
      precio_anterior := precio_actual * (0.75 + random() * 0.5);
      precio_nuevo := precio_actual * (0.75 + random() * 0.5);

      INSERT INTO precios_historicos (ingrediente_id, precio_anterior, precio_nuevo, restaurante_id, creado_en)
      VALUES (ing.id, precio_anterior, precio_nuevo, ing.restaurante_id, now() - (dias_atras || ' days')::interval);
      total_ins := total_ins + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'INSERTS realizados: %', total_ins;

  IF total_ins = 0 THEN
    RAISE NOTICE 'NO HAY DATOS: Crea al menos un ingrediente primero.';
  END IF;
END;
$$;
