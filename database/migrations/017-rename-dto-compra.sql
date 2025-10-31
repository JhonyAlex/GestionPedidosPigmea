-- Migración: 017-rename-dto-compra.sql
-- Descripción: Renombrar columna dto_compra a compra_cliche para mayor claridad

-- Renombrar columna dto_compra a compra_cliche (solo si dto_compra existe)
DO $$ 
BEGIN
    -- Verificar si existe la columna dto_compra
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'dto_compra'
    ) THEN
        -- Renombrar columna
        ALTER TABLE pedidos RENAME COLUMN dto_compra TO compra_cliche;
        RAISE NOTICE 'Columna dto_compra renombrada a compra_cliche';
        
        -- Renombrar índice
        DROP INDEX IF EXISTS idx_pedidos_dto_compra;
        CREATE INDEX IF NOT EXISTS idx_pedidos_compra_cliche ON pedidos(compra_cliche);
        RAISE NOTICE 'Índice renombrado de idx_pedidos_dto_compra a idx_pedidos_compra_cliche';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'compra_cliche'
    ) THEN
        RAISE NOTICE 'Columna compra_cliche ya existe, no se requiere migración';
        -- Asegurar que el índice existe con el nombre correcto
        CREATE INDEX IF NOT EXISTS idx_pedidos_compra_cliche ON pedidos(compra_cliche);
    ELSE
        -- Si no existe ninguna de las dos, crear compra_cliche directamente
        ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS compra_cliche DATE;
        CREATE INDEX IF NOT EXISTS idx_pedidos_compra_cliche ON pedidos(compra_cliche);
        RAISE NOTICE 'Columna compra_cliche creada (dto_compra no existía)';
    END IF;
    
    -- Actualizar comentario de la columna
    COMMENT ON COLUMN pedidos.compra_cliche IS 'Fecha de Compra Cliché';
END $$;
