-- ============================================================================
-- SCRIPT DE REPARACIÓN: Migración 036 - Add antivaho_realizado
-- ============================================================================
-- Este script aplica manualmente la migración 036 al schema limpio.pedidos
-- y registra la migración como completada.
--
-- EJECUTAR COMO: docker exec -i 18047ac00bc3 psql -U pigmea_user -d gestion_pedidos < fix-migration-036.sql
-- ============================================================================

\echo '🔧 Iniciando reparación de migración 036...'
\echo ''

-- 1. Verificar estado actual de limpio.pedidos
\echo '📊 Estado actual de limpio.pedidos:'
SELECT 
    COUNT(*) as total_pedidos,
    COUNT(CASE WHEN antivaho = true THEN 1 END) as pedidos_con_antivaho
FROM limpio.pedidos;

\echo ''
\echo '🔍 Verificando si la columna antivaho_realizado ya existe...'

-- 2. Agregar la columna antivaho_realizado si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'limpio' 
        AND table_name = 'pedidos' 
        AND column_name = 'antivaho_realizado'
    ) THEN
        ALTER TABLE limpio.pedidos ADD COLUMN antivaho_realizado BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Columna antivaho_realizado agregada a limpio.pedidos';
    ELSE
        RAISE NOTICE '⚠️  Columna antivaho_realizado ya existe en limpio.pedidos';
    END IF;
END $$;

\echo ''
\echo '🔍 Creando índice para antivaho_realizado...'

-- 3. Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_antivaho_realizado 
ON limpio.pedidos(antivaho_realizado) 
WHERE antivaho = true AND antivaho_realizado = false;

\echo '✅ Índice idx_pedidos_antivaho_realizado creado'
\echo ''

-- 4. Verificar si existe tabla de migraciones
\echo '🔍 Verificando tabla de migraciones...'
DO $$
DECLARE
    tabla_existe BOOLEAN;
    migration_existe BOOLEAN;
BEGIN
    -- Verificar si existe la tabla migrations
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'migrations'
    ) INTO tabla_existe;
    
    IF tabla_existe THEN
        RAISE NOTICE '✅ Tabla migrations encontrada';
        
        -- Verificar si la migración 036 ya está registrada
        SELECT EXISTS (
            SELECT 1 FROM migrations 
            WHERE name = '036-add-antivaho-realizado'
        ) INTO migration_existe;
        
        IF migration_existe THEN
            RAISE NOTICE '⚠️  Migración 036-add-antivaho-realizado ya está registrada';
        ELSE
            -- Registrar la migración como completada
            INSERT INTO migrations (name, executed_at) 
            VALUES ('036-add-antivaho-realizado', NOW());
            RAISE NOTICE '✅ Migración 036-add-antivaho-realizado registrada como completada';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  Tabla migrations NO existe - la migración no será registrada';
        RAISE NOTICE '    Esto puede ser normal si el sistema no usa tabla de migraciones';
    END IF;
END $$;

\echo ''
\echo '📊 Verificación final:'

-- 5. Verificar resultado final
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'limpio' 
AND table_name = 'pedidos' 
AND column_name IN ('antivaho', 'antivaho_realizado')
ORDER BY column_name;

\echo ''
\echo '✅ Reparación completada exitosamente!'
\echo ''
\echo '📝 Siguiente paso: Modificar TODOS los scripts de migración para usar limpio.pedidos'
\echo '   Ver archivo: database/migration-schema-fix-plan.md'
