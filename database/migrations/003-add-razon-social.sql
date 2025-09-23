-- =================================================================
-- MIGRACIÓN: AGREGAR COLUMNA RAZON_SOCIAL
-- =================================================================
-- Agrega la columna razon_social que el frontend está enviando
-- pero no existe en la tabla clientes

DO $$
BEGIN
    -- Agregar columna razon_social si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes' 
        AND column_name = 'razon_social'
    ) THEN
        ALTER TABLE clientes ADD COLUMN razon_social VARCHAR(255);
        RAISE NOTICE 'Columna razon_social agregada';
    ELSE
        RAISE NOTICE 'Columna razon_social ya existe';
    END IF;
END $$;

-- Agregar índice para optimización
CREATE INDEX IF NOT EXISTS idx_clientes_razon_social ON clientes(razon_social);

-- Agregar comentario
COMMENT ON COLUMN clientes.razon_social IS 'Razón social de la empresa/cliente';

-- Actualizar permisos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pigmea_user') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE clientes TO pigmea_user;
        RAISE NOTICE 'Permisos actualizados para pigmea_user';
    END IF;
END $$;