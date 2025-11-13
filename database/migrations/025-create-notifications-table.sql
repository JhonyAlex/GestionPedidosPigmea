-- ✅ Migración 025: Crear tabla de notificaciones del sistema
-- Descripción: Almacena notificaciones en tiempo real con historial de hasta 50 por usuario
-- Idempotente: Puede ejecutarse múltiples veces sin errores

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('success', 'info', 'warning', 'error')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    pedido_id VARCHAR(255),
    metadata JSONB,
    user_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_pedido_id ON notifications(pedido_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_timestamp ON notifications(user_id, timestamp DESC);

-- Comentarios en la tabla
COMMENT ON TABLE notifications IS 'Almacena notificaciones del sistema en tiempo real (max 50 por usuario)';
COMMENT ON COLUMN notifications.id IS 'ID único de la notificación (timestamp + random)';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificación: success, info, warning, error';
COMMENT ON COLUMN notifications.title IS 'Título corto de la notificación';
COMMENT ON COLUMN notifications.message IS 'Mensaje descriptivo de la notificación';
COMMENT ON COLUMN notifications.timestamp IS 'Marca de tiempo del evento que generó la notificación';
COMMENT ON COLUMN notifications.read IS 'Indica si la notificación ha sido leída por el usuario';
COMMENT ON COLUMN notifications.pedido_id IS 'ID del pedido relacionado (si aplica)';
COMMENT ON COLUMN notifications.metadata IS 'Datos adicionales en formato JSON (cliente, prioridad, etapaActual, cambios, etc.)';
COMMENT ON COLUMN notifications.user_id IS 'ID del usuario destinatario (null = para todos)';
COMMENT ON COLUMN notifications.created_at IS 'Fecha de creación en la base de datos';
