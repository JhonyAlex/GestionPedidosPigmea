-- =================================================================
-- MIGRACIÓN: CORRECCIÓN ESTRUCTURA TABLA CLIENTES
-- =================================================================
-- Descripción:
-- Este script corrige la discrepancia entre la estructura de la tabla
-- clientes definida en la migración 001 y lo que el código espera.
--
-- Agrega las columnas faltantes y mantiene compatibilidad con datos existentes.
-- =================================================================

-- =================================================================
-- 1. AGREGAR COLUMNAS FALTANTES
-- =================================================================

DO $$
BEGIN
    -- Agregar columna CIF si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes' 
        AND column_name = 'cif'
    ) THEN
        ALTER TABLE clientes ADD COLUMN cif VARCHAR(20);
        RAISE NOTICE 'Columna cif agregada';
    END IF;

    -- Agregar columna direccion_fiscal si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes' 
        AND column_name = 'direccion_fiscal'
    ) THEN
        ALTER TABLE clientes ADD COLUMN direccion_fiscal TEXT;
        RAISE NOTICE 'Columna direccion_fiscal agregada';
    END IF;

    -- Agregar columna codigo_postal si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes' 
        AND column_name = 'codigo_postal'
    ) THEN
        ALTER TABLE clientes ADD COLUMN codigo_postal VARCHAR(10);
        RAISE NOTICE 'Columna codigo_postal agregada';
    END IF;

    -- Agregar columna poblacion si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes' 
        AND column_name = 'poblacion'
    ) THEN
        ALTER TABLE clientes ADD COLUMN poblacion VARCHAR(100);
        RAISE NOTICE 'Columna poblacion agregada';
    END IF;

    -- Agregar columna provincia si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes' 
        AND column_name = 'provincia'
    ) THEN
        ALTER TABLE clientes ADD COLUMN provincia VARCHAR(100);
        RAISE NOTICE 'Columna provincia agregada';
    END IF;

    -- Agregar columna pais si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes' 
        AND column_name = 'pais'
    ) THEN
        ALTER TABLE clientes ADD COLUMN pais VARCHAR(100) DEFAULT 'España';
        RAISE NOTICE 'Columna pais agregada';
    END IF;

    -- Agregar columna persona_contacto si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes' 
        AND column_name = 'persona_contacto'
    ) THEN
        ALTER TABLE clientes ADD COLUMN persona_contacto VARCHAR(255);
        RAISE NOTICE 'Columna persona_contacto agregada';
    END IF;

    -- Agregar columna notas si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes' 
        AND column_name = 'notas'
    ) THEN
        ALTER TABLE clientes ADD COLUMN notas TEXT;
        RAISE NOTICE 'Columna notas agregada';
    END IF;

    -- Agregar columna fecha_baja para soft delete
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes' 
        AND column_name = 'fecha_baja'
    ) THEN
        ALTER TABLE clientes ADD COLUMN fecha_baja TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Columna fecha_baja agregada';
    END IF;
END $$;

-- =================================================================
-- 2. MIGRAR DATOS EXISTENTES A NUEVAS COLUMNAS
-- =================================================================

DO $$
BEGIN
    -- Migrar datos de direccion a direccion_fiscal si hay datos y direccion_fiscal está vacía
    UPDATE clientes 
    SET direccion_fiscal = direccion 
    WHERE direccion IS NOT NULL 
    AND direccion_fiscal IS NULL;
    
    -- Migrar datos de contacto_principal a persona_contacto si hay datos
    UPDATE clientes 
    SET persona_contacto = contacto_principal 
    WHERE contacto_principal IS NOT NULL 
    AND persona_contacto IS NULL;
    
    -- Migrar datos de comentarios a notas si hay datos
    UPDATE clientes 
    SET notas = comentarios 
    WHERE comentarios IS NOT NULL 
    AND notas IS NULL;

    RAISE NOTICE 'Datos existentes migrados a nuevas columnas';
END $$;

-- =================================================================
-- 3. ACTUALIZAR CONSTRAINT DE ESTADO PARA INCLUIR VALORES DEL CÓDIGO
-- =================================================================

DO $$
BEGIN
    -- Eliminar constraint existente de estado
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clientes_estado_check'
    ) THEN
        ALTER TABLE clientes DROP CONSTRAINT clientes_estado_check;
    END IF;

    -- Agregar nuevo constraint que incluya los valores esperados por el código
    ALTER TABLE clientes 
    ADD CONSTRAINT clientes_estado_check 
    CHECK (estado IN ('activo', 'inactivo', 'Activo', 'Inactivo', 'Archivado'));

    RAISE NOTICE 'Constraint de estado actualizado para incluir valores del código';
END $$;

-- =================================================================
-- 4. AGREGAR ÍNDICES PARA OPTIMIZACIÓN
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_clientes_cif ON clientes(cif);
CREATE INDEX IF NOT EXISTS idx_clientes_poblacion ON clientes(poblacion);
CREATE INDEX IF NOT EXISTS idx_clientes_provincia ON clientes(provincia);
CREATE INDEX IF NOT EXISTS idx_clientes_fecha_baja ON clientes(fecha_baja);

-- =================================================================
-- 5. AGREGAR COMENTARIOS A NUEVAS COLUMNAS
-- =================================================================

COMMENT ON COLUMN clientes.cif IS 'Código de Identificación Fiscal del cliente';
COMMENT ON COLUMN clientes.direccion_fiscal IS 'Dirección fiscal completa del cliente';
COMMENT ON COLUMN clientes.codigo_postal IS 'Código postal de la dirección';
COMMENT ON COLUMN clientes.poblacion IS 'Ciudad o población del cliente';
COMMENT ON COLUMN clientes.provincia IS 'Provincia del cliente';
COMMENT ON COLUMN clientes.pais IS 'País del cliente';
COMMENT ON COLUMN clientes.persona_contacto IS 'Nombre de la persona de contacto';
COMMENT ON COLUMN clientes.notas IS 'Notas internas sobre el cliente';
COMMENT ON COLUMN clientes.fecha_baja IS 'Fecha de baja del cliente (soft delete)';

-- =================================================================
-- 6. PERMISOS
-- =================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pigmea_user') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE clientes TO pigmea_user;
        RAISE NOTICE 'Permisos actualizados para pigmea_user';
    END IF;
END $$;

-- =================================================================
-- FIN DE LA MIGRACIÓN
-- =================================================================