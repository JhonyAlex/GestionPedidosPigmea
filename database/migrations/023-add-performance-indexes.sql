-- Migración 018: Agregar índices para optimización de consultas
-- Fecha: 2025-11-06
-- Descripción: Mejora el rendimiento de búsquedas y filtros en pedidos

-- 1. Índice para búsqueda por numeroPedidoCliente (muy común)
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_cliente 
ON pedidos((data->>'numeroPedidoCliente'));

-- 2. Índice para búsqueda por nombre de cliente
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente 
ON pedidos((data->>'cliente'));

-- 3. Índice para filtro por etapaActual
CREATE INDEX IF NOT EXISTS idx_pedidos_etapa 
ON pedidos((data->>'etapaActual'));

-- 4. Índice compuesto: etapaActual + fechaEntrega (consultas Kanban)
CREATE INDEX IF NOT EXISTS idx_pedidos_etapa_fecha 
ON pedidos((data->>'etapaActual'), (data->>'fechaEntrega'));

-- 5. Índice para ordenamiento por secuencia (más rápido)
CREATE INDEX IF NOT EXISTS idx_pedidos_secuencia 
ON pedidos(secuencia_pedido DESC);

-- 6. Índice para búsqueda full-text en números de compra (GIN permite búsquedas en arrays JSON)
CREATE INDEX IF NOT EXISTS idx_pedidos_numeros_compra_gin 
ON pedidos USING gin((data->'numerosCompra'));

-- 7. Índice para clienteId (comentado - la columna cliente_id no existe, datos en JSONB)
-- CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id 
-- ON pedidos(cliente_id);

-- 8. Índice para vendedorId (comentado - la columna vendedor_id no existe, datos en JSONB)
-- CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor_id 
-- ON pedidos(vendedor_id);

-- 9. Índice para fechas de entrega (consultas de rangos)
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_entrega 
ON pedidos((data->>'fechaEntrega'));

DO $$ 
BEGIN
    RAISE NOTICE '✅ Índices de rendimiento creados exitosamente.';
END $$;
