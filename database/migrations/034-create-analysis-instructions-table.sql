-- ============================================================================
-- Migration 034: Tabla para Instrucciones Personalizadas de Análisis IA
-- ============================================================================
-- Descripción: Crea tabla para almacenar instrucciones personalizadas que
--              los usuarios pueden configurar para el análisis de IA.
--              Las instrucciones se sincronizan en tiempo real para todo el equipo.
-- ============================================================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS analysis_instructions (
    id SERIAL PRIMARY KEY,
    instructions TEXT NOT NULL DEFAULT '',
    updated_by INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_analysis_instructions_updated_at 
    ON analysis_instructions(updated_at DESC);

-- Insertar primera entrada vacía si la tabla está vacía
INSERT INTO analysis_instructions (instructions, updated_by)
SELECT '', NULL
WHERE NOT EXISTS (SELECT 1 FROM analysis_instructions);

-- Comentarios de documentación
COMMENT ON TABLE analysis_instructions IS 'Almacena instrucciones personalizadas para el análisis de IA de planificación';
COMMENT ON COLUMN analysis_instructions.id IS 'ID único de la configuración';
COMMENT ON COLUMN analysis_instructions.instructions IS 'Instrucciones personalizadas en texto plano';
COMMENT ON COLUMN analysis_instructions.updated_by IS 'ID del usuario que actualizó las instrucciones';
COMMENT ON COLUMN analysis_instructions.updated_at IS 'Fecha y hora de la última actualización';
COMMENT ON COLUMN analysis_instructions.created_at IS 'Fecha y hora de creación del registro';

-- Confirmar migración
DO $$
BEGIN
    RAISE NOTICE '✅ Migración 034 completada: Tabla analysis_instructions creada';
END $$;
