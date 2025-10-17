-- =================================================================
-- MIGRACIÓN: CAMPO NÚMERO DE COMPRA
-- =================================================================
-- Descripción:
-- Este script agrega el campo "numero_compra" a la tabla pedidos
-- según las especificaciones del usuario.
--
-- Características del campo:
-- - Tipo: VARCHAR(50) - Alfanumérico 
-- - Longitud máxima: 50 caracteres
-- - Obligatorio: No (NULL)
-- - Único: No
-- - Indexado: Sí (para búsquedas optimizadas)
--
-- Funcionalidades:
-- 1. Sincronización en tiempo real (implementado en backend)
-- 2. Historial de actividad (implementado en auditoría)
-- 3. Indexación para búsquedas optimizadas
-- 4. Soporte para búsqueda parcial y completa
-- =================================================================

BEGIN;

-- Verificar que la tabla pedidos existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pedidos' AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'La tabla pedidos no existe. Ejecute primero la migración 000-create-pedidos-table.sql';
    END IF;
END $$;

-- Agregar el campo numero_compra si no existe
DO $$
BEGIN
    -- Verificar si la columna ya existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'numero_compra'
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna
        ALTER TABLE pedidos ADD COLUMN numero_compra VARCHAR(50);
        
        -- Agregar comentario para documentación
        COMMENT ON COLUMN pedidos.numero_compra IS 'Número de compra del pedido - Alfanumérico, máximo 50 caracteres, opcional';
        
        RAISE NOTICE 'Columna numero_compra agregada exitosamente a la tabla pedidos';
    ELSE
        RAISE NOTICE 'La columna numero_compra ya existe en la tabla pedidos';
    END IF;
END $$;

-- Crear índice para búsquedas optimizadas si no existe
DO $$
BEGIN
    -- Verificar si el índice ya existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'pedidos' 
        AND indexname = 'idx_pedidos_numero_compra'
    ) THEN
        -- Crear el índice
        CREATE INDEX idx_pedidos_numero_compra ON pedidos(numero_compra);
        
        RAISE NOTICE 'Índice idx_pedidos_numero_compra creado exitosamente';
    ELSE
        RAISE NOTICE 'El índice idx_pedidos_numero_compra ya existe';
    END IF;
END $$;

-- Crear índice adicional para búsquedas de texto con LIKE (búsqueda parcial)
DO $$
BEGIN
    -- Verificar si el índice de búsqueda parcial ya existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'pedidos' 
        AND indexname = 'idx_pedidos_numero_compra_text'
    ) THEN
        -- Crear índice para búsquedas con LIKE usando gin y pg_trgm
        -- Primero verificar si la extensión pg_trgm está disponible
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        
        -- Crear el índice GIN para búsquedas de texto eficientes
        CREATE INDEX idx_pedidos_numero_compra_text ON pedidos USING gin(numero_compra gin_trgm_ops);
        
        RAISE NOTICE 'Índice de búsqueda de texto idx_pedidos_numero_compra_text creado exitosamente';
    ELSE
        RAISE NOTICE 'El índice de búsqueda de texto idx_pedidos_numero_compra_text ya existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'No se pudo crear el índice de búsqueda de texto: %. Continuando con índice básico.', SQLERRM;
END $$;

-- Verificación final
DO $$
DECLARE
    column_exists BOOLEAN;
    index_exists BOOLEAN;
BEGIN
    -- Verificar columna
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'numero_compra'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    -- Verificar índice
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'pedidos' 
        AND indexname = 'idx_pedidos_numero_compra'
    ) INTO index_exists;
    
    IF column_exists AND index_exists THEN
        RAISE NOTICE '✅ Migración completada exitosamente:';
        RAISE NOTICE '   - Campo numero_compra agregado';
        RAISE NOTICE '   - Índice para búsquedas creado';
        RAISE NOTICE '   - Listo para implementación en backend y frontend';
    ELSE
        RAISE EXCEPTION 'Error en la migración. Columna: %, Índice: %', column_exists, index_exists;
    END IF;
END $$;

COMMIT;

-- =================================================================
-- INFORMACIÓN DE VERIFICACIÓN POST-MIGRACIÓN
-- =================================================================
--
-- Para verificar que la migración se ejecutó correctamente:
--
-- 1. Verificar la columna:
-- SELECT column_name, data_type, character_maximum_length, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'pedidos' AND column_name = 'numero_compra';
--
-- 2. Verificar los índices:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'pedidos' 
-- AND indexname LIKE '%numero_compra%';
--
-- 3. Probar una inserción:
-- UPDATE pedidos SET numero_compra = 'COMP-2024-001' WHERE id = 'algún_id';
--
-- 4. Probar búsqueda:
-- SELECT id, numero_pedido_cliente, numero_compra 
-- FROM pedidos 
-- WHERE numero_compra ILIKE '%COMP%';
--
-- =================================================================