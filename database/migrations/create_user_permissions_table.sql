-- Migración para crear la tabla de permisos de usuario
-- Este script crea las tablas en el orden correcto para evitar errores de dependencias

-- 1. Crear extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tabla admin_users PRIMERO (debe existir antes que user_permissions)
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

-- 3. Crear tabla user_permissions DESPUÉS (inicialmente sin claves foráneas)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    permission_id VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    granted_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission_id)
);

-- 3.1 Intentar agregar claves foráneas de forma segura
DO $$ 
BEGIN
    -- Verificar que la constraint no exista antes de crearla
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_permissions_user_id_fkey'
    ) THEN
        ALTER TABLE user_permissions 
        ADD CONSTRAINT user_permissions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_permissions_granted_by_fkey'
    ) THEN
        ALTER TABLE user_permissions 
        ADD CONSTRAINT user_permissions_granted_by_fkey 
        FOREIGN KEY (granted_by) REFERENCES admin_users(id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Si falla, continuar sin las claves foráneas
    RAISE NOTICE 'No se pudieron crear las claves foráneas de user_permissions: %', SQLERRM;
END $$;

-- 4. Índices para mejorar el rendimiento de consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- 5. Función y trigger para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para user_permissions
DROP TRIGGER IF EXISTS update_user_permissions_modtime ON user_permissions;
CREATE TRIGGER update_user_permissions_modtime
    BEFORE UPDATE ON user_permissions
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Trigger para admin_users
DROP TRIGGER IF EXISTS update_admin_users_modtime ON admin_users;
CREATE TRIGGER update_admin_users_modtime
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
