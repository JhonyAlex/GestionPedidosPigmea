-- Migración: Crear tabla de templates de observaciones
-- Fecha: 2026-01-08
-- Descripción: Sistema de comentarios rápidos reutilizables para observaciones de pedidos
-- Idempotente: Puede ejecutarse múltiples veces sin error

-- Crear tabla de templates de observaciones
CREATE TABLE IF NOT EXISTS observaciones_templates (
    id SERIAL PRIMARY KEY,
    text VARCHAR(100) NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 1 NOT NULL,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Comentarios descriptivos
COMMENT ON TABLE observaciones_templates IS 'Templates reutilizables para el campo de observaciones de pedidos';
COMMENT ON COLUMN observaciones_templates.text IS 'Texto del template (máximo 100 caracteres)';
COMMENT ON COLUMN observaciones_templates.usage_count IS 'Contador de veces que se ha usado este template';
COMMENT ON COLUMN observaciones_templates.last_used IS 'Última vez que se utilizó el template';
COMMENT ON COLUMN observaciones_templates.is_active IS 'Si el template está activo (false = eliminado por usuario)';

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_observaciones_templates_text ON observaciones_templates(text);
CREATE INDEX IF NOT EXISTS idx_observaciones_templates_active ON observaciones_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_observaciones_templates_usage ON observaciones_templates(usage_count DESC, last_used DESC) WHERE is_active = true;

-- Trigger para actualizar last_used automáticamente
CREATE OR REPLACE FUNCTION update_observaciones_templates_last_used()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.usage_count <> OLD.usage_count THEN
        NEW.last_used = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_observaciones_templates_last_used ON observaciones_templates;
CREATE TRIGGER trigger_update_observaciones_templates_last_used
    BEFORE UPDATE ON observaciones_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_observaciones_templates_last_used();
