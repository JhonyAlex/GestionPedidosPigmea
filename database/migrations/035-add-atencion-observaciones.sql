-- Migration: Add atencionObservaciones field to pedidos table
-- Description: Adds a boolean field to mark orders that require special attention to observations
-- Author: System
-- Date: 2026-01-27

-- Add the new column
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS atencion_observaciones BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN pedidos.atencion_observaciones IS 'Marca pedidos que requieren atención especial en observaciones. Cuando está activo, el indicador del pedido se muestra en rosa fuerte y el fondo de la tarjeta tiene un color rojo más intenso.';

-- Create index for better query performance when filtering by this field
CREATE INDEX IF NOT EXISTS idx_pedidos_atencion_observaciones 
ON pedidos(atencion_observaciones) 
WHERE atencion_observaciones = TRUE;
