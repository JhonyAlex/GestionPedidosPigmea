-- Migración 020: Crear tabla de historial para clientes
-- Fecha: 2025-11-03
-- Descripción: Tabla para auditar todos los cambios en clientes

-- Crear tabla de historial de clientes (idempotente)
CREATE TABLE IF NOT EXISTS clientes_history (
    id SERIAL PRIMARY KEY,
    cliente_id UUID NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(255) NOT NULL,
    user_role VARCHAR(50),
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'restored'
    field_name VARCHAR(100), -- Nombre del campo modificado (NULL para 'created')
    old_value TEXT, -- Valor anterior (JSON para campos complejos)
    new_value TEXT, -- Valor nuevo (JSON para campos complejos)
    details TEXT, -- Detalles adicionales del cambio
    ip_address INET, -- IP del usuario (opcional)
    user_agent TEXT -- User agent (opcional)
);

-- Crear índices para búsquedas eficientes (idempotentes)
CREATE INDEX IF NOT EXISTS idx_clientes_history_cliente_id ON clientes_history(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_history_changed_at ON clientes_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_clientes_history_changed_by ON clientes_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_clientes_history_action ON clientes_history(action);

-- Comentarios para documentación
COMMENT ON TABLE clientes_history IS 'Historial completo de cambios en clientes para auditoría';
COMMENT ON COLUMN clientes_history.cliente_id IS 'ID del cliente modificado';
COMMENT ON COLUMN clientes_history.changed_by IS 'Usuario que realizó el cambio';
COMMENT ON COLUMN clientes_history.action IS 'Tipo de acción: created, updated, deleted, restored';
COMMENT ON COLUMN clientes_history.field_name IS 'Campo específico modificado (para updates)';
