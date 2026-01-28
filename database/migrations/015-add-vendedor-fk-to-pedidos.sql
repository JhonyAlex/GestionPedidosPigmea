-- Migración 015: Añadir vendedor_id a tabla pedidos
-- Descripción: Añade la columna vendedor_id como foreign key y migra datos existentes

-- Paso 1: Añadir columna vendedor_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'vendedor_id'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN vendedor_id UUID;
    END IF;
END $$;

-- Paso 2: Migrar datos existentes del campo vendedor (string) a vendedores
-- Crear vendedores para cada nombre único existente en pedidos.vendedor
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'vendedor'
    ) THEN
        INSERT INTO vendedores (nombre, activo)
        SELECT DISTINCT TRIM(vendedor) as nombre, true
        FROM pedidos
        WHERE vendedor IS NOT NULL 
          AND TRIM(vendedor) != ''
          AND NOT EXISTS (
            SELECT 1 FROM vendedores v 
            WHERE LOWER(v.nombre) = LOWER(TRIM(pedidos.vendedor))
          )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Paso 3: Actualizar pedidos con el vendedor_id correspondiente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'vendedor'
    ) THEN
        UPDATE pedidos p
        SET vendedor_id = v.id
        FROM vendedores v
        WHERE LOWER(TRIM(p.vendedor)) = LOWER(v.nombre)
          AND p.vendedor IS NOT NULL
          AND p.vendedor != ''
          AND p.vendedor_id IS NULL;
    END IF;
END $$;

-- Paso 4: Para pedidos sin vendedor asignado, asignar "Sin asignar"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'vendedor'
    ) THEN
        UPDATE pedidos p
        SET vendedor_id = (SELECT id FROM vendedores WHERE nombre = 'Sin asignar' LIMIT 1)
        WHERE (vendedor IS NULL OR vendedor = '' OR vendedor IS NOT DISTINCT FROM NULL)
          AND vendedor_id IS NULL;
    ELSE
        UPDATE pedidos p
        SET vendedor_id = (SELECT id FROM vendedores WHERE nombre = 'Sin asignar' LIMIT 1)
        WHERE vendedor_id IS NULL;
    END IF;
END $$;

-- Paso 5: Crear foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_pedidos_vendedor'
    ) THEN
        ALTER TABLE pedidos
        ADD CONSTRAINT fk_pedidos_vendedor
        FOREIGN KEY (vendedor_id)
        REFERENCES vendedores(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Paso 6: Crear índice para mejorar el rendimiento de búsquedas
CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor_id ON pedidos(vendedor_id);

-- Paso 7: Comentar la columna antigua vendedor para indicar que está deprecada
-- NO la eliminamos todavía por seguridad, pero marcamos que ya no se debe usar
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'vendedor'
    ) THEN
        COMMENT ON COLUMN pedidos.vendedor IS 'DEPRECADO: Usar vendedor_id en su lugar. Campo legacy mantenido temporalmente para rollback si es necesario';
    END IF;
END $$;

COMMENT ON COLUMN pedidos.vendedor_id IS 'ID del vendedor asignado al pedido (FK a tabla vendedores)';

-- Verificación: Mostrar estadísticas de la migración
DO $$
DECLARE
    total_pedidos INTEGER;
    pedidos_con_vendedor INTEGER;
    vendedores_creados INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_pedidos FROM pedidos;
    SELECT COUNT(*) INTO pedidos_con_vendedor FROM pedidos WHERE vendedor_id IS NOT NULL;
    SELECT COUNT(*) INTO vendedores_creados FROM vendedores;
    
    RAISE NOTICE 'Migración completada:';
    RAISE NOTICE '- Total pedidos: %', total_pedidos;
    RAISE NOTICE '- Pedidos con vendedor asignado: %', pedidos_con_vendedor;
    RAISE NOTICE '- Total vendedores: %', vendedores_creados;
END $$;
