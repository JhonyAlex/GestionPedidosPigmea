-- =================================================================
-- MIGRACIÓN 045: Agregar fecha_baja a limpio.clientes
-- =================================================================
-- Descripción:
-- La tabla limpio.clientes no tenía la columna fecha_baja que usa
-- el backend para el soft-delete (archivar cliente).
-- La migración 002-fix-clientes-structure.sql la agregó solo en
-- public.clientes (tabla legacy), no en limpio.clientes.
-- =================================================================

-- Agregar columna fecha_baja si no existe
ALTER TABLE limpio.clientes 
    ADD COLUMN IF NOT EXISTS fecha_baja TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_clientes_fecha_baja ON limpio.clientes(fecha_baja);

-- Eliminar constraint de estado si existe con nombre estándar
-- (para que pueda actualizarse sin errores al intentar archivar)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clientes_estado_check'
        AND conrelid = 'limpio.clientes'::regclass
    ) THEN
        ALTER TABLE limpio.clientes DROP CONSTRAINT clientes_estado_check;
    END IF;
END $$;
