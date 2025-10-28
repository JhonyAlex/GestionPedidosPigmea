-- Migración 014: Crear tabla vendedores
-- Descripción: Crea la tabla de vendedores con estructura completa

-- Crear tabla vendedores si no existe
CREATE TABLE IF NOT EXISTS vendedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_vendedores_nombre ON vendedores(nombre);
CREATE INDEX IF NOT EXISTS idx_vendedores_activo ON vendedores(activo);
CREATE INDEX IF NOT EXISTS idx_vendedores_email ON vendedores(email);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_vendedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vendedores_updated_at ON vendedores;
CREATE TRIGGER trigger_vendedores_updated_at
    BEFORE UPDATE ON vendedores
    FOR EACH ROW
    EXECUTE FUNCTION update_vendedores_updated_at();

-- Insertar algunos vendedores de ejemplo si la tabla está vacía
INSERT INTO vendedores (nombre, email, activo)
SELECT 'Sin asignar', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM vendedores WHERE nombre = 'Sin asignar');

COMMENT ON TABLE vendedores IS 'Tabla de vendedores del sistema';
COMMENT ON COLUMN vendedores.id IS 'Identificador único del vendedor (UUID)';
COMMENT ON COLUMN vendedores.nombre IS 'Nombre completo del vendedor';
COMMENT ON COLUMN vendedores.email IS 'Email de contacto del vendedor';
COMMENT ON COLUMN vendedores.telefono IS 'Teléfono de contacto del vendedor';
COMMENT ON COLUMN vendedores.activo IS 'Indica si el vendedor está activo en el sistema';
COMMENT ON COLUMN vendedores.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN vendedores.updated_at IS 'Fecha de última actualización del registro';
