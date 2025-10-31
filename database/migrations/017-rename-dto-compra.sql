-- Migración: 017-rename-dto-compra.sql
-- Descripción: Renombrar columna dto_compra a compra_cliche para mayor claridad

-- Renombrar columna dto_compra a compra_cliche
ALTER TABLE pedidos RENAME COLUMN dto_compra TO compra_cliche;

-- Renombrar índice
DROP INDEX IF EXISTS idx_pedidos_dto_compra;
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_cliche ON pedidos(compra_cliche);

-- Actualizar comentario de la columna
COMMENT ON COLUMN pedidos.compra_cliche IS 'Fecha de Compra Cliché';
