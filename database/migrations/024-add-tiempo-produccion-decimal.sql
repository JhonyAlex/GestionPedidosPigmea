-- Migración: 024-add-tiempo-produccion-decimal.sql
-- Descripción: Agregar campo tiempo_produccion_decimal para calcular tiempoProduccionPlanificado
-- Este campo almacena el tiempo en formato decimal (ej: 1.5 = 1h 30m)

-- Agregar columna tiempo_produccion_decimal si no existe
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS tiempo_produccion_decimal DECIMAL(10,2);

-- Agregar comentario a la columna
COMMENT ON COLUMN pedidos.tiempo_produccion_decimal IS 'Tiempo de producción en formato decimal (ej: 1.5 = 1h 30m). Se usa para calcular tiempo_produccion_planificado';

-- Crear índice para búsquedas por tiempo de producción decimal
CREATE INDEX IF NOT EXISTS idx_pedidos_tiempo_produccion_decimal 
ON pedidos(tiempo_produccion_decimal) 
WHERE tiempo_produccion_decimal IS NOT NULL;

-- Migración completada
-- NOTA: No se migran datos existentes automáticamente.
-- Los valores de tiempo_produccion_decimal se calcularán a partir de tiempo_produccion_planificado en la aplicación si es necesario.
