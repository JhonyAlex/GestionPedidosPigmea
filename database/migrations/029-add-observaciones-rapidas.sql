-- Migración: Agregar campo observaciones_rapidas a pedidos
-- Fecha: 2026-01-08
-- Descripción: Campo para almacenar observaciones rápidas/etiquetas seleccionadas
-- Idempotente: Puede ejecutarse múltiples veces sin error

-- Agregar columna observaciones_rapidas
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS observaciones_rapidas TEXT;

-- Comentario descriptivo
COMMENT ON COLUMN pedidos.observaciones_rapidas IS 'Observaciones rápidas seleccionadas desde templates, separadas por " | "';
