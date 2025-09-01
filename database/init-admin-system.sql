-- =================================================================
-- SISTEMA ADMINISTRATIVO PIGMEA - INICIALIZACIÓN DE BASE DE DATOS
-- =================================================================

-- Crear extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- TABLA DE USUARIOS ADMINISTRATIVOS
-- =================================================================

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER')),
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- TABLA DE LOGS DE AUDITORÍA
-- =================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    affected_resource UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- TABLA DE SESIONES ADMINISTRATIVAS
-- =================================================================

CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- TABLA DE CONFIGURACIÓN DEL SISTEMA
-- =================================================================

CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
    is_encrypted BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- TABLA DE BACKUPS DE BASE DE DATOS
-- =================================================================

CREATE TABLE IF NOT EXISTS database_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    backup_type VARCHAR(20) DEFAULT 'manual' CHECK (backup_type IN ('manual', 'automatic')),
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('completed', 'failed', 'in_progress')),
    error_message TEXT,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =================================================================
-- TABLA DE NOTIFICACIONES DEL SISTEMA
-- =================================================================

CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(20) DEFAULT 'info' CHECK (notification_type IN ('info', 'warning', 'error', 'success')),
    target_users JSONB DEFAULT '[]'::jsonb, -- Array de user IDs, vacío = todos
    is_read BOOLEAN DEFAULT false,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- =================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =================================================================

-- Índices para admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_last_activity ON admin_users(last_activity);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_username ON audit_logs(username);

-- Índices para admin_sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_is_active ON admin_sessions(is_active);

-- Índices para system_config
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category);

-- Índices para database_backups
CREATE INDEX IF NOT EXISTS idx_database_backups_created_at ON database_backups(created_at);
CREATE INDEX IF NOT EXISTS idx_database_backups_status ON database_backups(status);
CREATE INDEX IF NOT EXISTS idx_database_backups_type ON database_backups(backup_type);

-- Índices para system_notifications
CREATE INDEX IF NOT EXISTS idx_system_notifications_created_at ON system_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_system_notifications_type ON system_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_system_notifications_expires_at ON system_notifications(expires_at);

-- =================================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- =================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para admin_users
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para system_config
CREATE TRIGGER update_system_config_updated_at 
    BEFORE UPDATE ON system_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para admin_sessions
CREATE TRIGGER update_admin_sessions_updated_at 
    BEFORE UPDATE ON admin_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- CONFIGURACIÓN INICIAL DEL SISTEMA
-- =================================================================

-- Insertar configuraciones por defecto
INSERT INTO system_config (config_key, config_value, description, category, value_type) VALUES
('system.name', 'Sistema de Gestión Pigmea', 'Nombre del sistema', 'general', 'string'),
('system.version', '1.0.0', 'Versión del sistema', 'general', 'string'),
('auth.session_timeout', '28800', 'Timeout de sesión en segundos (8 horas)', 'auth', 'number'),
('auth.max_login_attempts', '5', 'Máximo número de intentos de login', 'auth', 'number'),
('backup.retention_days', '30', 'Días de retención de backups', 'backup', 'number'),
('backup.auto_backup', 'true', 'Backup automático habilitado', 'backup', 'boolean'),
('audit.retention_days', '90', 'Días de retención de logs de auditoría', 'audit', 'number'),
('notifications.email_enabled', 'false', 'Notificaciones por email habilitadas', 'notifications', 'boolean'),
('system.maintenance_mode', 'false', 'Modo de mantenimiento', 'system', 'boolean')
ON CONFLICT (config_key) DO NOTHING;

-- =================================================================
-- USUARIO ADMINISTRADOR INICIAL
-- =================================================================

-- Insertar usuario admin inicial (contraseña: admin123)
-- Hash generado con bcrypt, 12 rounds: admin123
INSERT INTO admin_users (
    username, 
    email, 
    first_name, 
    last_name, 
    password_hash, 
    role,
    permissions
) VALUES (
    'admin', 
    'admin@pigmea.com', 
    'Administrador', 
    'Principal', 
    '$2b$12$LQv3c1yqBwEHvEfnUUQZT.JQnQE7vOE8KoKjUpXc4mA8WiGp7Y.O2', -- admin123
    'ADMIN',
    '["dashboard.view","users.view","users.create","users.edit","users.delete","audit.view","audit.export","system.view","system.manage","database.view","database.backup","settings.view","settings.edit"]'::jsonb
) ON CONFLICT (username) DO NOTHING;

