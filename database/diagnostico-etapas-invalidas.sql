-- Script para identificar pedidos con etapas inválidas
-- Este script busca pedidos cuya etapaActual no está en la lista de etapas válidas

SELECT 
    id,
    numero_pedido_cliente,
    cliente,
    etapa_actual,
    sub_etapa_actual,
    fecha_creacion
FROM limpio.pedidos
WHERE etapa_actual NOT IN (
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
    'POST_REBOBINADO_TEMAC',
    'COMPLETADO',
    'ARCHIVADO'
)
ORDER BY fecha_creacion DESC;
