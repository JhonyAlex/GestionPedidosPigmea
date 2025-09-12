-- Migración: Crear tabla clientes y actualizar referencias
-- Fecha: 2025-09-12
-- Descripción: Agregar sistema de clientes con creación automática y estadísticas sincronizadas

-- 1. Crear tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    contacto VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(50),
    ciudad VARCHAR(100),
    direccion TEXT,
    pais VARCHAR(100) DEFAULT 'España',
    codigo_postal VARCHAR(20),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    notas TEXT,
    
    -- Campos calculados/estadísticas (se actualizarán automáticamente)
    total_pedidos INTEGER DEFAULT 0,
    pedidos_activos INTEGER DEFAULT 0,
    volumen_total DECIMAL(10,2) DEFAULT 0,
    monto_total DECIMAL(12,2) DEFAULT 0,
    productos_mas_solicitados JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);
CREATE INDEX IF NOT EXISTS idx_clientes_ciudad ON clientes(ciudad);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_ultima_actividad ON clientes(ultima_actividad);

-- 3. Crear función para actualizar timestamp de modificación
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Crear función para recalcular estadísticas de cliente
CREATE OR REPLACE FUNCTION recalcular_estadisticas_cliente(cliente_nombre VARCHAR)
RETURNS VOID AS $$
DECLARE
    stats_record RECORD;
BEGIN
    -- Calcular estadísticas desde pedidos
    SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN etapa_actual NOT IN ('COMPLETADO', 'ARCHIVADO') THEN 1 END) as pedidos_activos,
        COALESCE(SUM(CASE WHEN metros ~ '^[0-9]+(\.[0-9]+)?$' THEN metros::DECIMAL ELSE 0 END), 0) as volumen_total
    INTO stats_record
    FROM pedidos 
    WHERE cliente = cliente_nombre;
    
    -- Actualizar estadísticas en tabla clientes
    UPDATE clientes 
    SET 
        total_pedidos = stats_record.total_pedidos,
        pedidos_activos = stats_record.pedidos_activos,
        volumen_total = stats_record.volumen_total,
        ultima_actividad = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE nombre = cliente_nombre;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear función que se ejecuta cuando se modifica un pedido
CREATE OR REPLACE FUNCTION actualizar_cliente_por_pedido()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se crea un nuevo pedido
    IF TG_OP = 'INSERT' THEN
        -- Crear cliente si no existe
        INSERT INTO clientes (nombre)
        VALUES (NEW.cliente)
        ON CONFLICT (nombre) DO NOTHING;
        
        -- Recalcular estadísticas
        PERFORM recalcular_estadisticas_cliente(NEW.cliente);
        
        RETURN NEW;
    END IF;
    
    -- Si se actualiza un pedido
    IF TG_OP = 'UPDATE' THEN
        -- Recalcular estadísticas del cliente actual
        PERFORM recalcular_estadisticas_cliente(NEW.cliente);
        
        -- Si cambió el cliente, recalcular también el anterior
        IF OLD.cliente != NEW.cliente THEN
            PERFORM recalcular_estadisticas_cliente(OLD.cliente);
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Si se elimina un pedido
    IF TG_OP = 'DELETE' THEN
        -- Recalcular estadísticas del cliente
        PERFORM recalcular_estadisticas_cliente(OLD.cliente);
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger para mantener estadísticas actualizadas
DROP TRIGGER IF EXISTS trigger_actualizar_cliente_por_pedido ON pedidos;
CREATE TRIGGER trigger_actualizar_cliente_por_pedido
    AFTER INSERT OR UPDATE OR DELETE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_cliente_por_pedido();

-- 8. Migrar clientes existentes desde pedidos
INSERT INTO clientes (nombre)
SELECT DISTINCT cliente 
FROM pedidos 
WHERE cliente IS NOT NULL 
AND cliente != ''
ON CONFLICT (nombre) DO NOTHING;

-- 9. Recalcular estadísticas para todos los clientes existentes
DO $$
DECLARE
    cliente_record RECORD;
BEGIN
    FOR cliente_record IN SELECT nombre FROM clientes LOOP
        PERFORM recalcular_estadisticas_cliente(cliente_record.nombre);
    END LOOP;
END $$;

-- 10. Comentarios para documentación
COMMENT ON TABLE clientes IS 'Tabla de clientes con creación automática y estadísticas sincronizadas';
COMMENT ON COLUMN clientes.total_pedidos IS 'Calculado automáticamente desde tabla pedidos';
COMMENT ON COLUMN clientes.pedidos_activos IS 'Pedidos no completados ni archivados';
COMMENT ON COLUMN clientes.volumen_total IS 'Suma total de metros de todos los pedidos';
COMMENT ON FUNCTION recalcular_estadisticas_cliente(VARCHAR) IS 'Recalcula estadísticas de cliente basadas en pedidos';
COMMENT ON FUNCTION actualizar_cliente_por_pedido() IS 'Mantiene sincronizadas las estadísticas al modificar pedidos';

-- Verificación final
SELECT 'Migración completada. Clientes creados: ' || COUNT(*) as resultado FROM clientes;