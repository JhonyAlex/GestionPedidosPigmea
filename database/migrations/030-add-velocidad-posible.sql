-- Migración: 030-add-velocidad-posible.sql
-- Descripción: Agregar campo velocidad_posible para cálculo bidireccional con tiempo_produccion_decimal
-- Este campo almacena la velocidad en metros/minuto (máximo 3 dígitos)

-- Agregar columna velocidad_posible si no existe
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS velocidad_posible INTEGER;

-- Agregar constraint para validar máximo 3 dígitos (valores entre 0 y 999)
ALTER TABLE pedidos
ADD CONSTRAINT check_velocidad_posible_range 
CHECK (velocidad_posible IS NULL OR (velocidad_posible >= 0 AND velocidad_posible <= 999));

-- Agregar comentario a la columna
COMMENT ON COLUMN pedidos.velocidad_posible IS 'Velocidad posible en metros/minuto (máx 3 dígitos). Se usa para calcular tiempo_produccion_decimal bidireccionalmente';

-- Crear índice para búsquedas por velocidad posible
CREATE INDEX IF NOT EXISTS idx_pedidos_velocidad_posible 
ON pedidos(velocidad_posible) 
WHERE velocidad_posible IS NOT NULL;

-- Migración completada
-- NOTA: No se migran datos existentes automáticamente.
-- Los valores de velocidad_posible se calcularán en la aplicación según sea necesario.
