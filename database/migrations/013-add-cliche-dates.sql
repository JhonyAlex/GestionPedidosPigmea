-- Migración: 013-add-cliche-dates.sql
-- Descripción: Agregar campos de fecha dto_compra y recepcion_cliche a la tabla pedidos

-- Agregar columna dto_compra (Dto Compra)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dto_compra DATE;

-- Agregar columna recepcion_cliche (Recepción Cliché)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS recepcion_cliche DATE;

-- Crear índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_pedidos_dto_compra ON pedidos(dto_compra);
CREATE INDEX IF NOT EXISTS idx_pedidos_recepcion_cliche ON pedidos(recepcion_cliche);

-- Comentarios para documentar las columnas
COMMENT ON COLUMN pedidos.dto_compra IS 'Fecha de Dto Compra del cliché';
COMMENT ON COLUMN pedidos.recepcion_cliche IS 'Fecha de Recepción del Cliché';
