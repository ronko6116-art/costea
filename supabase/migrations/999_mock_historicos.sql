-- MOCK: Genera datos de histórico de precios para pruebas
-- Inserta datos para TODOS los ingredientes existentes
-- Respeta la estructura real de la tabla: id uuid, precio numeric NOT NULL, fecha date NOT NULL

DO $$
DECLARE
  ing RECORD;
  precio_actual DECIMAL(10,2);
  precio_anterior_val DECIMAL(10,2);
  precio_nuevo_val DECIMAL(10,2);
  dias_atras INT;
  num_cambios INT;
  j INT;
  total_ing INT := 0;
  total_ins INT := 0;
BEGIN
  SELECT COUNT(*) INTO total_ing FROM ingredientes;
  RAISE NOTICE 'Ingredientes encontrados: %', total_ing;

  FOR ing IN SELECT i.id, i.nombre, i.precio_actual, i.restaurante_id FROM ingredientes i LOOP
    precio_actual := COALESCE(ing.precio_actual, 1.0);
    IF precio_actual <= 0 THEN precio_actual := 1.0; END IF;

    num_cambios := 5 + floor(random() * 6)::int;

    FOR j IN 1..num_cambios LOOP
      dias_atras := 90 - ((j - 1) * 90 / num_cambios);
      precio_anterior_val := precio_actual * (0.75 + random() * 0.5);
      precio_nuevo_val := precio_actual * (0.75 + random() * 0.5);

      INSERT INTO precios_historicos (id, ingrediente_id, precio, fecha, created_at, precio_anterior, precio_nuevo, restaurante_id, creado_en)
      VALUES (
        gen_random_uuid(),
        ing.id,
        precio_nuevo_val,
        (now() - (dias_atras || ' days')::interval)::date,
        now() - (dias_atras || ' days')::interval,
        precio_anterior_val,
        precio_nuevo_val,
        ing.restaurante_id,
        now() - (dias_atras || ' days')::interval
      );
      total_ins := total_ins + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'INSERTS realizados: %', total_ins;

  IF total_ins = 0 THEN
    RAISE NOTICE 'NO HAY DATOS: Crea al menos un ingrediente primero.';
  END IF;
END;
$$;
