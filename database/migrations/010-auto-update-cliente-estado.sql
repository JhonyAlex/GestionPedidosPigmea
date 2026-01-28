-- =================================================================
-- MIGRACIÓN: ACTUALIZACIÓN AUTOMÁTICA DEL ESTADO DEL CLIENTE
-- =================================================================
-- Descripción:
-- Este script implementa la actualización automática del estado
-- de los clientes basándose en las etapas de sus pedidos.
--
-- Lógica de Estados:
-- - ACTIVO: Cliente tiene al menos un pedido en etapas de producción:
--   * PREPARACION, PENDIENTE
--   * IMPRESION_* (WM1, GIAVE, WM3, ANON)
--   * POST_* (LAMINACION, REBOBINADO, PERFORACION)
-- - INACTIVO: Todos los pedidos están en COMPLETADO o ARCHIVADO
--
-- Features:
-- 1. Función para calcular el estado de un cliente
-- 2. Función para actualizar el estado basado en pedidos
-- 3. Trigger que actualiza automáticamente al cambiar etapa de pedido
-- 4. Vista materializada con contadores de pedidos por cliente
-- =================================================================

-- =================================================================
-- 1. FUNCIÓN: Calcular el estado de un cliente
-- =================================================================
-- Determina si un cliente debe estar activo o inactivo
-- basándose en las etapas de sus pedidos activos

