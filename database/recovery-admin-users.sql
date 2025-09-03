-- SCRIPT DE RECUPERACIÓN DE USUARIOS ADMIN
-- Ejecutar en PostgreSQL: gestion_pedidos

-- Opción 1: Insertar usuario admin con contraseña fuerte
INSERT INTO public.admin_users (
    id, 
    username, 
    password_hash, 
    role, 
    display_name, 
    is_active, 
    created_at
) VALUES (
    'admin-' || extract(epoch from now())::text,
    'admin',
    '$2a$12$PjppiNRXBF5XYW.QeBjig.EMg4v5tFvGtREMPARC6zIKQzlh0uxWS', -- Admin#2025!
    'admin',
    'Administrador Principal',
    TRUE,
    NOW()
) ON CONFLICT (username) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    is_active = TRUE,
    updated_at = NOW();

-- Opción 2: Crear usuario admin alternativo
INSERT INTO public.admin_users (
    id, 
    username, 
    password_hash, 
    role, 
    display_name, 
    is_active, 
    created_at
) VALUES (
    'admin-backup-' || extract(epoch from now())::text,
    'pigmea_admin',
    '$2a$12$PjppiNRXBF5XYW.QeBjig.EMg4v5tFvGtREMPARC6zIKQzlh0uxWS', -- Admin#2025!
    'admin',
    'Administrador Pigmea',
    TRUE,
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- Verificar usuarios creados
SELECT 
    id, 
    username, 
    role, 
    display_name, 
    is_active, 
    created_at,
    last_login_at
FROM public.admin_users 
ORDER BY created_at DESC;

-- Si necesitas cambiar contraseña de un usuario existente:
-- UPDATE public.admin_users 
-- SET password_hash = '$2a$12$PjppiNRXBF5XYW.QeBjig.EMg4v5tFvGtREMPARC6zIKQzlh0uxWS'
-- WHERE username = 'admin';