-- =================================================================
-- PERMISOS Y ROLES PREDEFINIDOS
-- =================================================================

-- Insertar usuarios de ejemplo con diferentes roles
INSERT INTO admin_users (
    username, email, first_name, last_name, password_hash, role, permissions
) VALUES 
(
    'supervisor', 
    'supervisor@pigmea.com', 
    'Usuario', 
    'Supervisor', 
    '$2b$12$LQv3c1yqBwEHvEfnUUQZT.JQnQE7vOE8KoKjUpXc4mA8WiGp7Y.O2', -- admin123
    'SUPERVISOR',
    '["dashboard.view","users.view","audit.view","system.view","database.view","settings.view"]'::jsonb
),
(
    'operator', 
    'operator@pigmea.com', 
    'Usuario', 
    'Operador', 
    '$2b$12$LQv3c1yqBwEHvEfnUUQZT.JQnQE7vOE8KoKjUpXc4mA8WiGp7Y.O2', -- admin123
    'OPERATOR',
    '["dashboard.view","system.view"]'::jsonb
),
(
    'viewer', 
    'viewer@pigmea.com', 
    'Usuario', 
    'Visualizador', 
    '$2b$12$LQv3c1yqBwEHvEfnUUQZT.JQnQE7vOE8KoKjUpXc4mA8WiGp7Y.O2', -- admin123
    'VIEWER',
    '["dashboard.view"]'::jsonb
)
ON CONFLICT (username) DO NOTHING;

-- =================================================================
-- FUNCIONES AUXILIARES
-- =================================================================

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    retention_days INTEGER;
    deleted_count INTEGER;
BEGIN
    -- Obtener días de retención de la configuración
    SELECT config_value::INTEGER INTO retention_days 
    FROM system_config 
    WHERE config_key = 'audit.retention_days';
    
    -- Si no está configurado, usar 90 días por defecto
    IF retention_days IS NULL THEN
        retention_days := 90;
    END IF;
    
    -- Eliminar logs antiguos
    DELETE FROM audit_logs 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Registrar la limpieza en auditoría
    INSERT INTO audit_logs (user_id, username, action, module, details)
    VALUES (NULL, 'SYSTEM', 'CLEANUP_LOGS', 'MAINTENANCE', 
            'Eliminados ' || deleted_count || ' logs de más de ' || retention_days || ' días');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas del sistema
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM admin_users),
        'active_users', (SELECT COUNT(*) FROM admin_users WHERE is_active = true),
        'total_audit_logs', (SELECT COUNT(*) FROM audit_logs),
        'recent_logins', (SELECT COUNT(*) FROM admin_users WHERE last_login > CURRENT_TIMESTAMP - INTERVAL '24 hours'),
        'total_backups', (SELECT COUNT(*) FROM database_backups),
        'successful_backups', (SELECT COUNT(*) FROM database_backups WHERE status = 'completed'),
        'system_notifications', (SELECT COUNT(*) FROM system_notifications WHERE expires_at > CURRENT_TIMESTAMP OR expires_at IS NULL)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- NOTIFICACIÓN DE INICIALIZACIÓN COMPLETADA
-- =================================================================

-- Insertar notificación de sistema inicializado
INSERT INTO system_notifications (
    title,
    message,
    notification_type,
    target_users,
    created_by
) VALUES (
    'Sistema Administrativo Inicializado',
    'El sistema administrativo de Pigmea ha sido configurado exitosamente. Todas las tablas y datos iniciales han sido creados.',
    'success',
    '[]'::jsonb,
    (SELECT id FROM admin_users WHERE username = 'admin' LIMIT 1)
);

-- =================================================================
-- VERIFICACIÓN FINAL
-- =================================================================

-- Mostrar resumen de inicialización
DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'SISTEMA ADMINISTRATIVO PIGMEA - INICIALIZACIÓN COMPLETADA';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Tablas creadas: admin_users, audit_logs, admin_sessions, system_config, database_backups, system_notifications';
    RAISE NOTICE 'Usuarios creados: admin, supervisor, operator, viewer';
    RAISE NOTICE 'Configuración inicial aplicada';
    RAISE NOTICE 'Funciones auxiliares creadas';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'CREDENCIALES DE ACCESO INICIAL:';
    RAISE NOTICE 'Usuario: admin';
    RAISE NOTICE 'Contraseña: admin123';
    RAISE NOTICE 'URL: http://localhost:3001';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '⚠️  IMPORTANTE: Cambiar la contraseña del administrador después del primer login';
    RAISE NOTICE '================================================================';
END $$;
