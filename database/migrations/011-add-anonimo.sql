-- Migración: Agregar columna anonimo a la tabla pedidos
-- Fecha: 2025-10-28
-- Descripción: Agrega un campo booleano para marcar pedidos como anónimos

-- Agregar columna anonimo
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS anonimo BOOLEAN DEFAULT false;

-- Crear índice para mejorar el rendimiento de las consultas por anonimo
CREATE INDEX IF NOT EXISTS idx_pedidos_anonimo ON pedidos(anonimo);

-- Comentario de la columna
COMMENT ON COLUMN pedidos.anonimo IS 'Indica si el pedido es anónimo';
