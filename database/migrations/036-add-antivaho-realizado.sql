-- Migration: Add antivahoRealizado field to pedidos table
-- Description: Adds a boolean field to mark when antivaho process has been completed for orders in production
-- Author: System
-- Date: 2026-01-28

-- Add the new column
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS antivaho_realizado BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN pedidos.antivaho_realizado IS 'Marca si el proceso de antivaho ha sido completado para pedidos que están en producción. Este campo solo se utiliza cuando antivaho=true y el pedido ha salido de la etapa de PREPARACION.';

-- Create index for better query performance when filtering by antivaho status
CREATE INDEX IF NOT EXISTS idx_pedidos_antivaho_realizado 
ON pedidos(antivaho_realizado) 
WHERE antivaho = TRUE AND antivaho_realizado = FALSE;
