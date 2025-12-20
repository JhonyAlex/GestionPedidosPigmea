-- =================================================================
-- SCRIPT DE DIAGNÓSTICO Y LIMPIEZA: LÍMITE DE COLUMNAS
-- =================================================================
-- Este script diagnostica y limpia columnas duplicadas en la tabla pedidos
-- que han causado el error "tables can have at most 1600 columns"
-- =================================================================

-- 1. DIAGNÓSTICO: Ver cuántas columnas tiene la tabla actualmente
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) 
    INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND table_schema = 'public';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNÓSTICO DE TABLA PEDIDOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de columnas: %', column_count;
    RAISE NOTICE 'Límite de PostgreSQL: 1600 columnas';
    
    IF column_count >= 1600 THEN
        RAISE NOTICE '⚠️ CRÍTICO: La tabla ha alcanzado el límite de columnas';
    ELSIF column_count > 100 THEN
        RAISE NOTICE '⚠️ ADVERTENCIA: Número inusualmente alto de columnas (esperado: ~50)';
    ELSE
        RAISE NOTICE '✅ Número de columnas dentro de rangos normales';
    END IF;
END $$;

-- 2. LISTAR TODAS LAS COLUMNAS (primeras 50)
DO $$
DECLARE
    col_record RECORD;
    counter INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'LISTADO DE COLUMNAS (primeras 50)';
    RAISE NOTICE '========================================';
    
    FOR col_record IN 
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND table_schema = 'public'
        ORDER BY ordinal_position
        LIMIT 50
    LOOP
        counter := counter + 1;
        RAISE NOTICE '% - %: % (%)', 
            counter, 
            col_record.column_name, 
            col_record.data_type,
            COALESCE(col_record.character_maximum_length::TEXT, 'N/A');
    END LOOP;
END $$;

-- 3. BUSCAR COLUMNAS DUPLICADAS (mismo nombre con sufijos numéricos)
DO $$
DECLARE
    dup_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BUSCANDO COLUMNAS DUPLICADAS';
    RAISE NOTICE '========================================';
    
    FOR dup_record IN 
        WITH column_base_names AS (
            SELECT 
                column_name,
                REGEXP_REPLACE(column_name, '_\d+$', '') AS base_name
            FROM information_schema.columns 
            WHERE table_name = 'pedidos' AND table_schema = 'public'
        )
        SELECT base_name, COUNT(*) as count, ARRAY_AGG(column_name) as columns
        FROM column_base_names
        GROUP BY base_name
        HAVING COUNT(*) > 1
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Base: % - Total: % - Columnas: %', 
            dup_record.base_name, 
            dup_record.count,
            dup_record.columns;
    END LOOP;
END $$;

-- 4. SOLUCIÓN: RECREAR LA TABLA PEDIDOS DESDE CERO
-- ADVERTENCIA: Esto eliminará datos. Solo ejecutar si es necesario
-- Descomente las siguientes líneas SOLO SI ESTÁ SEGURO

/*
-- Hacer backup de datos importantes
CREATE TABLE pedidos_backup AS 
SELECT * FROM pedidos LIMIT 0;  -- Solo estructura, sin datos por ahora

-- Si quiere guardar datos, cambie LIMIT 0 por un número mayor o quítelo

-- Eliminar tabla corrupta
DROP TABLE IF EXISTS pedidos CASCADE;

-- Recrear ejecutando las migraciones desde cero
-- Ejecute manualmente: sh backend/run-migrations.sh
*/

-- =================================================================
-- INSTRUCCIONES DE USO
-- =================================================================
-- 
-- 1. Ejecutar este script para diagnosticar:
--    psql $DATABASE_URL -f database/migrations/fix-column-limit.sql
--
-- 2. Si encuentra columnas duplicadas, puede intentar eliminarlas manualmente:
--    ALTER TABLE pedidos DROP COLUMN nombre_columna_duplicada;
--
-- 3. Si la situación es crítica (cerca de 1600 columnas), 
--    considere recrear la tabla desde cero descomentando la sección 4
--
-- =================================================================
