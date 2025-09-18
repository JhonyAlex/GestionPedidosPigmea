-- =================================================================
-- MIGRACIÓN: SISTEMA DE CLIENTES
-- =================================================================
-- Descripción:
-- Este script introduce la tabla `clientes` y migra los datos
-- existentes desde la tabla `pedidos`.
--
-- Features:
-- 1. Creación de la tabla `clientes` con sus columnas y restricciones.
-- 2. Índices para optimización de búsquedas por nombre, estado y fecha.
-- 3. Trigger para actualizar automáticamente el campo `updated_at`.
-- 4. Modificación de la tabla `pedidos` para añadir `cliente_id`.
-- 5. Migración de datos de clientes desde el campo `pedidos.cliente`.
-- 6. Creación de una función de estadísticas de clientes.
-- 7. Asignación de permisos al rol de la aplicación.
-- =================================================================

-- Habilitar la extensión para generar UUIDs si no está presente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 1. CREACIÓN DE LA TABLA `clientes`
-- =================================================================
-- Esta tabla almacenará la información de los clientes.

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    contacto_principal VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255) CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    direccion TEXT,
    comentarios TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_clientes_nombre UNIQUE (nombre)
);

COMMENT ON TABLE clientes IS 'Tabla para almacenar información de los clientes de Pigmea.';
COMMENT ON COLUMN clientes.id IS 'Identificador único del cliente (UUID).';
COMMENT ON COLUMN clientes.nombre IS 'Nombre completo o razón social del cliente.';
COMMENT ON COLUMN clientes.contacto_principal IS 'Nombre de la persona de contacto principal.';
COMMENT ON COLUMN clientes.telefono IS 'Número de teléfono de contacto.';
COMMENT ON COLUMN clientes.email IS 'Correo electrónico de contacto, debe ser válido.';
COMMENT ON COLUMN clientes.direccion IS 'Dirección física o fiscal del cliente.';
COMMENT ON COLUMN clientes.comentarios IS 'Notas o comentarios internos sobre el cliente.';
COMMENT ON COLUMN clientes.estado IS 'Estado del cliente, puede ser "activo" or "inactivo".';
COMMENT ON COLUMN clientes.created_at IS 'Fecha y hora de creación del registro.';
COMMENT ON COLUMN clientes.updated_at IS 'Fecha y hora de la última actualización del registro.';

-- =================================================================
-- 2. ÍNDICES PARA OPTIMIZACIÓN
-- =================================================================
-- Se crean índices para mejorar el rendimiento de las consultas.

CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON clientes(created_at);

-- =================================================================
-- 3. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE `updated_at`
-- =================================================================
-- Se asume que la función `update_modified_column()` ya existe
-- en la base de datos (creada por `create_user_permissions_table.sql`).

CREATE TRIGGER trigger_update_clientes_updated_at
BEFORE UPDATE ON clientes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

COMMENT ON TRIGGER trigger_update_clientes_updated_at ON clientes IS 'Actualiza el campo updated_at cada vez que se modifica una fila en la tabla clientes.';

-- =================================================================
-- 4. MODIFICACIÓN DE LA TABLA `pedidos`
-- =================================================================
-- Se añade la columna `cliente_id` para relacionar los pedidos
-- con la nueva tabla `clientes`.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'pedidos'
        AND column_name = 'cliente_id'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN cliente_id UUID;

        ALTER TABLE pedidos
        ADD CONSTRAINT fk_pedidos_cliente_id
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE SET NULL; -- Si se borra un cliente, el pedido no se borra, solo se desvincula.

        COMMENT ON COLUMN pedidos.cliente_id IS 'Referencia al cliente asociado a este pedido.';
    END IF;
END $$;

-- =================================================================
-- 5. MIGRACIÓN DE DATOS EXISTENTES
-- =================================================================
-- Se extraen los nombres de clientes únicos de la tabla `pedidos`,
-- se insertan en `clientes` y se actualiza `pedidos.cliente_id`.

DO $$
DECLARE
    v_migrated_count INTEGER := 0;
BEGIN
    -- Paso 1: Insertar clientes únicos desde la tabla `pedidos`
    -- Se ignoran los clientes con nombres nulos, vacíos o que ya existen en la tabla `clientes`.
    INSERT INTO clientes (nombre, comentarios)
    SELECT DISTINCT
        TRIM(cliente) AS nombre,
        'Cliente migrado automáticamente desde pedidos.' AS comentarios
    FROM pedidos
    WHERE
        cliente IS NOT NULL
        AND TRIM(cliente) <> ''
    ON CONFLICT (nombre) DO NOTHING;

    GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
    RAISE NOTICE 'Se han migrado % nuevos clientes desde la tabla de pedidos.', v_migrated_count;

    -- Paso 2: Actualizar la columna `cliente_id` en la tabla `pedidos`
    -- Se enlaza cada pedido con su correspondiente cliente en la nueva tabla.
    UPDATE pedidos p
    SET cliente_id = c.id
    FROM clientes c
    WHERE TRIM(p.cliente) = c.nombre
    AND p.cliente_id IS NULL; -- Solo actualizar los que no han sido enlazados aún.

    RAISE NOTICE 'Se han actualizado las referencias de cliente_id en la tabla de pedidos.';
END $$;

-- =================================================================
-- 6. FUNCIÓN DE ESTADÍSTICAS
-- =================================================================
-- Función para obtener un resumen de las estadísticas de clientes.

CREATE OR REPLACE FUNCTION obtener_estadisticas_clientes()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_clientes', (SELECT COUNT(*) FROM clientes),
        'clientes_activos', (SELECT COUNT(*) FROM clientes WHERE estado = 'activo'),
        'clientes_inactivos', (SELECT COUNT(*) FROM clientes WHERE estado = 'inactivo'),
        'ultimo_cliente_creado', (SELECT MAX(created_at) FROM clientes)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_estadisticas_clientes() IS 'Devuelve un JSON con estadísticas clave sobre la tabla de clientes.';

-- =================================================================
-- 7. PERMISOS
-- =================================================================
-- Se otorgan los permisos necesarios al rol de la aplicación para
-- que pueda interactuar con los nuevos objetos de la base de datos.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pigmea_user') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE clientes TO pigmea_user;
        GRANT EXECUTE ON FUNCTION obtener_estadisticas_clientes() TO pigmea_user;
        RAISE NOTICE 'Permisos otorgados al rol pigmea_user.';
    ELSE
        RAISE NOTICE 'El rol pigmea_user no existe, no se otorgaron permisos. Asegúrese de que el rol de la aplicación exista.';
    END IF;
END $$;

-- =================================================================
-- FIN DE LA MIGRACIÓN
-- =================================================================
