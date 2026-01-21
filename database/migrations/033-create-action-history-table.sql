-- Migration: Create action_history table for tracking all system activities
-- Description: Creates a centralized table to store activity history for pedidos, clientes, vendedores, materiales, etc.

-- Create action_history table
CREATE TABLE IF NOT EXISTS action_history (
    id VARCHAR(255) PRIMARY KEY,
    context_id VARCHAR(255) NOT NULL,
    context_type VARCHAR(50) NOT NULL CHECK (context_type IN ('pedido', 'cliente', 'vendedor', 'material')),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'UNARCHIVE', 'MOVE', 'COMPLETE')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_action_history_context ON action_history(context_id, context_type);
CREATE INDEX IF NOT EXISTS idx_action_history_timestamp ON action_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_action_history_user ON action_history(user_id);
CREATE INDEX IF NOT EXISTS idx_action_history_type ON action_history(context_type, action_type);

-- Add comment
COMMENT ON TABLE action_history IS 'Centralized activity history for all system entities (pedidos, clientes, vendedores, materiales)';
COMMENT ON COLUMN action_history.context_id IS 'ID of the entity affected (pedidoId, clienteId, etc.)';
COMMENT ON COLUMN action_history.context_type IS 'Type of entity: pedido, cliente, vendedor, material';
COMMENT ON COLUMN action_history.action_type IS 'Type of action performed: CREATE, UPDATE, DELETE, etc.';
COMMENT ON COLUMN action_history.payload IS 'JSON payload containing before/after state and additional metadata';
COMMENT ON COLUMN action_history.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN action_history.user_name IS 'Display name of the user';
COMMENT ON COLUMN action_history.description IS 'Human-readable description of the action';
