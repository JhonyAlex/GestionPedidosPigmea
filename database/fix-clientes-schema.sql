-- ============================================================================
-- SCRIPT DE CORRECCIÓN: Estructura de limpio.clientes
-- ============================================================================
-- Este script actualiza la tabla limpio.clientes para que coincida con
-- las expectativas del código de la aplicación.
-- ============================================================================

-- 1. RENOMBRAR COLUMNAS EXISTENTES
-- ============================================================================
ALTER TABLE limpio.clientes 
    RENAME COLUMN contacto_principal TO persona_contacto;

ALTER TABLE limpio.clientes 
    RENAME COLUMN direccion TO direccion_fiscal;

ALTER TABLE limpio.clientes 
    RENAME COLUMN comentarios TO notas;

-- 2. AGREGAR COLUMNAS FALTANTES
-- ============================================================================
ALTER TABLE limpio.clientes
    ADD COLUMN IF NOT EXISTS razon_social VARCHAR(255),
    ADD COLUMN IF NOT EXISTS cif VARCHAR(50),
    ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(20),
    ADD COLUMN IF NOT EXISTS poblacion VARCHAR(255),
    ADD COLUMN IF NOT EXISTS provincia VARCHAR(255),
    ADD COLUMN IF NOT EXISTS pais VARCHAR(100) DEFAULT 'España';

-- 3. CREAR/ACTUALIZAR VISTA EN PUBLIC PARA COMPATIBILIDAD
-- ============================================================================
DROP VIEW IF EXISTS public.clientes CASCADE;

CREATE OR REPLACE VIEW public.clientes AS 
SELECT * FROM limpio.clientes;

-- 4. OTORGAR PERMISOS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON limpio.clientes TO pigmea_user;
GRANT SELECT ON public.clientes TO pigmea_user;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
