-- Migración: 018-add-perforado-fields.sql
-- Descripción: Añadir campos microperforado y macroperforado a la tabla pedidos
-- Fecha: 2025-10-31

-- ⚠️ MIGRACIÓN IDEMPOTENTE: Solo añade columnas si NO existen
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS microperforado BOOLEAN DEFAULT FALSE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS macroperforado BOOLEAN DEFAULT FALSE;

-- Comentarios descriptivos
COMMENT ON COLUMN pedidos.microperforado IS 'Indica si el pedido requiere microperforación';
COMMENT ON COLUMN pedidos.macroperforado IS 'Indica si el pedido requiere macroperforación';
