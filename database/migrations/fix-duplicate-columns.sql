-- =================================================================
-- SCRIPT DE LIMPIEZA: ELIMINAR COLUMNAS DUPLICADAS
-- =================================================================
-- Este script elimina columnas duplicadas que fueron creadas
-- accidentalmente en la tabla pedidos
-- =================================================================

BEGIN;

-- 1. DIAGNÓSTICO INICIAL
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) 
    INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND table_schema = 'public';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'LIMPIEZA DE COLUMNAS DUPLICADAS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de columnas ANTES de limpieza: %', column_count;
    RAISE NOTICE 'Límite de PostgreSQL: 1600 columnas';
END $$;

-- 2. ELIMINAR COLUMNAS DUPLICADAS DE numero_compra
DO $$
DECLARE
    col_record RECORD;
    dropped_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Buscando y eliminando columnas duplicadas de numero_compra...';
    
    -- Buscar todas las columnas que empiezan con numero_compra
    FOR col_record IN 
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND table_schema = 'public'
        AND column_name SIMILAR TO 'numero_compra(_[0-9]+)?'
        ORDER BY column_name
    LOOP
        -- Eliminar la columna
        EXECUTE format('ALTER TABLE pedidos DROP COLUMN IF EXISTS %I CASCADE', col_record.column_name);
        dropped_count := dropped_count + 1;
        RAISE NOTICE 'Eliminada: %', col_record.column_name;
    END LOOP;
    
    RAISE NOTICE 'Total de columnas numero_compra eliminadas: %', dropped_count;
END $$;

-- 3. ELIMINAR COLUMNAS DUPLICADAS DE numeros_compra (array)
DO $$
DECLARE
    col_record RECORD;
    dropped_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Buscando y eliminando columnas duplicadas de numeros_compra...';
    
    FOR col_record IN 
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND table_schema = 'public'
        AND column_name SIMILAR TO 'numeros_compra(_[0-9]+)?'
        ORDER BY column_name
    LOOP
        EXECUTE format('ALTER TABLE pedidos DROP COLUMN IF EXISTS %I CASCADE', col_record.column_name);
        dropped_count := dropped_count + 1;
        RAISE NOTICE 'Eliminada: %', col_record.column_name;
    END LOOP;
    
    RAISE NOTICE 'Total de columnas numeros_compra eliminadas: %', dropped_count;
END $$;

-- 4. BUSCAR Y ELIMINAR OTRAS POSIBLES DUPLICACIONES
DO $$
DECLARE
    col_record RECORD;
    base_name TEXT;
    dropped_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Buscando otras columnas con sufijos numéricos...';
    
    -- Buscar columnas que terminen con _número (posibles duplicados)
    FOR col_record IN 
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND table_schema = 'public'
        AND column_name ~ '_[0-9]+$'
        ORDER BY column_name
    LOOP
        -- Obtener el nombre base (sin el sufijo numérico)
        base_name := REGEXP_REPLACE(col_record.column_name, '_[0-9]+$', '');
        
        -- Verificar si existe la columna base
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'pedidos' 
            AND table_schema = 'public'
            AND column_name = base_name
        ) THEN
            -- Si existe la columna base, eliminar el duplicado
            EXECUTE format('ALTER TABLE pedidos DROP COLUMN IF EXISTS %I CASCADE', col_record.column_name);
            dropped_count := dropped_count + 1;
            RAISE NOTICE 'Eliminada duplicación: % (base: %)', col_record.column_name, base_name;
        END IF;
    END LOOP;
    
    IF dropped_count > 0 THEN
        RAISE NOTICE 'Total de otras columnas duplicadas eliminadas: %', dropped_count;
    ELSE
        RAISE NOTICE 'No se encontraron otras columnas duplicadas';
    END IF;
END $$;

-- 5. DIAGNÓSTICO FINAL
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) 
    INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND table_schema = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de columnas DESPUÉS de limpieza: %', column_count;
    
    IF column_count < 100 THEN
        RAISE NOTICE '✅ Limpieza exitosa. Tabla normalizada.';
    ELSIF column_count < 200 THEN
        RAISE NOTICE '⚠️ Advertencia: Aún hay muchas columnas. Revise manualmente.';
    ELSE
        RAISE NOTICE '❌ Crítico: La tabla sigue teniendo demasiadas columnas.';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =================================================================
-- INSTRUCCIONES POST-LIMPIEZA
-- =================================================================
--
-- Después de ejecutar este script:
--
-- 1. Verificar el estado de la tabla:
--    SELECT COUNT(*) FROM information_schema.columns 
--    WHERE table_name = 'pedidos';
--
-- 2. Re-habilitar las migraciones comentadas en run-migrations.sh
--
-- 3. Ejecutar las migraciones nuevamente:
--    cd backend && sh run-migrations.sh
--
-- 4. Verificar que el servidor arranca correctamente
--
-- =================================================================
