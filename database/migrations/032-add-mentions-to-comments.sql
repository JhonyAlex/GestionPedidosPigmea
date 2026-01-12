-- ==========================================
-- Migración 032: Sistema de Menciones (@usuarios) en Comentarios
-- ==========================================
-- Descripción: Agrega soporte para mencionar usuarios en comentarios
-- Fecha: 2026-01-12
-- Autor: Sistema
-- ==========================================

-- Verificar que la tabla pedido_comments existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pedido_comments' AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'La tabla pedido_comments no existe. Ejecute primero las migraciones anteriores.';
    END IF;
END $$;

-- 1. Agregar columna para almacenar usuarios mencionados
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedido_comments' 
        AND column_name = 'mentioned_users'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE pedido_comments 
        ADD COLUMN mentioned_users JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN pedido_comments.mentioned_users IS 
        'Array JSONB de usuarios mencionados en el comentario. Formato: [{"id": "uuid", "username": "nombre"}]';
        
        RAISE NOTICE 'Columna mentioned_users agregada a pedido_comments';
    ELSE
        RAISE NOTICE 'Columna mentioned_users ya existe en pedido_comments';
    END IF;
END $$;

-- 2. Crear índice GIN para búsqueda eficiente de menciones
CREATE INDEX IF NOT EXISTS idx_pedido_comments_mentioned_users_gin 
ON pedido_comments USING gin(mentioned_users);

-- 3. Crear índice compuesto para búsquedas de comentarios donde se menciona a un usuario específico
CREATE INDEX IF NOT EXISTS idx_pedido_comments_mentions 
ON pedido_comments(pedido_id) 
WHERE mentioned_users IS NOT NULL AND jsonb_array_length(mentioned_users) > 0;

-- 4. Actualizar tabla notifications para incluir tipo 'mention'
DO $$
BEGIN
    -- Verificar que el campo type existe y actualizar valores posibles
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'type'
        AND table_schema = 'public'
    ) THEN
        -- Actualizar comentario de la columna para incluir el nuevo tipo
        COMMENT ON COLUMN notifications.type IS 
        'Tipo de notificación: success, info, warning, error, mention';
        
        RAISE NOTICE 'Tipo "mention" agregado a la documentación de notifications.type';
    END IF;
END $$;

-- 5. Crear función auxiliar para buscar comentarios donde se menciona a un usuario
CREATE OR REPLACE FUNCTION get_comments_mentioning_user(user_id_param UUID)
RETURNS TABLE(
    comment_id UUID,
    pedido_id VARCHAR(50),
    message TEXT,
    username VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.pedido_id,
        pc.message,
        pc.username,
        pc.created_at
    FROM pedido_comments pc
    WHERE pc.mentioned_users @> jsonb_build_array(
        jsonb_build_object('id', user_id_param::text)
    )
    ORDER BY pc.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_comments_mentioning_user(UUID) IS 
'Retorna todos los comentarios donde se menciona al usuario especificado';

-- 6. Validaciones finales
DO $$
DECLARE
    v_column_exists BOOLEAN;
    v_index_exists BOOLEAN;
BEGIN
    -- Verificar que la columna fue creada
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedido_comments' 
        AND column_name = 'mentioned_users'
    ) INTO v_column_exists;
    
    IF NOT v_column_exists THEN
        RAISE EXCEPTION 'ERROR: La columna mentioned_users no se creó correctamente';
    END IF;
    
    -- Verificar que el índice GIN fue creado
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'pedido_comments' 
        AND indexname = 'idx_pedido_comments_mentioned_users_gin'
    ) INTO v_index_exists;
    
    IF NOT v_index_exists THEN
        RAISE EXCEPTION 'ERROR: El índice GIN no se creó correctamente';
    END IF;
    
    RAISE NOTICE '✅ Migración 032 completada exitosamente';
    RAISE NOTICE '   - Columna mentioned_users agregada';
    RAISE NOTICE '   - Índices creados para búsqueda eficiente';
    RAISE NOTICE '   - Función auxiliar get_comments_mentioning_user() disponible';
END $$;
