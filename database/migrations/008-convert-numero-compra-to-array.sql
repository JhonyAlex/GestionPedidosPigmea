-- =================================================================
-- Migración: Convertir numero_compra a numeros_compra (array JSONB)
-- Archivo: 008-convert-numero-compra-to-array.sql
-- Descripción: Convierte el campo numero_compra VARCHAR(50) a 
--              numeros_compra JSONB para almacenar múltiples números
--              de compra relacionados con materialConsumoCantidad
-- Fecha: Octubre 26, 2025
-- =================================================================

BEGIN;

-- ===========================
-- 1. BACKUP DE DATOS EXISTENTES
-- ===========================
-- Crear tabla temporal de respaldo
CREATE TABLE IF NOT EXISTS pedidos_backup_numeros_compra AS
SELECT id, numero_compra
FROM pedidos
WHERE numero_compra IS NOT NULL;

-- ===========================
-- 2. AGREGAR NUEVA COLUMNA JSONB
-- ===========================
-- Agregar columna temporal para numeros_compra
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS numeros_compra JSONB DEFAULT '[]'::jsonb;

-- ===========================
-- 3. MIGRAR DATOS EXISTENTES
-- ===========================
-- Convertir numero_compra existente al primer elemento del array
UPDATE pedidos
SET numeros_compra = jsonb_build_array(numero_compra)
WHERE numero_compra IS NOT NULL AND numero_compra != '';

-- Para pedidos sin numero_compra, mantener array vacío
UPDATE pedidos
SET numeros_compra = '[]'::jsonb
WHERE numero_compra IS NULL OR numero_compra = '';

-- ===========================
-- 4. ELIMINAR COLUMNA ANTIGUA
-- ===========================
-- Eliminar índices relacionados con numero_compra
DROP INDEX IF EXISTS idx_pedidos_numero_compra;
DROP INDEX IF EXISTS idx_pedidos_numero_compra_text;

-- Eliminar columna antigua
ALTER TABLE pedidos 
DROP COLUMN IF EXISTS numero_compra;

-- ===========================
-- 5. CREAR ÍNDICES OPTIMIZADOS
-- ===========================
-- Índice GIN para búsqueda en el array JSONB
CREATE INDEX IF NOT EXISTS idx_pedidos_numeros_compra_gin 
ON pedidos USING gin(numeros_compra);

-- Índice GIN para búsqueda de texto en elementos del array
CREATE INDEX IF NOT EXISTS idx_pedidos_numeros_compra_text 
ON pedidos USING gin(
    (SELECT string_agg(elem::text, ' ') 
     FROM jsonb_array_elements_text(numeros_compra) elem) 
    gin_trgm_ops
);

-- ===========================
-- 6. AGREGAR COMENTARIOS
-- ===========================
COMMENT ON COLUMN pedidos.numeros_compra IS 
'Array JSONB de números de compra. Uno por cada material de consumo (máximo 4).';

-- ===========================
-- 7. FUNCIÓN AUXILIAR DE BÚSQUEDA
-- ===========================
-- Función para buscar en numeros_compra de manera eficiente
CREATE OR REPLACE FUNCTION search_numeros_compra(search_term TEXT)
RETURNS TABLE(pedido_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id
    FROM pedidos p
    WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(p.numeros_compra) AS numero
        WHERE numero ILIKE '%' || search_term || '%'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===========================
-- 8. VALIDACIONES
-- ===========================
-- Constraint para asegurar que es un array válido
ALTER TABLE pedidos
ADD CONSTRAINT check_numeros_compra_is_array
CHECK (jsonb_typeof(numeros_compra) = 'array');

-- Constraint para limitar el tamaño del array (máximo 4 elementos)
ALTER TABLE pedidos
ADD CONSTRAINT check_numeros_compra_max_length
CHECK (jsonb_array_length(numeros_compra) <= 4);

-- ===========================
-- 9. GRANTS DE PERMISOS
-- ===========================
-- Otorgar permisos de uso de la función
GRANT EXECUTE ON FUNCTION search_numeros_compra(TEXT) TO PUBLIC;

-- ===========================
-- 10. VERIFICACIÓN
-- ===========================
-- Verificar que la migración fue exitosa
DO $$
DECLARE
    column_exists BOOLEAN;
    old_column_exists BOOLEAN;
    index_count INTEGER;
BEGIN
    -- Verificar que la nueva columna existe
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'numeros_compra'
    ) INTO column_exists;
    
    -- Verificar que la columna antigua fue eliminada
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'numero_compra'
    ) INTO old_column_exists;
    
    -- Contar índices creados
    SELECT COUNT(*) 
    FROM pg_indexes 
    WHERE tablename = 'pedidos' 
    AND indexname LIKE '%numeros_compra%'
    INTO index_count;
    
    IF column_exists AND NOT old_column_exists AND index_count >= 2 THEN
        RAISE NOTICE '✅ Migración 008 completada exitosamente';
        RAISE NOTICE '   - Columna numeros_compra: CREADA';
        RAISE NOTICE '   - Columna numero_compra: ELIMINADA';
        RAISE NOTICE '   - Índices creados: %', index_count;
    ELSE
        RAISE EXCEPTION '❌ Error en la migración 008';
    END IF;
END $$;

COMMIT;

-- =================================================================
-- INSTRUCCIONES DE ROLLBACK (si es necesario)
-- =================================================================
-- Para revertir esta migración, ejecutar:
--
-- BEGIN;
-- 
-- -- Restaurar columna antigua
-- ALTER TABLE pedidos ADD COLUMN numero_compra VARCHAR(50);
-- 
-- -- Restaurar datos del primer elemento del array
-- UPDATE pedidos
-- SET numero_compra = numeros_compra->0
-- WHERE jsonb_array_length(numeros_compra) > 0;
-- 
-- -- Eliminar nueva columna e índices
-- DROP INDEX IF EXISTS idx_pedidos_numeros_compra_gin;
-- DROP INDEX IF EXISTS idx_pedidos_numeros_compra_text;
-- DROP FUNCTION IF EXISTS search_numeros_compra(TEXT);
-- ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS check_numeros_compra_is_array;
-- ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS check_numeros_compra_max_length;
-- ALTER TABLE pedidos DROP COLUMN numeros_compra;
-- 
-- -- Recrear índices antiguos
-- CREATE INDEX idx_pedidos_numero_compra ON pedidos(numero_compra);
-- CREATE INDEX idx_pedidos_numero_compra_text ON pedidos 
-- USING gin(numero_compra gin_trgm_ops);
-- 
-- COMMIT;
--
-- =================================================================

-- =================================================================
-- EJEMPLOS DE USO
-- =================================================================
--
-- 1. Buscar pedidos por cualquier número de compra:
--    SELECT * FROM pedidos 
--    WHERE numeros_compra @> '["ABC123"]'::jsonb;
--
-- 2. Buscar con la función auxiliar:
--    SELECT * FROM pedidos 
--    WHERE id IN (SELECT pedido_id FROM search_numeros_compra('ABC'));
--
-- 3. Verificar cantidad de números de compra:
--    SELECT id, jsonb_array_length(numeros_compra) as cantidad
--    FROM pedidos;
--
-- 4. Obtener todos los números de compra de un pedido:
--    SELECT jsonb_array_elements_text(numeros_compra) as numero
--    FROM pedidos WHERE id = 'UUID';
--
-- =================================================================
