-- Migración: 016-add-observaciones-material.sql
-- Descripción: Añade el campo observaciones_material para gestión mejorada de materiales

ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS observaciones_material TEXT;

-- Comentario en la columna
COMMENT ON COLUMN pedidos.observaciones_material IS 'Observaciones específicas sobre el material de suministro y compras';
