-- Migración: 019-add-anonimo-post-impresion.sql
-- Descripción: Añadir campo para la opción de post-impresión de pedidos anónimos
-- Fecha: 2025-10-31

-- ⚠️ MIGRACIÓN IDEMPOTENTE: Solo añade la columna si NO existe
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS anonimo_post_impresion VARCHAR(100);

-- Comentario descriptivo
COMMENT ON COLUMN pedidos.anonimo_post_impresion IS 'Opción de post-impresión para pedidos anónimos (Rebobinado, Laminación y rebobinado, etc.)';
