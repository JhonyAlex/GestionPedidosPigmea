-- Migration 038: Create PDF Import Configs table
-- Para almacenar configuraciones de mapeo de campos al importar PDFs

-- Crear tabla de configuraciones de importación PDF
CREATE TABLE IF NOT EXISTS limpio.pdf_import_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    -- Reglas de extracción: JSON con patrones para cada campo
    -- Formato: { "fieldName": { "type": "regex|delimiter|position", "pattern": "...", "startMarker": "...", "endMarker": "..." } }
    extraction_rules JSONB NOT NULL DEFAULT '{}',
    -- Mapeo de campos extraídos a campos del sistema
    -- Formato: { "extractedField": "systemField" }
    field_mappings JSONB NOT NULL DEFAULT '{}',
    -- Cliente asociado (opcional, para configuraciones específicas de cliente)
    cliente_id UUID REFERENCES limpio.clientes(id) ON DELETE SET NULL,
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    is_active BOOLEAN DEFAULT true,
    -- Estadísticas de uso
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_pdf_import_configs_name ON limpio.pdf_import_configs(name);
CREATE INDEX IF NOT EXISTS idx_pdf_import_configs_cliente ON limpio.pdf_import_configs(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pdf_import_configs_active ON limpio.pdf_import_configs(is_active);

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_pdf_import_configs_modified ON limpio.pdf_import_configs;
CREATE TRIGGER update_pdf_import_configs_modified
    BEFORE UPDATE ON limpio.pdf_import_configs
    FOR EACH ROW
    EXECUTE FUNCTION limpio.update_modified_column();

-- Comentarios de documentación
COMMENT ON TABLE limpio.pdf_import_configs IS 'Configuraciones de mapeo para importación de pedidos desde PDF';
COMMENT ON COLUMN limpio.pdf_import_configs.extraction_rules IS 'Reglas JSON para extraer campos del texto del PDF (regex, delimitadores, posiciones)';
COMMENT ON COLUMN limpio.pdf_import_configs.field_mappings IS 'Mapeo de campos extraídos a campos del sistema de pedidos';
