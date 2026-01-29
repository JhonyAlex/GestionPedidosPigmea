-- Migration: Add antivahoRealizado field to pedidos table
-- Description: Adds a boolean field to mark when antivaho process has been completed for orders in production
-- Author: System
-- Date: 2026-01-28
-- Modified: 2026-01-29 - Updated to use limpio.pedidos schema

-- Add the new column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'limpio' AND table_name = 'pedidos' AND column_name = 'antivaho_realizado'
    ) THEN
        ALTER TABLE limpio.pedidos ADD COLUMN antivaho_realizado BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Column antivaho_realizado added to limpio.pedidos table';
    ELSE
        RAISE NOTICE 'Column antivaho_realizado already exists';
    END IF;
END $$;

-- Create index for better query performance when filtering by antivaho status
-- Partial index: only for rows where antivaho is true and antivaho_realizado is false
CREATE INDEX IF NOT EXISTS idx_pedidos_antivaho_realizado 
ON limpio.pedidos(antivaho_realizado) 
WHERE antivaho = true AND antivaho_realizado = false;
