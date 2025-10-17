-- Migración para agregar el campo nueva_fecha_entrega a la tabla pedidos
-- Este campo permite tener una fecha de entrega alternativa o actualizada

-- Agregar la columna nueva_fecha_entrega
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS nueva_fecha_entrega TIMESTAMP;

-- Crear índice para mejorar el rendimiento de consultas filtradas por esta fecha
CREATE INDEX IF NOT EXISTS idx_pedidos_nueva_fecha_entrega ON pedidos(nueva_fecha_entrega);

-- Comentario descriptivo de la columna
COMMENT ON COLUMN pedidos.nueva_fecha_entrega IS 'Fecha de entrega alternativa o actualizada del pedido';