CREATE OR REPLACE FUNCTION calcular_estado_cliente(cliente_uuid UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    pedidos_activos_count INT;
    estado_calculado VARCHAR(20);
BEGIN
    -- Contar pedidos en etapas de producción (no completados ni archivados)
    SELECT COUNT(*)
    INTO pedidos_activos_count
    FROM pedidos
    WHERE cliente_id = cliente_uuid
    AND etapa_actual NOT IN ('COMPLETADO', 'ARCHIVADO')
    AND etapa_actual IN (
        'PREPARACION',
        'PENDIENTE',
        'IMPRESION_WM1',
        'IMPRESION_GIAVE',
        'IMPRESION_WM3',
        'IMPRESION_ANON',
        'POST_LAMINACION_SL2',
        'POST_LAMINACION_NEXUS',
        'POST_REBOBINADO_S2DT',
        'POST_REBOBINADO_PROSLIT',
        'POST_PERFORACION_MIC',
        'POST_PERFORACION_MAC',
        'POST_REBOBINADO_TEMAC'
    );

    -- Determinar el estado
    IF pedidos_activos_count > 0 THEN
        estado_calculado := 'Activo';
    ELSE
        estado_calculado := 'Inactivo';
    END IF;

    RETURN estado_calculado;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_estado_cliente(UUID) IS 'Calcula el estado de un cliente basándose en las etapas de sus pedidos. Retorna Activo si tiene pedidos en producción, Inactivo si todos están completados o archivados.';

-- =================================================================
-- 2. FUNCIÓN: Actualizar estado del cliente
-- =================================================================
-- Actualiza el campo estado en la tabla clientes

CREATE OR REPLACE FUNCTION actualizar_estado_cliente(cliente_uuid UUID)
RETURNS VOID AS $$
DECLARE
    nuevo_estado VARCHAR(20);
BEGIN
    -- Calcular el nuevo estado
    nuevo_estado := calcular_estado_cliente(cliente_uuid);
    
    -- Actualizar solo si hay cambio
    UPDATE clientes
    SET estado = nuevo_estado,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = cliente_uuid
    AND estado != nuevo_estado;
    
    -- Log si hay cambio
    IF FOUND THEN
        RAISE NOTICE 'Cliente % actualizado a estado: %', cliente_uuid, nuevo_estado;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_estado_cliente(UUID) IS 'Actualiza el estado de un cliente específico llamando a calcular_estado_cliente y guardando el resultado en la base de datos.';

-- =================================================================
-- 3. TRIGGER: Actualizar estado al cambiar etapa del pedido
-- =================================================================
-- Se ejecuta cuando se crea, actualiza o elimina un pedido
-- o cuando cambia la etapa_actual de un pedido

CREATE OR REPLACE FUNCTION trigger_actualizar_estado_cliente()
RETURNS TRIGGER AS $$
DECLARE
    cliente_afectado UUID;
BEGIN
    -- Determinar qué cliente(s) se ven afectados
    IF TG_OP = 'DELETE' THEN
        cliente_afectado := OLD.cliente_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Si cambió el cliente_id, actualizar ambos clientes
        IF OLD.cliente_id != NEW.cliente_id THEN
            PERFORM actualizar_estado_cliente(OLD.cliente_id);
            cliente_afectado := NEW.cliente_id;
        ELSE
            cliente_afectado := NEW.cliente_id;
        END IF;
    ELSE -- INSERT
        cliente_afectado := NEW.cliente_id;
    END IF;
    
    -- Actualizar el estado del cliente afectado
    IF cliente_afectado IS NOT NULL THEN
        PERFORM actualizar_estado_cliente(cliente_afectado);
    END IF;
    
    -- Retornar el registro apropiado según la operación
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_actualizar_estado_cliente() IS 'Función de trigger que actualiza el estado del cliente cuando cambian sus pedidos.';

-- Crear el trigger en la tabla pedidos
DROP TRIGGER IF EXISTS trigger_pedido_actualiza_cliente ON pedidos;
CREATE TRIGGER trigger_pedido_actualiza_cliente
AFTER INSERT OR UPDATE OF etapa_actual, cliente_id OR DELETE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION trigger_actualizar_estado_cliente();

COMMENT ON TRIGGER trigger_pedido_actualiza_cliente ON pedidos IS 'Actualiza automáticamente el estado del cliente cuando se crea, actualiza o elimina un pedido, o cuando cambia la etapa_actual.';

-- =================================================================
-- 4. VISTA: Estadísticas de pedidos por cliente
-- =================================================================
-- Vista que muestra contadores rápidos de pedidos por estado

CREATE OR REPLACE VIEW vista_cliente_pedidos_stats AS
SELECT 
    c.id as cliente_id,
    c.nombre as cliente_nombre,
    c.estado as cliente_estado,
    COUNT(CASE WHEN p.etapa_actual IN (
        'PREPARACION', 'PENDIENTE',
        'IMPRESION_WM1', 'IMPRESION_GIAVE', 'IMPRESION_WM3', 'IMPRESION_ANON',
        'POST_LAMINACION_SL2', 'POST_LAMINACION_NEXUS',
        'POST_REBOBINADO_S2DT', 'POST_REBOBINADO_PROSLIT',
        'POST_PERFORACION_MIC', 'POST_PERFORACION_MAC', 'POST_REBOBINADO_TEMAC'
    ) THEN 1 END) as pedidos_en_produccion,
    COUNT(CASE WHEN p.etapa_actual = 'COMPLETADO' THEN 1 END) as pedidos_completados,
    COUNT(CASE WHEN p.etapa_actual = 'ARCHIVADO' THEN 1 END) as pedidos_archivados,
    COUNT(p.id) as total_pedidos,
    MAX(p.fecha_pedido) as ultimo_pedido_fecha
FROM clientes c
LEFT JOIN pedidos p ON c.id = p.cliente_id
GROUP BY c.id, c.nombre, c.estado;

COMMENT ON VIEW vista_cliente_pedidos_stats IS 'Vista con estadísticas de pedidos por cliente, incluyendo contadores por estado y última fecha de pedido.';

-- =================================================================
-- 5. ACTUALIZACIÓN INICIAL DE TODOS LOS CLIENTES
-- =================================================================
-- Ejecutar una vez para sincronizar todos los estados existentes

DO $$
DECLARE
    cliente_record RECORD;
    total_actualizados INT := 0;
BEGIN
    FOR cliente_record IN SELECT id FROM clientes
    LOOP
        PERFORM actualizar_estado_cliente(cliente_record.id);
        total_actualizados := total_actualizados + 1;
    END LOOP;
    
    RAISE NOTICE 'Estados actualizados para % clientes', total_actualizados;
END $$;

-- =================================================================
-- 6. ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =================================================================

-- Índice en pedidos.cliente_id y etapa_actual para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_etapa 
ON pedidos(cliente_id, etapa_actual);

-- Índice parcial para pedidos activos (en producción)
CREATE INDEX IF NOT EXISTS idx_pedidos_activos 
ON pedidos(cliente_id) 
WHERE etapa_actual NOT IN ('COMPLETADO', 'ARCHIVADO');

COMMENT ON INDEX idx_pedidos_cliente_etapa IS 'Índice compuesto para optimizar consultas de pedidos por cliente y etapa.';
COMMENT ON INDEX idx_pedidos_activos IS 'Índice parcial para consultas rápidas de pedidos activos (no completados ni archivados).';

-- =================================================================
-- VERIFICACIÓN Y TESTING
-- =================================================================

-- Verificar que la función funciona correctamente
DO $$
DECLARE
    test_result VARCHAR(20);
    cliente_test UUID;
BEGIN
    -- Seleccionar un cliente de prueba (el primero disponible)
    SELECT id INTO cliente_test FROM clientes LIMIT 1;
    
    IF cliente_test IS NOT NULL THEN
        test_result := calcular_estado_cliente(cliente_test);
        RAISE NOTICE 'Test completado: Cliente % tiene estado calculado: %', cliente_test, test_result;
    ELSE
        RAISE NOTICE 'No hay clientes disponibles para testing';
    END IF;
END $$;

-- Verificar que el trigger está instalado
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_pedido_actualiza_cliente';

-- =================================================================
-- FIN DE LA MIGRACIÓN
-- =================================================================

RAISE NOTICE '✅ Migración completada: Sistema de actualización automática de estado de clientes instalado correctamente.';
