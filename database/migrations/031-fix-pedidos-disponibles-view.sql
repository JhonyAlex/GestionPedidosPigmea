-- Migración 031: Arreglar vista v_pedidos_disponibles_produccion
-- Cambiar filtrado de etapas de valores genéricos ('IMPRESION', 'POST_IMPRESION')
-- a valores específicos del enum Etapa (IMPRESION_WM1, POST_LAMINACION_SL2, etc.)

-- Eliminar vista existente
DROP VIEW IF EXISTS v_pedidos_disponibles_produccion;

-- Recrear vista con filtrado correcto de etapas
CREATE OR REPLACE VIEW v_pedidos_disponibles_produccion AS
SELECT 
    p.id,
    p.numero_pedido_cliente,
    p.cliente,
    p.etapa_actual,
    p.data->>'subEtapaActual' AS sub_etapa_actual,
    -- Extraer metros del campo JSONB data
    CAST(p.data->>'metros' AS NUMERIC(10,2)) AS metros,
    p.metros_producidos,
    p.metros_restantes,
    p.porcentaje_completado,
    p.data->>'producto' AS producto,
    p.data->>'colores' AS colores,
    p.fecha_entrega,
    p.prioridad,
    p.observaciones,
    p.data->>'tiempoProduccionPlanificado' AS tiempo_produccion_planificado
FROM pedidos p
WHERE 
    -- Filtrar por etapas de producción válidas (impresión y post-impresión)
    (
        p.etapa_actual LIKE 'IMPRESION_%' OR 
        p.etapa_actual LIKE 'POST_%'
    )
    -- Solo pedidos sin operador asignado
    AND p.operador_actual_id IS NULL
    -- Solo pedidos activos
    AND (p.estado IS NULL OR UPPER(p.estado) = 'ACTIVO')
ORDER BY 
    -- Ordenar por prioridad
    CASE p.prioridad 
        WHEN 'ALTA' THEN 1
        WHEN 'MEDIA' THEN 2
        WHEN 'BAJA' THEN 3
        ELSE 4
    END,
    -- Luego por fecha de entrega
    p.fecha_entrega ASC NULLS LAST;
