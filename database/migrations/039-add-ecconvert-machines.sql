-- =================================================================
-- MIGRACIÓN 039: AGREGAR MÁQUINAS EC-CONVERT 21 Y 22
-- =================================================================
-- Descripción:
-- Esta migración agrega dos nuevas máquinas a la etapa Post-Impresión:
-- - POST_ECCONVERT_21 (Ec-convert 21)
-- - POST_ECCONVERT_22 (Ec-convert 22)
--
-- Se actualizan:
-- 1. Función calcular_estado_cliente() - reconocer nuevas etapas como producción activa
-- 2. Vista vista_cliente_pedidos_stats - incluir nuevas etapas en contadores
--
-- Fecha: 2026-02-13
-- =================================================================

-- =================================================================
-- 1. ACTUALIZAR FUNCIÓN: calcular_estado_cliente
-- =================================================================
-- Recrear la función con las nuevas etapas Ec-convert incluidas

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
        'POST_ECCONVERT_21',
        'POST_ECCONVERT_22',
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

COMMENT ON FUNCTION calcular_estado_cliente(UUID) IS 'Calcula el estado de un cliente basándose en las etapas de sus pedidos. Incluye las nuevas etapas POST_ECCONVERT_21 y POST_ECCONVERT_22.';

-- =================================================================
-- 2. ACTUALIZAR VISTA: vista_cliente_pedidos_stats
-- =================================================================
-- Recrear la vista con las nuevas etapas Ec-convert incluidas

CREATE OR REPLACE VIEW vista_cliente_pedidos_stats AS
SELECT 
    c.id as cliente_id,
    c.nombre as cliente_nombre,
    c.estado as cliente_estado,
    COUNT(CASE WHEN p.etapa_actual IN (
        'PREPARACION', 'PENDIENTE',
        'IMPRESION_WM1', 'IMPRESION_GIAVE', 'IMPRESION_WM3', 'IMPRESION_ANON',
        'POST_LAMINACION_SL2', 'POST_LAMINACION_NEXUS',
        'POST_ECCONVERT_21', 'POST_ECCONVERT_22',
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

COMMENT ON VIEW vista_cliente_pedidos_stats IS 'Vista con estadísticas de pedidos por cliente, incluyendo contadores por estado. Actualizada para incluir POST_ECCONVERT_21 y POST_ECCONVERT_22.';

-- =================================================================
-- 3. VERIFICACIÓN
-- =================================================================

-- Verificar que las funciones y vistas se crearon correctamente
DO $$
BEGIN
    -- Verificar que existe la función
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'calcular_estado_cliente'
    ) THEN
        RAISE NOTICE '✅ Función calcular_estado_cliente actualizada correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Función calcular_estado_cliente no encontrada';
    END IF;

    -- Verificar que existe la vista
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE viewname = 'vista_cliente_pedidos_stats'
    ) THEN
        RAISE NOTICE '✅ Vista vista_cliente_pedidos_stats actualizada correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Vista vista_cliente_pedidos_stats no encontrada';
    END IF;

    RAISE NOTICE '✅ Migración 039 completada: Máquinas Ec-convert 21 y 22 agregadas al sistema';
END $$;

-- =================================================================
-- FIN DE LA MIGRACIÓN
-- =================================================================
