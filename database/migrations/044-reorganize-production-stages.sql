-- =====================================================================
-- Migración 044: Reorganizar etapas de producción
-- Agregar: POST_LAMINACION_SL2_EVO, POST_PERFORACION_MAC2
-- Eliminar: POST_REBOBINADO_TEMAC
-- =====================================================================

-- =================================================================
-- 1. LIMPIAR secuenciaTrabajo de pedidos que incluyan TEMAC en su JSON
-- =================================================================

UPDATE pedidos
SET secuencia_trabajo = (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(secuencia_trabajo) AS elem
    WHERE elem #>> '{}' != 'POST_REBOBINADO_TEMAC'
)
WHERE secuencia_trabajo::text LIKE '%POST_REBOBINADO_TEMAC%';

-- =================================================================
-- 2. ACTUALIZAR FUNCIÓN: calcular_estado_cliente
-- =================================================================

CREATE OR REPLACE FUNCTION calcular_estado_cliente(cliente_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    pedidos_activos_count INTEGER;
    estado_calculado TEXT;
BEGIN
    SELECT COUNT(*) INTO pedidos_activos_count
    FROM pedidos
    WHERE cliente_id = cliente_uuid
    AND etapa_actual IN (
        'PREPARACION',
        'PENDIENTE',
        'IMPRESION_WM1',
        'IMPRESION_GIAVE',
        'IMPRESION_WM3',
        'IMPRESION_ANON',
        'POST_LAMINACION_SL2',
        'POST_LAMINACION_NEXUS',
        'POST_LAMINACION_SL2_EVO',
        'POST_ECCONVERT_21',
        'POST_ECCONVERT_22',
        'POST_DNT',
        'POST_REBOBINADO_S2DT',
        'POST_REBOBINADO_PROSLIT',
        'POST_PERFORACION_MIC',
        'POST_PERFORACION_MAC',
        'POST_PERFORACION_MAC2'
    );

    IF pedidos_activos_count > 0 THEN
        estado_calculado := 'Activo';
    ELSE
        estado_calculado := 'Inactivo';
    END IF;

    RETURN estado_calculado;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_estado_cliente(UUID) IS 'Calcula el estado de un cliente basándose en las etapas de sus pedidos. Incluye POST_LAMINACION_SL2_EVO y POST_PERFORACION_MAC2, sin POST_REBOBINADO_TEMAC.';

-- =================================================================
-- 3. ACTUALIZAR VISTA: vista_cliente_pedidos_stats
-- =================================================================

CREATE OR REPLACE VIEW vista_cliente_pedidos_stats AS
SELECT 
    c.id as cliente_id,
    c.nombre as cliente_nombre,
    c.estado as cliente_estado,
    COUNT(CASE WHEN p.etapa_actual IN (
        'PREPARACION', 'PENDIENTE',
        'IMPRESION_WM1', 'IMPRESION_GIAVE', 'IMPRESION_WM3', 'IMPRESION_ANON',
        'POST_LAMINACION_SL2', 'POST_LAMINACION_NEXUS', 'POST_LAMINACION_SL2_EVO',
        'POST_ECCONVERT_21', 'POST_ECCONVERT_22', 'POST_DNT',
        'POST_REBOBINADO_S2DT', 'POST_REBOBINADO_PROSLIT',
        'POST_PERFORACION_MIC', 'POST_PERFORACION_MAC', 'POST_PERFORACION_MAC2'
    ) THEN 1 END) as pedidos_en_produccion,
    COUNT(CASE WHEN p.etapa_actual = 'COMPLETADO' THEN 1 END) as pedidos_completados,
    COUNT(CASE WHEN p.etapa_actual = 'ARCHIVADO' THEN 1 END) as pedidos_archivados,
    COUNT(p.id) as total_pedidos,
    MAX(p.fecha_pedido) as ultimo_pedido_fecha
FROM clientes c
LEFT JOIN pedidos p ON c.id = p.cliente_id
GROUP BY c.id, c.nombre, c.estado;

COMMENT ON VIEW vista_cliente_pedidos_stats IS 'Vista con estadísticas de pedidos por cliente. Actualizada: +SL2_EVO, +MAC2, -TEMAC.';

-- =================================================================
-- 4. VERIFICACIÓN
-- =================================================================

DO $$
BEGIN
    -- Verificar que no quedan pedidos en TEMAC
    IF EXISTS (SELECT 1 FROM pedidos WHERE etapa_actual = 'POST_REBOBINADO_TEMAC') THEN
        RAISE WARNING '⚠️ Hay pedidos con etapa_actual = POST_REBOBINADO_TEMAC. Revisar manualmente.';
    ELSE
        RAISE NOTICE '✅ No hay pedidos en POST_REBOBINADO_TEMAC';
    END IF;

    -- Verificar que no quedan secuencias con TEMAC
    IF EXISTS (SELECT 1 FROM pedidos WHERE secuencia_trabajo::text LIKE '%POST_REBOBINADO_TEMAC%') THEN
        RAISE WARNING '⚠️ Aún hay secuencias de trabajo con TEMAC. Revisar manualmente.';
    ELSE
        RAISE NOTICE '✅ Secuencias de trabajo limpias de TEMAC';
    END IF;

    RAISE NOTICE '✅ Migración 044 completada: +SL2_EVO, +MAC2, -TEMAC';
END;
$$;
