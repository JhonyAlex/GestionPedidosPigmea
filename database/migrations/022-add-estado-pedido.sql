-- Migración 017: Agregar campo 'estado' para gestión de archivado
-- Fecha: 2025-11-06
-- Descripción: Permite clasificar pedidos como ACTIVO, INACTIVO o ARCHIVADO para optimizar consultas

-- 1. Agregar columna estado (si no existe)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'ACTIVO';

-- 2. Crear índice para búsquedas rápidas por estado
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);

-- 3. Crear índice compuesto para fecha_entrega + estado (consultas más eficientes)
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_entrega_estado ON pedidos((data->>'fechaEntrega'), estado);

-- 4. Actualizar pedidos existentes según su etapa actual
DO $$ 
BEGIN
    -- Marcar pedidos archivados
    UPDATE pedidos 
    SET estado = 'ARCHIVADO' 
    WHERE data->>'etapaActual' = 'ARCHIVADO' 
      AND estado = 'ACTIVO';

    -- Marcar pedidos completados antiguos (>2 meses) como INACTIVO
    UPDATE pedidos 
    SET estado = 'INACTIVO' 
    WHERE data->>'etapaActual' = 'COMPLETADO' 
      AND (data->>'fechaEntrega')::date < CURRENT_DATE - INTERVAL '2 months'
      AND estado = 'ACTIVO';
      
    RAISE NOTICE 'Estado de pedidos actualizado correctamente.';
END $$;

-- 5. Comentarios para documentación
COMMENT ON COLUMN pedidos.estado IS 'Estado del pedido: ACTIVO (en proceso), INACTIVO (completado hace >2 meses), ARCHIVADO (manualmente archivado)';
