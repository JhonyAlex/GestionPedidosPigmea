-- Crear tabla de auditoría si no existe
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- Comentarios para documentación
COMMENT ON TABLE audit_log IS 'Registro de auditoría de acciones del sistema';
COMMENT ON COLUMN audit_log.user_id IS 'ID del usuario que realizó la acción';
COMMENT ON COLUMN audit_log.action IS 'Tipo de acción realizada';
COMMENT ON COLUMN audit_log.details IS 'Detalles adicionales de la acción en formato JSON';
COMMENT ON COLUMN audit_log.resource_type IS 'Tipo de recurso afectado (opcional)';
COMMENT ON COLUMN audit_log.resource_id IS 'ID del recurso afectado (opcional)';
